from datetime import datetime
from sqlalchemy.orm import Session
from app.models.database import (
    MeasurableActionPoint, AuditLog, ComplianceSnapshot
)


def take_snapshot(db: Session) -> dict:
    """Compute today's compliance snapshot and store/update it in DB.

    Returns snapshot as dict.
    """
    today = datetime.utcnow().date().isoformat()

    total_maps = db.query(MeasurableActionPoint).count()
    completed_maps = db.query(MeasurableActionPoint).filter(MeasurableActionPoint.status == "completed").count()
    open_maps = total_maps - completed_maps

    # events today (map validations and status updates)
    start_of_day = datetime.combine(datetime.utcnow().date(), datetime.min.time())
    end_of_day = datetime.combine(datetime.utcnow().date(), datetime.max.time())
    events_count = db.query(AuditLog).filter(
        AuditLog.created_at >= start_of_day,
        AuditLog.created_at <= end_of_day,
        AuditLog.event_type.in_(["map_validated", "map_status_updated", "circular_fetched"])
    ).count()

    compliance_score = round((completed_maps / total_maps * 100), 1) if total_maps else 100.0

    # check existing snapshot for today
    existing = db.query(ComplianceSnapshot).filter(ComplianceSnapshot.date == today).first()
    if existing:
        existing.compliance_score = compliance_score
        existing.total_maps = total_maps
        existing.completed_maps = completed_maps
        existing.open_maps = open_maps
        existing.events_count = events_count
        existing.created_at = datetime.utcnow()
        db.commit()
        return {
            "id": existing.id,
            "date": existing.date,
            "compliance_score": existing.compliance_score,
            "total_maps": existing.total_maps,
            "completed_maps": existing.completed_maps,
            "open_maps": existing.open_maps,
            "events_count": existing.events_count,
            "created_at": existing.created_at.isoformat()
        }

    # create new snapshot
    snap = ComplianceSnapshot(
        date = today,
        compliance_score = compliance_score,
        total_maps = total_maps,
        completed_maps = completed_maps,
        open_maps = open_maps,
        events_count = events_count
    )
    db.add(snap)
    db.commit()
    db.refresh(snap)

    return {
        "id": snap.id,
        "date": snap.date,
        "compliance_score": snap.compliance_score,
        "total_maps": snap.total_maps,
        "completed_maps": snap.completed_maps,
        "open_maps": snap.open_maps,
        "events_count": snap.events_count,
        "created_at": snap.created_at.isoformat()
    }
