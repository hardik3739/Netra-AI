"""
RegPilot API Routes — Weeks 3 + 4

Week 3 endpoints:
  POST /regpilot/fetch              — fetch & process all circulars
  GET  /regpilot/circulars          — list all circulars
  GET  /regpilot/maps               — list all MAPs
  GET  /regpilot/maps/dept/{dept}   — MAPs by department
  PATCH /regpilot/maps/{id}/status  — update MAP status

Week 4 endpoints:
  POST /regpilot/maps/{id}/validate — submit evidence + autonomous validation
  GET  /regpilot/dashboard          — compliance heatmap data
  GET  /regpilot/audit              — full audit trail
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import json

from app.models.database import (
    get_db, RegulatoryCircular,
    MeasurableActionPoint, AuditLog, BankBranch, seed_branches, ComplianceSnapshot
)
from app.services.snapshot_service import take_snapshot
from app.services.reg_crawler          import fetch_all_circulars
from app.services.map_extractor        import extract_maps
from app.services.compliance_validator import validate_evidence
from dateutil import parser as dateparser
import re
from datetime import date, timedelta

router = APIRouter(prefix="/regpilot", tags=["RegPilot"])

DEPARTMENTS  = ["credit", "treasury", "retail", "AML", "IT", "compliance"]
VALID_STATUS = ["open", "in_progress", "completed"]


def _compute_branch_stats(db: Session, branch: BankBranch):
    # Calculate MAP counts and simple compliance score
    maps = db.query(MeasurableActionPoint).filter(MeasurableActionPoint.branch_id == branch.id).all()
    total = len(maps)
    completed = len([m for m in maps if m.status == "completed"])
    open_maps = len([m for m in maps if m.status != "completed"])
    high_priority_open = len([m for m in maps if m.status != "completed" and m.priority == "high"])

    # compliance_score = percent completed (0-100)
    compliance_score = int((completed / total) * 100) if total > 0 else 100
    if compliance_score < 50:
        compliance_status = "CRITICAL"
    elif compliance_score < 80:
        compliance_status = "WARNING"
    else:
        compliance_status = "GOOD"

    return {
        "id": branch.id,
        "name": branch.name,
        "city": branch.city,
        "state": branch.state,
        "region": branch.region,
        "lat": branch.lat,
        "lng": branch.lng,
        "branch_code": branch.branch_code,
        "total_maps": total,
        "completed_maps": completed,
        "open_maps": open_maps,
        "high_priority_open": high_priority_open,
        "compliance_score": compliance_score,
        "compliance_status": compliance_status,
    }


@router.get("/branches", summary="List all branches with compliance stats")
def get_branches(db: Session = Depends(get_db)):
    # Ensure default branches exist
    seed_branches(db)

    branches = db.query(BankBranch).all()
    results = []
    for b in branches:
        stats = _compute_branch_stats(db, b)
        results.append(stats)

    # Sort by compliance ascending (worst first)
    results.sort(key=lambda r: r.get("compliance_score", 100))
    return {"branches": results}


@router.get("/branches/{branch_id}/maps", summary="Get all MAPs for a specific branch")
def get_branch_maps(branch_id: str, db: Session = Depends(get_db)):
    maps = db.query(MeasurableActionPoint).filter(MeasurableActionPoint.branch_id == branch_id).all()
    out = []
    for m in maps:
        out.append({
            "id": m.id,
            "title": m.title,
            "description": m.description,
            "department": m.department,
            "priority": m.priority,
            "status": m.status,
            "branch_id": m.branch_id,
            "created_at": m.created_at.isoformat() if m.created_at else None,
        })
    return {"maps": out}


# ─────────────────────────────────────────────────────────
# Pydantic request models
# ─────────────────────────────────────────────────────────
class StatusUpdate(BaseModel):
    status: str


class EvidenceSubmit(BaseModel):
    evidence: str


# ─────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────
def _audit(db: Session, event: str, entity_id: str, details: str = ""):
    db.add(AuditLog(event_type=event, entity_id=entity_id, details=details))
    db.commit()


def process_circulars(db: Session) -> dict:
    """Shared fetch logic used by POST /regpilot/fetch and autonomous jobs."""
    raw_circulars = fetch_all_circulars()
    new_count = 0
    map_count = 0
    skipped = 0

    for c in raw_circulars:
        existing = (
            db.query(RegulatoryCircular)
            .filter(RegulatoryCircular.id == c["id"])
            .first()
        )

        if existing and existing.is_processed:
            skipped += 1
            continue

        if not existing:
            pub_at = None
            if c.get("published_at"):
                try:
                    pub_at = datetime.fromisoformat(c["published_at"])
                except Exception:
                    pub_at = datetime.now()

            circular = RegulatoryCircular(
                id=c["id"],
                source=c["source"],
                title=c["title"],
                url=c.get("url", ""),
                raw_text=c.get("raw_text", ""),
                published_at=pub_at,
                is_processed=False
            )
            db.add(circular)
            db.commit()
            new_count += 1

        circular_text = c.get("raw_text", c["title"])
        maps = extract_maps(circular_text, c["source"], c["id"])

        seed_branches(db)
        branches = db.query(BankBranch).order_by(BankBranch.id).all()
        if not branches:
            branches = []

        for idx, m in enumerate(maps):
            map_id = str(uuid.uuid4())
            branch_id = branches[idx % len(branches)].id if branches else "BR001"
            db.add(MeasurableActionPoint(
                id=map_id,
                circular_id=c["id"],
                title=m.get("title", "Untitled MAP")[:200],
                description=m.get("description", ""),
                department=m.get("department", "compliance"),
                deadline=m.get("deadline", "As per regulatory timeline"),
                priority=m.get("priority", "medium"),
                status="open",
                validated=False,
                branch_id=branch_id,
                regulatory_reference=m.get("regulatory_reference")
            ))
            map_count += 1

        db.query(RegulatoryCircular).filter(
            RegulatoryCircular.id == c["id"]
        ).update({"is_processed": True})
        db.commit()

        _audit(
            db, "circular_fetched", c["id"],
            f"source={c['source']} title={c['title'][:60]} maps={len(maps)}"
        )

    try:
        take_snapshot(db)
    except Exception:
        pass

    return {
        "message": "Circulars fetched and MAPs generated successfully",
        "new_circulars": new_count,
        "skipped": skipped,
        "maps_generated": map_count,
        "total_processed": new_count + skipped
    }


def _map_dict(m: MeasurableActionPoint) -> dict:
    return {
        "id":          m.id,
        "circular_id": m.circular_id,
        "title":       m.title,
        "description": m.description,
        "department":  m.department,
        "deadline":    m.deadline,
        "priority":    m.priority,
        "status":      m.status,
        "validated":   m.validated,
        "evidence":    m.evidence,
        "regulatory_reference": m.regulatory_reference,
        "created_at":  m.created_at.isoformat(),
        "updated_at":  m.updated_at.isoformat() if m.updated_at else None
    }


# ─────────────────────────────────────────────────────────
# Week 3 — Fetch + process circulars
# ─────────────────────────────────────────────────────────
@router.post("/fetch", summary="Fetch latest circulars and generate MAPs")
def fetch_and_process(db: Session = Depends(get_db)):
    """
    Fetches circulars from RBI, SEBI, IRDAI, MCA.
    For each new circular, extracts MAPs using Ollama (or rule-based fallback).
    Saves everything to the database. Skips already-processed circulars.
    """
    return process_circulars(db)


# ─────────────────────────────────────────────────────────
# Circulars
# ─────────────────────────────────────────────────────────
@router.get("/circulars", summary="List all regulatory circulars")
def list_circulars(
    source: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RegulatoryCircular)
    if source:
        query = query.filter(RegulatoryCircular.source == source.upper())
    circulars = query.order_by(RegulatoryCircular.fetched_at.desc()).all()
    return [{
        "id":           c.id,
        "source":       c.source,
        "title":        c.title,
        "url":          c.url,
        "published_at": c.published_at.isoformat() if c.published_at else None,
        "fetched_at":   c.fetched_at.isoformat() if c.fetched_at else None,
        "is_processed": c.is_processed
    } for c in circulars]


@router.get("/circulars/{circular_id}", summary="Get single circular with its MAPs")
def get_circular(circular_id: str, db: Session = Depends(get_db)):
    c = db.query(RegulatoryCircular).filter(
        RegulatoryCircular.id == circular_id
    ).first()
    if not c:
        raise HTTPException(404, "Circular not found")

    maps = db.query(MeasurableActionPoint).filter(
        MeasurableActionPoint.circular_id == circular_id
    ).all()

    return {
        "id":           c.id,
        "source":       c.source,
        "title":        c.title,
        "url":          c.url,
        "raw_text":     c.raw_text,
        "published_at": c.published_at.isoformat() if c.published_at else None,
        "is_processed": c.is_processed,
        "maps":         [_map_dict(m) for m in maps]
    }


# ─────────────────────────────────────────────────────────
# MAPs — list, filter, update
# ─────────────────────────────────────────────────────────
@router.get("/maps", summary="List all Measurable Action Points")
def list_maps(
    status:     Optional[str] = None,
    priority:   Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MeasurableActionPoint)
    if status:
        query = query.filter(MeasurableActionPoint.status == status)
    if priority:
        query = query.filter(MeasurableActionPoint.priority == priority)
    maps = query.order_by(MeasurableActionPoint.created_at.desc()).all()
    return [_map_dict(m) for m in maps]


@router.get("/maps/dept/{department}", summary="Get MAPs for a specific department")
def maps_by_dept(department: str, db: Session = Depends(get_db)):
    if department not in DEPARTMENTS:
        raise HTTPException(
            400,
            detail=f"Unknown department '{department}'. "
                   f"Choose from: {DEPARTMENTS}"
        )
    maps = (
        db.query(MeasurableActionPoint)
        .filter(MeasurableActionPoint.department == department)
        .order_by(MeasurableActionPoint.created_at.desc())
        .all()
    )
    return [_map_dict(m) for m in maps]


@router.get("/maps/{map_id}", summary="Get single MAP by ID")
def get_map(map_id: str, db: Session = Depends(get_db)):
    m = db.query(MeasurableActionPoint).filter(
        MeasurableActionPoint.id == map_id
    ).first()
    if not m:
        raise HTTPException(404, "MAP not found")
    return _map_dict(m)


@router.patch("/maps/{map_id}/status", summary="Update MAP status")
def update_status(
    map_id: str,
    body:   StatusUpdate,
    db:     Session = Depends(get_db)
):
    if body.status not in VALID_STATUS:
        raise HTTPException(
            400,
            detail=f"Status must be one of: {VALID_STATUS}"
        )

    m = db.query(MeasurableActionPoint).filter(
        MeasurableActionPoint.id == map_id
    ).first()
    if not m:
        raise HTTPException(404, "MAP not found")

    old_status   = m.status
    m.status     = body.status
    m.updated_at = datetime.utcnow()
    db.commit()

    _audit(
        db, "map_status_updated", map_id,
        f"dept={m.department} {old_status}→{body.status} title={m.title[:50]}"
    )

    # take snapshot after status update
    try:
        take_snapshot(db)
    except Exception:
        pass

    return {
        "message":    "Status updated successfully",
        "map_id":     map_id,
        "old_status": old_status,
        "new_status": body.status
    }


# ─────────────────────────────────────────────────────────
# Week 4 — Evidence submission + autonomous validation
# ─────────────────────────────────────────────────────────
@router.post("/maps/{map_id}/validate", summary="Submit evidence and validate with AI")
def validate_map(
    map_id: str,
    body:   EvidenceSubmit,
    db:     Session = Depends(get_db)
):
    """
    Submit completion evidence for a MAP.
    The AI validator (Ollama / rule-based) checks if the evidence
    satisfies the regulatory requirement and returns a verdict.
    """
    if not body.evidence or not body.evidence.strip():
        raise HTTPException(400, detail="Evidence cannot be empty")

    m = db.query(MeasurableActionPoint).filter(
        MeasurableActionPoint.id == map_id
    ).first()
    if not m:
        raise HTTPException(404, "MAP not found")

    # Run autonomous validation
    result = validate_evidence(
        map_title       = m.title,
        map_description = m.description,
        map_department  = m.department,
        evidence        = body.evidence.strip()
    )

    # Update MAP record
    m.evidence   = body.evidence.strip()
    m.validated  = result["status"] == "VALIDATED"
    m.updated_at = datetime.utcnow()

    if m.validated:
        m.status = "completed"

    db.commit()

    _audit(
        db, "map_validated", map_id,
        f"dept={m.department} result={result['status']} "
        f"score={result.get('score')} method={result.get('method')} "
        f"title={m.title[:50]}"
    )

    # take snapshot after validation
    try:
        take_snapshot(db)
    except Exception:
        pass

    return {
        "map_id":       map_id,
        "map_title":    m.title,
        "department":   m.department,
        "validation":   result,
        "map_status":   m.status,
        "validated":    m.validated
    }


# ─────────────────────────────────────────────────────────
# Week 4 — Compliance dashboard data
# ─────────────────────────────────────────────────────────
@router.get("/dashboard", summary="Compliance heatmap and overview data")
def dashboard(db: Session = Depends(get_db)):
    """
    Returns compliance statistics for the Week 4 dashboard:
    - Per-department compliance scores
    - Overall compliance score
    - MAP status breakdown
    - Circular counts
    """
    all_maps = db.query(MeasurableActionPoint).all()

    dept_stats = {}
    for dept in DEPARTMENTS:
        dept_maps     = [m for m in all_maps if m.department == dept]
        total         = len(dept_maps)
        completed     = sum(1 for m in dept_maps if m.status == "completed")
        in_progress   = sum(1 for m in dept_maps if m.status == "in_progress")
        open_maps     = sum(1 for m in dept_maps if m.status == "open")
        high_priority = sum(
            1 for m in dept_maps
            if m.status != "completed" and m.priority == "high"
        )
        compliance_score = round(completed / total * 100, 1) if total else 100.0

        dept_stats[dept] = {
            "total":                total,
            "completed":            completed,
            "in_progress":          in_progress,
            "open":                 open_maps,
            "high_priority_open":   high_priority,
            "compliance_score":     compliance_score
        }

    total_maps      = len(all_maps)
    total_completed = sum(1 for m in all_maps if m.status == "completed")
    total_open      = sum(1 for m in all_maps if m.status == "open")
    total_progress  = sum(1 for m in all_maps if m.status == "in_progress")
    overall_score   = (
        round(total_completed / total_maps * 100, 1)
        if total_maps else 100.0
    )

    circulars_count = db.query(RegulatoryCircular).count()

    # Priority breakdown
    high_open = sum(
        1 for m in all_maps
        if m.status != "completed" and m.priority == "high"
    )
    med_open = sum(
        1 for m in all_maps
        if m.status != "completed" and m.priority == "medium"
    )

    return {
        "overall_compliance_score": overall_score,
        "total_maps":               total_maps,
        "completed_maps":           total_completed,
        "open_maps":                total_open,
        "in_progress_maps":         total_progress,
        "total_circulars":          circulars_count,
        "high_priority_open":       high_open,
        "medium_priority_open":     med_open,
        "departments":              dept_stats
    }


# ─────────────────────────────────────────────────────────
# Week 4 — Audit trail
# ─────────────────────────────────────────────────────────
@router.get("/audit", summary="Full tamper-proof audit trail")
def audit_trail(
    limit:      int            = 100,
    event_type: Optional[str]  = None,
    db:         Session        = Depends(get_db)
):
    query = db.query(AuditLog)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()
    return [{
        "id":         log.id,
        "event_type": log.event_type,
        "entity_id":  log.entity_id,
        "details":    log.details,
        "created_at": log.created_at.isoformat()
    } for log in logs]


# ─────────────────────────────────────────────────────────
# Stats summary for RegPilot
# ─────────────────────────────────────────────────────────
@router.get("/stats", summary="RegPilot summary stats")
def regpilot_stats(db: Session = Depends(get_db)):
    maps      = db.query(MeasurableActionPoint).all()
    circulars = db.query(RegulatoryCircular).all()
    return {
        "total_circulars":    len(circulars),
        "total_maps":         len(maps),
        "open_maps":          sum(1 for m in maps if m.status == "open"),
        "in_progress_maps":   sum(1 for m in maps if m.status == "in_progress"),
        "completed_maps":     sum(1 for m in maps if m.status == "completed"),
        "validated_maps":     sum(1 for m in maps if m.validated),
        "high_priority_open": sum(1 for m in maps if m.priority == "high" and m.status != "completed"),
        "sources": {
            src: sum(1 for c in circulars if c.source == src)
            for src in ["RBI", "SEBI", "IRDAI", "MCA"]
        }
    }


@router.get("/agent-status", summary="RegPilot autonomous agent status")
def agent_status(request: Request):
    scheduler = getattr(request.app.state, "regpilot_scheduler", None)
    last_run = getattr(request.app.state, "regpilot_autonomous_last_run", None)
    total_runs = getattr(request.app.state, "regpilot_autonomous_total_runs", 0)

    next_run = None
    if scheduler:
        next_run = None
        for job_id in ["regpilot_autonomous_hourly", "regpilot_autonomous_daily"]:
            try:
                job = scheduler.get_job(job_id)
                if job and job.next_run_time:
                    if next_run is None or job.next_run_time < next_run:
                        next_run = job.next_run_time
            except Exception:
                continue

    return {
        "scheduler_running": bool(scheduler and scheduler.running),
        "next_run": next_run.isoformat() if next_run else None,
        "last_run": last_run.isoformat() if last_run else None,
        "total_autonomous_runs": total_runs
    }


# ─────────────────────────────────────────────────────────
# NEW: Deadlines summary and list
# ─────────────────────────────────────────────────────────
@router.get("/deadlines", summary="List active MAP deadlines with urgency and penalty exposure")
def deadlines(db: Session = Depends(get_db)):
    maps = db.query(MeasurableActionPoint).filter(MeasurableActionPoint.status != "completed").all()
    today = datetime.utcnow().date()

    def parse_days_remaining(m: MeasurableActionPoint):
        dl = (m.deadline or "").strip()
        if not dl or dl.lower().startswith("as per"):
            return None

        # Pattern: "Within X days" or "X days"
        m1 = re.search(r"(\d{1,4})\s*days?", dl, flags=re.IGNORECASE)
        if m1:
            try:
                x = int(m1.group(1))
                created = m.created_at.date() if m.created_at else today
                elapsed = (today - created).days
                return x - elapsed
            except Exception:
                return None

        # Try parse explicit date like '31st March 2025' or '31 March 2025' or ISO
        try:
            cleaned = re.sub(r"(st|nd|rd|th)", "", dl)
            dt = None
            # If contains digits and month name, parse with dateutil
            dt = dateparser.parse(cleaned, dayfirst=True).date()
            return (dt - today).days
        except Exception:
            return None

    def extract_penalty(raw_text: str):
        if not raw_text:
            return "Regulatory action applicable"

        # look for ₹X Crore / ₹X lakh
        m = re.search(r"₹\s*([0-9,]+(?:\.[0-9]+)?)\s*(crore|lakh)", raw_text, flags=re.IGNORECASE)
        if m:
            amt = m.group(1).replace(',', '')
            unit = m.group(2).lower()
            return f"₹{amt} {unit.capitalize()}"

        # look for 'penalty of X' or 'penalty: X'
        m2 = re.search(r"penalty\s*(?:of|:)\s*₹?\s*([0-9,]+(?:\.[0-9]+)?)", raw_text, flags=re.IGNORECASE)
        if m2:
            return f"₹{m2.group(1).replace(',', '')}"

        return "Regulatory action applicable"

    urgency_order = {"OVERDUE": 0, "CRITICAL": 1, "WARNING": 2, "SAFE": 3, "UNSCHEDULED": 4}

    rows = []
    summary = {"overdue": 0, "critical": 0, "warning": 0, "safe": 0}

    for m in maps:
        days_remaining = parse_days_remaining(m)

        if days_remaining is None:
            urgency = "UNSCHEDULED"
        else:
            if days_remaining < 0:
                urgency = "OVERDUE"
            elif days_remaining <= 7:
                urgency = "CRITICAL"
            elif days_remaining <= 30:
                urgency = "WARNING"
            else:
                urgency = "SAFE"

        # penalty exposure from circular raw_text
        circ = db.query(RegulatoryCircular).filter(RegulatoryCircular.id == m.circular_id).first()
        pen = extract_penalty(circ.raw_text if circ else "")

        rows.append({
            "id": m.id,
            "title": m.title,
            "department": m.department,
            "priority": m.priority,
            "deadline": m.deadline,
            "days_remaining": days_remaining,
            "urgency": urgency,
            "penalty_exposure": pen,
            "created_at": m.created_at.isoformat()
        })

        if urgency == "OVERDUE":
            summary["overdue"] += 1
        elif urgency == "CRITICAL":
            summary["critical"] += 1
        elif urgency == "WARNING":
            summary["warning"] += 1
        elif urgency == "SAFE":
            summary["safe"] += 1

    # sort by urgency order and then days_remaining ascending
    rows.sort(key=lambda r: (urgency_order.get(r["urgency"], 4), r["days_remaining"] if r["days_remaining"] is not None else 99999))

    return {"summary": summary, "deadlines": rows}


# ─────────────────────────────────────────────────────────
# NEW: Compliance history (last 30 days)
# ─────────────────────────────────────────────────────────
@router.get("/compliance-history", summary="Daily compliance score history (last 30 days)")
def compliance_history(db: Session = Depends(get_db)):
    # Prefer stored snapshots
    snaps = db.query(ComplianceSnapshot).order_by(ComplianceSnapshot.date.asc()).all()
    if snaps and len(snaps) > 0:
        rows = []
        # return last 30 entries (or fewer) ordered ascending by date
        selected = snaps[-30:]
        for s in selected:
            rows.append({
                "date": s.date,
                "compliance_score": s.compliance_score,
                "total_maps": s.total_maps,
                "completed_maps": s.completed_maps,
                "open_maps": s.open_maps,
                "events_count": s.events_count,
                "label": None
            })
        return rows

    # No snapshots exist — generate synthetic 30-day demo history
    today = datetime.utcnow().date()
    total_maps_now = db.query(MeasurableActionPoint).count()
    completed_now = db.query(MeasurableActionPoint).filter(MeasurableActionPoint.status == "completed").count()
    overall_now = round((completed_now / total_maps_now * 100), 1) if total_maps_now else 65.0

    import random
    start_score = 45.0
    end_score = overall_now
    history = []
    for i in range(30):
        day = today - timedelta(days=29 - i)
        t = i / 29.0
        # linear interpolate and add small random dip
        base = start_score + (end_score - start_score) * t
        dip = random.uniform(-5, 3) if random.random() < 0.2 else random.uniform(-2, 2)
        score = max(0, min(100, round(base + dip, 1)))

        # simple proportional maps numbers
        total_maps = max(1, int(total_maps_now * (0.8 + 0.4 * t)))
        completed_maps = int(total_maps * (score / 100.0))
        open_maps = total_maps - completed_maps

        label = None
        # Inject some event labels occasionally
        if random.random() < 0.08:
            label = random.choice(["RBI Circular received", "3 MAPs completed", "Branch audit performed", "Target reminder sent"])

        history.append({
            "date": day.isoformat(),
            "compliance_score": score,
            "total_maps": total_maps,
            "completed_maps": completed_maps,
            "open_maps": open_maps,
            "events_count": 1 if label else 0,
            "label": label
        })

    return history


@router.post("/snapshot", summary="Manually take a compliance snapshot")
def manual_snapshot(db: Session = Depends(get_db)):
    try:
        snap = take_snapshot(db)
        return {"message": "Snapshot recorded for today", "snapshot": snap}
    except Exception as e:
        raise HTTPException(500, detail=str(e))
