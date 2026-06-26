"""
ForgeShield API Routes — Weeks 1 + 2

Week 1 endpoints:
  POST /forgeshield/analyze        — ViT-only scan
  GET  /forgeshield/history        — scan history
  GET  /forgeshield/result/{id}    — single result
  GET  /forgeshield/stats          — summary statistics

Week 2 endpoints:
  POST /forgeshield/analyze/full   — ViT + NLP + GNN combined scan
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.models.database import (
    get_db, ScanResult, EnrichedScanResult, AuditLog
)
from app.services.vit_analyzer  import analyze_document
from app.services.nlp_engine    import run_semantic_analysis
from app.services.gnn_analyzer  import analyze_graph_coherence, generate_heatmap_data
from app.services.ocr_service   import extract_text_from_bytes
from app.services.fraud_patterns import match_patterns, FRAUD_PATTERNS
from app.services.decision_engine import generate_decision
import uuid
import json
import hashlib

from app.services.report_generator import generate_narrative

router = APIRouter(prefix="/forgeshield", tags=["ForgeShield"])

ALLOWED_TYPES  = {
    "application/pdf", "image/jpeg", "image/png",
    "image/jpg", "image/webp"
}
MAX_FILE_BYTES = 10 * 1024 * 1024  # 10 MB


def _audit(db: Session, event: str, entity_id: str, details: str = ""):
    """Write an audit log entry."""
    db.add(AuditLog(event_type=event, entity_id=entity_id, details=details))
    db.commit()


# ─────────────────────────────────────────────────────────
# Week 1 — Basic ViT scan
# ─────────────────────────────────────────────────────────
@router.post("/analyze", summary="Quick ViT scan (Week 1)")
async def analyze_basic(
    file: UploadFile = File(...),
    db:   Session    = Depends(get_db)
):
    """
    Upload a document and run ViT pixel-level forgery detection.
    Returns risk_score, verdict, confidence, and detection indicators.
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            400,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Allowed: PDF, JPG, PNG"
        )

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(400, detail="File exceeds 10MB limit")

    if len(file_bytes) == 0:
        raise HTTPException(400, detail="Uploaded file is empty")

    # Run ViT analysis
    result  = analyze_document(file_bytes, file.filename)
    scan_id = str(uuid.uuid4())

    # Save to DB
    db.add(ScanResult(
        id         = scan_id,
        filename   = file.filename,
        file_type  = file.content_type,
        risk_score = result["risk_score"],
        verdict    = result["verdict"],
        confidence = result["confidence"],
        details    = result.get("details")
    ))
    db.commit()

    _audit(db, "scan_basic", scan_id,
           f"file={file.filename} risk={result['risk_score']}")

    return {
        "scan_id":    scan_id,
        "filename":   file.filename,
        "type":       "basic",
        "risk_score": result["risk_score"],
        "verdict":    result["verdict"],
        "confidence": result["confidence"],
        "details":    result.get("details"),
        "indicators": json.loads(result.get("details", "{}")).get("indicators", [])
    }


# ─────────────────────────────────────────────────────────
# Week 2 — Full ViT + NLP + GNN scan
# ─────────────────────────────────────────────────────────
@router.post("/analyze/full", summary="Full AI scan — ViT + NLP + GNN (Week 2)")
async def analyze_full(
    file: UploadFile = File(...),
    db:   Session    = Depends(get_db)
):
    """
    Full multi-layer document analysis:
    1. ViT — pixel-level forgery detection
    2. NLP — semantic cross-validation vs MCA21 + CERSAI
    3. GNN — entity graph coherence analysis
    4. Weighted risk score combining all three layers
    """
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()

    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(400, detail="File exceeds 10MB limit")

    if len(file_bytes) == 0:
        raise HTTPException(400, detail="Uploaded file is empty")

    # ── Layer 1: ViT pixel analysis ───────────────────────
    vit_result = analyze_document(file_bytes, file.filename)
    scan_id    = str(uuid.uuid4())

    db.add(ScanResult(
        id         = scan_id,
        filename   = file.filename,
        file_type  = file.content_type,
        risk_score = vit_result["risk_score"],
        verdict    = vit_result["verdict"],
        confidence = vit_result["confidence"],
        details    = vit_result.get("details")
    ))
    db.commit()

    # ── Layer 2: OCR → extract document text ─────────────
    doc_text = extract_text_from_bytes(file_bytes, file.content_type)
    if not doc_text.strip():
        # Fallback: use filename as minimal context
        doc_text = f"Document filename: {file.filename}"

    # ── Layer 3: NLP semantic analysis ───────────────────
    nlp_result = run_semantic_analysis(doc_text)

    # ── Layer 4: GNN graph coherence ─────────────────────
    entities   = nlp_result.get("entities", {})
    gnn_result = analyze_graph_coherence(entities)

    # ── Layer 5: Weighted final risk score ────────────────
    # Weights: ViT 50%, NLP 30%, GNN 20%
    final_score = round(
        vit_result["risk_score"]        * 0.50 +
        nlp_result["semantic_score"]    * 0.30 +
        gnn_result["graph_score"]       * 0.20,
        2
    )

    if final_score > 70:
        final_verdict = "HIGH RISK — Multiple anomaly layers detected"
    elif final_score > 40:
        final_verdict = "MEDIUM RISK — Cross-validation anomalies found"
    else:
        final_verdict = "LOW RISK — Document passes all integrity checks"

    # ── Layer 6: Heatmap region generation ───────────────
    heatmap = generate_heatmap_data(
        vit_result["risk_score"],
        nlp_result["semantic_score"],
        gnn_result["graph_score"]
    )

    # Save enriched result
    enriched_id = str(uuid.uuid4())
    db.add(EnrichedScanResult(
        id               = enriched_id,
        scan_id          = scan_id,
        semantic_score   = nlp_result["semantic_score"],
        graph_score      = gnn_result["graph_score"],
        final_risk_score = final_score,
        mca21_status     = nlp_result.get("mca21_status"),
        cersai_status    = nlp_result.get("cersai_status"),
        nlp_flags        = nlp_result.get("nlp_flags"),
        gnn_anomalies    = json.dumps(gnn_result.get("anomalies", [])),
        entities         = json.dumps(entities),
        heatmap_data     = json.dumps(heatmap)
    ))
    db.commit()

    _audit(db, "scan_full", scan_id,
           f"file={file.filename} final={final_score} "
           f"vit={vit_result['risk_score']} "
           f"nlp={nlp_result['semantic_score']} "
           f"gnn={gnn_result['graph_score']}")

    # Prepare NLP flags list robustly for pattern matching
    nlp_flags_raw = nlp_result.get("nlp_flags", [])
    try:
        nlp_flags_list = json.loads(nlp_flags_raw) if isinstance(nlp_flags_raw, str) else nlp_flags_raw
    except Exception:
        nlp_flags_list = [nlp_flags_raw] if nlp_flags_raw else []

    matched_patterns = match_patterns(nlp_flags_list, entities, vit_result["risk_score"], file.filename)

    # Underwriter decision assistant
    decision = generate_decision({
        "final_score": final_score,
        "nlp_flags": json.loads(nlp_result.get("nlp_flags", "[]")),
        "vit_score": vit_result["risk_score"],
        "filename": file.filename
    })

    analysis_narrative = generate_narrative(
        doc_text,
        {
            "final_score": final_score,
            "verdict": final_verdict,
            "nlp_flags": json.loads(nlp_result.get("nlp_flags", "[]")),
            "gnn_anomalies": gnn_result.get("anomalies", []),
            "filename": file.filename
        },
        file.filename,
        mode="full"
    )

    return {
        "scan_id":        scan_id,
        "filename":       file.filename,
        "type":           "full",
        # Individual layer scores
        "vit_score":      vit_result["risk_score"],
        "semantic_score": nlp_result["semantic_score"],
        "graph_score":    gnn_result["graph_score"],
        # Combined
        "final_score":    final_score,
        "risk_score":     final_score,   # alias for frontend compatibility
        "verdict":        final_verdict,
        "confidence":     vit_result["confidence"],
        "analysis_narrative": analysis_narrative,
        # Details
        "nlp_flags":      json.loads(nlp_result.get("nlp_flags", "[]")),
        "gnn_anomalies":  gnn_result.get("anomalies", []),
        "heatmap":        heatmap,
        "entities":       entities,
        "mca21":          json.loads(nlp_result.get("mca21_status", "{}")),
        "cersai":         json.loads(nlp_result.get("cersai_status", "{}")),
        "node_count":     gnn_result.get("node_count", 0),
        "edge_count":     gnn_result.get("edge_count", 0),
        "matched_patterns": matched_patterns,
        "decision": decision
    }


@router.post("/demo-scan", summary="Replay demo scan with narrative")
async def demo_scan(
    file: UploadFile = File(...),
    db:   Session    = Depends(get_db)
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(400, detail="File exceeds 10MB limit")
    if len(file_bytes) == 0:
        raise HTTPException(400, detail="Uploaded file is empty")

    filename_lower = file.filename.lower()
    seed = int(hashlib.sha256(file.filename.encode("utf-8")).hexdigest()[:8], 16)
    vit_score = float(30 + (seed % 55))
    if any(term in filename_lower for term in ["fraud", "fake", "mortgage", "struck", "forgery"]):
        vit_score = min(95.0, vit_score + 25.0)
    vit_verdict = (
        "HIGH RISK — Multiple anomaly layers detected"
        if vit_score > 70 else
        "MEDIUM RISK — Cross-validation anomalies found"
        if vit_score > 40 else
        "LOW RISK — Document passes all integrity checks"
    )
    confidence = float(65 + (seed % 25))

    doc_text = extract_text_from_bytes(file_bytes, file.content_type)
    if not doc_text.strip():
        doc_text = f"Demo scan generated from filename: {file.filename}."

    nlp_result = run_semantic_analysis(doc_text)
    entities = nlp_result.get("entities", {})
    gnn_result = analyze_graph_coherence(entities)

    final_score = round(
        vit_score * 0.50 +
        nlp_result["semantic_score"] * 0.30 +
        gnn_result["graph_score"] * 0.20,
        1
    )
    final_verdict = (
        "HIGH RISK — Multiple anomaly layers detected"
        if final_score > 70 else
        "MEDIUM RISK — Cross-validation anomalies found"
        if final_score > 40 else
        "LOW RISK — Document passes all integrity checks"
    )

    analysis_narrative = generate_narrative(
        doc_text,
        {
            "final_score": final_score,
            "verdict": final_verdict,
            "nlp_flags": json.loads(nlp_result.get("nlp_flags", "[]")),
            "gnn_anomalies": gnn_result.get("anomalies", []),
            "filename": file.filename
        },
        file.filename,
        mode="demo"
    )

    matched_patterns = match_patterns(
        json.loads(nlp_result.get("nlp_flags", "[]")),
        entities,
        vit_score,
        file.filename
    )

    scan_id = str(uuid.uuid4())
    db.add(ScanResult(
        id         = scan_id,
        filename   = file.filename,
        file_type  = file.content_type,
        risk_score = vit_score,
        verdict    = vit_verdict,
        confidence = confidence,
        details    = json.dumps({
            "model": "phi3-demo-simulator",
            "image_size": "auto",
            "top_class": seed % 128,
            "risk_level": "high" if vit_score > 70 else "medium" if vit_score > 40 else "low",
            "indicators": [
                "Simulated demo mode output based on filename metadata",
                "Deterministic signature defined by the file name"
            ]
        })
    ))
    db.commit()

    db.add(EnrichedScanResult(
        id               = str(uuid.uuid4()),
        scan_id          = scan_id,
        semantic_score   = nlp_result["semantic_score"],
        graph_score      = gnn_result["graph_score"],
        final_risk_score = final_score,
        mca21_status     = nlp_result.get("mca21_status"),
        cersai_status    = nlp_result.get("cersai_status"),
        nlp_flags        = nlp_result.get("nlp_flags"),
        gnn_anomalies    = json.dumps(gnn_result.get("anomalies", [])),
        entities         = json.dumps(entities),
        heatmap_data     = json.dumps(generate_heatmap_data(vit_score, nlp_result["semantic_score"], gnn_result["graph_score"]))
    ))
    db.commit()

    _audit(db, "demo_scan", scan_id, f"file={file.filename} final={final_score} demo=true")

    return {
        "scan_id": scan_id,
        "filename": file.filename,
        "type": "demo",
        "vit_score": vit_score,
        "semantic_score": nlp_result["semantic_score"],
        "graph_score": gnn_result["graph_score"],
        "final_score": final_score,
        "risk_score": final_score,
        "verdict": final_verdict,
        "confidence": confidence,
        "analysis_narrative": analysis_narrative,
        "nlp_flags": json.loads(nlp_result.get("nlp_flags", "[]")),
        "gnn_anomalies": gnn_result.get("anomalies", []),
        "heatmap": generate_heatmap_data(vit_score, nlp_result["semantic_score"], gnn_result["graph_score"]),
        "entities": entities,
        "mca21": json.loads(nlp_result.get("mca21_status", "{}")),
        "cersai": json.loads(nlp_result.get("cersai_status", "{}")),
        "matched_patterns": matched_patterns,
        "decision": generate_decision({
            "final_score": final_score,
            "nlp_flags": json.loads(nlp_result.get("nlp_flags", "[]")),
            "vit_score": vit_score,
            "filename": file.filename
        })
    }


# ─────────────────────────────────────────────────────────
# History, Results, Stats
# ─────────────────────────────────────────────────────────
@router.get("/history", summary="Get all scan results")
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    results = (
        db.query(ScanResult)
        .order_by(ScanResult.created_at.desc())
        .limit(limit)
        .all()
    )
    return [{
        "scan_id":    r.id,
        "filename":   r.filename,
        "risk_score": r.risk_score,
        "verdict":    r.verdict,
        "confidence": r.confidence,
        "created_at": r.created_at.isoformat()
    } for r in results]


@router.get("/result/{scan_id}", summary="Get single scan result with enrichment")
def get_result(scan_id: str, db: Session = Depends(get_db)):
    r = db.query(ScanResult).filter(ScanResult.id == scan_id).first()
    if not r:
        raise HTTPException(404, "Scan result not found")

    enriched = (
        db.query(EnrichedScanResult)
        .filter(EnrichedScanResult.scan_id == scan_id)
        .first()
    )

    return {
        "scan_id":    r.id,
        "filename":   r.filename,
        "risk_score": r.risk_score,
        "verdict":    r.verdict,
        "confidence": r.confidence,
        "details":    r.details,
        "created_at": r.created_at.isoformat(),
        "enriched": {
            "semantic_score":  enriched.semantic_score,
            "graph_score":     enriched.graph_score,
            "final_score":     enriched.final_risk_score,
            "nlp_flags":       json.loads(enriched.nlp_flags or "[]"),
            "gnn_anomalies":   json.loads(enriched.gnn_anomalies or "[]"),
            "entities":        json.loads(enriched.entities or "{}"),
            "heatmap":         json.loads(enriched.heatmap_data or "[]"),
            "mca21":           json.loads(enriched.mca21_status or "{}"),
            "cersai":          json.loads(enriched.cersai_status or "{}")
        } if enriched else None
    }


@router.get("/stats", summary="Dashboard statistics")
def get_stats(db: Session = Depends(get_db)):
    scans = db.query(ScanResult).all()
    total = len(scans)
    valid = [s for s in scans if s.risk_score is not None]

    high   = sum(1 for s in valid if s.risk_score > 70)
    medium = sum(1 for s in valid if 40 < s.risk_score <= 70)
    low    = sum(1 for s in valid if s.risk_score <= 40)
    avg    = round(sum(s.risk_score for s in valid) / len(valid), 2) if valid else 0

    return {
        "total_scans": total,
        "high_risk":   high,
        "medium_risk": medium,
        "low_risk":    low,
        "avg_risk":    avg
    }


@router.get("/patterns", summary="Fraud Pattern Library")
def get_patterns():
    """Return the full fraud pattern library used by ForgeShield."""
    return FRAUD_PATTERNS
