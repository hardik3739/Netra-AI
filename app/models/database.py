"""
NetraAI — Database Models
All SQLAlchemy models for the entire project (Weeks 1–4).
Tables are auto-created on app startup via Base.metadata.create_all().
"""

from sqlalchemy import (
    create_engine, Column, String, Float,
    DateTime, Text, Integer, Boolean, inspect, text
)
from sqlalchemy import ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
SQLITE_FALLBACK_URL = os.getenv("SQLITE_DATABASE_URL", "sqlite:///./netraai_local.db")


def create_db_engine(url: str):
    engine = create_engine(url, pool_pre_ping=True, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {})
    try:
        with engine.connect() as conn:
            pass
    except Exception as exc:
        print("[NetraAI] Database connection failed:", exc)
        print("[NetraAI] Falling back to local SQLite database.")
        engine = create_engine(SQLITE_FALLBACK_URL, pool_pre_ping=True, connect_args={"check_same_thread": False})
    return engine

DATABASE_URL = DATABASE_URL or SQLITE_FALLBACK_URL
engine = create_db_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ─────────────────────────────────────────────────────────
# WEEK 1 — ForgeShield: basic ViT scan results
# ─────────────────────────────────────────────────────────
class ScanResult(Base):
    __tablename__ = "scan_results"

    id         = Column(String,  primary_key=True, index=True)
    filename   = Column(String,  nullable=False)
    file_type  = Column(String,  nullable=True)
    risk_score = Column(Float,   nullable=True)
    verdict    = Column(String,  nullable=True)
    confidence = Column(Float,   nullable=True)
    details    = Column(Text,    nullable=True)   # JSON string with ViT details
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────
# WEEK 2 — ForgeShield: NLP + GNN enriched results
# ─────────────────────────────────────────────────────────
class EnrichedScanResult(Base):
    __tablename__ = "enriched_scan_results"

    id               = Column(String, primary_key=True, index=True)
    scan_id          = Column(String, nullable=False, index=True)  # → ScanResult.id
    semantic_score   = Column(Float,  nullable=True)
    graph_score      = Column(Float,  nullable=True)
    final_risk_score = Column(Float,  nullable=True)
    mca21_status     = Column(Text,   nullable=True)   # JSON
    cersai_status    = Column(Text,   nullable=True)   # JSON
    nlp_flags        = Column(Text,   nullable=True)   # JSON array
    gnn_anomalies    = Column(Text,   nullable=True)   # JSON array
    entities         = Column(Text,   nullable=True)   # JSON
    heatmap_data     = Column(Text,   nullable=True)   # JSON array
    created_at       = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────
# WEEK 3 — RegPilot: regulatory circulars
# ─────────────────────────────────────────────────────────
class RegulatoryCircular(Base):
    __tablename__ = "regulatory_circulars"

    id           = Column(String,  primary_key=True, index=True)
    source       = Column(String,  nullable=False)    # RBI / SEBI / IRDAI / MCA
    title        = Column(String,  nullable=False)
    url          = Column(String,  nullable=True)
    raw_text     = Column(Text,    nullable=True)
    published_at = Column(DateTime, nullable=True)
    fetched_at   = Column(DateTime, default=datetime.utcnow)
    is_processed = Column(Boolean,  default=False)


# ─────────────────────────────────────────────────────────
# WEEK 3 — RegPilot: Measurable Action Points (MAPs)
# ─────────────────────────────────────────────────────────
class MeasurableActionPoint(Base):
    __tablename__ = "measurable_action_points"

    id          = Column(String,  primary_key=True, index=True)
    circular_id = Column(String,  nullable=False, index=True)  # → RegulatoryCircular.id
    title       = Column(String,  nullable=False)
    description = Column(Text,    nullable=False)
    department  = Column(String,  nullable=False)   # credit/treasury/retail/AML/IT/compliance
    deadline    = Column(String,  nullable=True)
    priority    = Column(String,  default="medium") # high / medium / low
    status      = Column(String,  default="open")   # open / in_progress / completed
    evidence    = Column(Text,    nullable=True)
    validated   = Column(Boolean, default=False)
    regulatory_reference = Column(String, nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)
    updated_at  = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    branch_id   = Column(String, nullable=True, default="BR001")


# ─────────────────────────────────────────────────────────
# WEEK 4 — Audit trail for all system events
# ─────────────────────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_logs"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    event_type = Column(String,  nullable=False)
    entity_id  = Column(String,  nullable=True)
    details    = Column(Text,    nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────
# Compliance snapshots for trend history
# ─────────────────────────────────────────────────────────
class ComplianceSnapshot(Base):
    __tablename__ = "compliance_snapshots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(String, nullable=False, index=True)  # YYYY-MM-DD
    compliance_score = Column(Float, nullable=False)
    total_maps = Column(Integer, nullable=False)
    completed_maps = Column(Integer, nullable=False)
    open_maps = Column(Integer, nullable=False)
    events_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────
# Bank branches for Branch-Level Compliance Dashboard
# ─────────────────────────────────────────────────────────
class BankBranch(Base):
    __tablename__ = "bank_branches"

    id = Column(String, primary_key=True)
    name = Column(String)
    city = Column(String)
    state = Column(String)
    region = Column(String)  # north/south/east/west/central
    lat = Column(Float)
    lng = Column(Float)
    branch_code = Column(String)


def seed_branches(db):
    """Insert default branches if table is empty."""
    existing = db.query(BankBranch).count()
    if existing > 0:
        return

    branches = [
        {"id":"BR001", "name":"Mumbai HQ", "city":"Mumbai", "state":"Maharashtra", "region":"west", "lat":19.0760, "lng":72.8777, "branch_code":"MUM001"},
        {"id":"BR002", "name":"Delhi Branch", "city":"New Delhi", "state":"Delhi", "region":"north", "lat":28.6139, "lng":77.2090, "branch_code":"DEL001"},
        {"id":"BR003", "name":"Chennai Branch", "city":"Chennai", "state":"Tamil Nadu", "region":"south", "lat":13.0827, "lng":80.2707, "branch_code":"CHE001"},
        {"id":"BR004", "name":"Kolkata Branch", "city":"Kolkata", "state":"West Bengal", "region":"east", "lat":22.5726, "lng":88.3639, "branch_code":"KOL001"},
        {"id":"BR005", "name":"Bengaluru Branch", "city":"Bengaluru", "state":"Karnataka", "region":"south", "lat":12.9716, "lng":77.5946, "branch_code":"BLR001"},
        {"id":"BR006", "name":"Hyderabad Branch", "city":"Hyderabad", "state":"Telangana", "region":"south", "lat":17.3850, "lng":78.4867, "branch_code":"HYD001"},
        {"id":"BR007", "name":"Pune Branch", "city":"Pune", "state":"Maharashtra", "region":"west", "lat":18.5204, "lng":73.8567, "branch_code":"PUN001"},
        {"id":"BR008", "name":"Ahmedabad Branch", "city":"Ahmedabad", "state":"Gujarat", "region":"west", "lat":23.0225, "lng":72.5714, "branch_code":"AMD001"}
    ]

    for b in branches:
        db.add(BankBranch(**b))
    db.commit()


# ─────────────────────────────────────────────────────────
# Loan Dossier tables (Week X)
# ─────────────────────────────────────────────────────────
class LoanDossier(Base):
    __tablename__ = "loan_dossiers"

    id = Column(String, primary_key=True, index=True)
    applicant_name = Column(String, nullable=False)
    loan_amount = Column(Float, nullable=False)
    loan_type = Column(String, nullable=False)  # home/personal/business/agricultural
    overall_risk_score = Column(Float, nullable=True)
    recommendation = Column(String, nullable=True)
    cross_check_flags = Column(Text, nullable=True)  # JSON
    status = Column(String, default="pending")  # pending/analysed
    created_at = Column(DateTime, default=datetime.utcnow)


class DossierDocument(Base):
    __tablename__ = "dossier_documents"

    id = Column(String, primary_key=True, index=True)
    dossier_id = Column(String, nullable=False, index=True)
    filename = Column(String, nullable=False)
    doc_type = Column(String, nullable=True)  # salary_slip/bank_statement/land_record/company_letter
    risk_score = Column(Float, nullable=True)
    verdict = Column(String, nullable=True)
    nlp_flags = Column(Text, nullable=True)
    entities = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


# ─────────────────────────────────────────────────────────
# DB session dependency for FastAPI routes
# ─────────────────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
