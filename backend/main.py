"""
NetraAI — Main FastAPI Application
===================================
SuRaksha Cyber Hackathon 2.0 | Canara Bank

Modules:
  ForgeShield — Real-time document forgery detection (ViT + NLP + GNN)
  RegPilot    — Agentic regulatory intelligence & compliance automation

Run with:
  uvicorn main:app --reload
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import asyncio
import os
import requests as req
from dotenv import load_dotenv

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import inspect, text
from app.models.database    import Base, engine, SessionLocal, seed_branches
from app.routes.forgeshield import router as forgeshield_router
from app.routes.regpilot    import router as regpilot_router, process_circulars
from app.routes.dossier import router as dossier_router

load_dotenv()

last_autonomous_run = None


def _ensure_schema(engine):
    """Apply lightweight schema fixes for existing databases."""
    inspector = inspect(engine)
    if "measurable_action_points" in inspector.get_table_names():
        columns = [c["name"] for c in inspector.get_columns("measurable_action_points")]
        if "branch_id" not in columns:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE measurable_action_points ADD COLUMN branch_id VARCHAR"))
                conn.commit()
                print("[NetraAI] Added missing column measurable_action_points.branch_id")
        if "regulatory_reference" not in columns:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE measurable_action_points ADD COLUMN regulatory_reference VARCHAR"))
                conn.commit()
                print("[NetraAI] Added missing column measurable_action_points.regulatory_reference")
    if "compliance_snapshots" not in inspector.get_table_names():
        Base.metadata.tables["compliance_snapshots"].create(bind=engine)
        print("[NetraAI] Created missing compliance_snapshots table")


async def autonomous_circular_check():
    global last_autonomous_run
    db = SessionLocal()
    try:
        result = await asyncio.to_thread(process_circulars, db)
        if isinstance(result, dict):
            new_circulars = result.get("new_circulars", 0)
            maps_generated = result.get("maps_generated", 0)
            print(f"[RegPilot Agent] Autonomous check complete — {new_circulars} new circulars, {maps_generated} MAPs generated")
        else:
            print("[RegPilot Agent] Autonomous check complete — no results returned")
        last_autonomous_run = datetime.now()
        app.state.regpilot_autonomous_last_run = last_autonomous_run
        app.state.regpilot_autonomous_total_runs += 1
    except Exception as exc:
        print(f"[RegPilot Agent] Autonomous check failed: {exc}")
    finally:
        try:
            db.close()
        except Exception:
            pass


# ─────────────────────────────────────────────────────────
# App lifespan — runs on startup and shutdown
# ─────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create all DB tables and apply lightweight schema migrations
    print("[NetraAI] Creating database tables...")
    Base.metadata.create_all(bind=engine)
    _ensure_schema(engine)
    print("[NetraAI] Database ready [OK]")

    # Seed default bank branches if not present
    try:
        db = SessionLocal()
        seed_branches(db)
    except Exception:
        print("[NetraAI] Warning: failed to seed bank branches")
    finally:
        try:
            db.close()
        except Exception:
            pass

    app.state.regpilot_autonomous_last_run = None
    app.state.regpilot_autonomous_total_runs = 0
    app.state.regpilot_scheduler = AsyncIOScheduler()
    app.state.regpilot_scheduler.add_job(
        autonomous_circular_check,
        "interval",
        hours=24,
        id="regpilot_autonomous_daily",
        coalesce=True,
        max_instances=1
    )
    app.state.regpilot_scheduler.start()
    print("[RegPilot Agent] Autonomous monitoring active")
    print("[RegPilot Agent] Next check in 24 hours")
    print("[NetraAI] Server running at http://localhost:8000")
    print("[NetraAI] API docs at http://localhost:8000/docs")
    # Check Ollama / local LLM availability and models
    try:
        try:
            r = req.get("http://localhost:11434/api/tags", timeout=3)
        except Exception:
            r = req.get("http://localhost:11434/api/tags", timeout=3)
        models = []
        if r.status_code == 200:
            j = r.json()
            # Support payload shape: {"models": [...]}
            models = [m.get("name") if isinstance(m, dict) else m for m in j.get("models", [])]
        if any(m and "phi3" in m for m in models):
            print("[NetraAI] Microsoft Phi-3 Mini detected and ready ✓")
        else:
            print("[NetraAI] WARNING: Microsoft Phi-3 Mini not found.")
            print("[NetraAI] Run this command to install it:")
            print("[NetraAI]   ollama pull phi3")
            print("[NetraAI] RegPilot will use rule-based fallback until Phi-3 is available.")
    except Exception:
        print("[NetraAI] WARNING: Ollama is not running.")
        print("[NetraAI] Start Ollama then run: ollama pull phi3")
        print("[NetraAI] RegPilot rule-based fallback is active.")
    yield
    # Shutdown
    print("[NetraAI] Shutting down...")
    scheduler = getattr(app.state, "regpilot_scheduler", None)
    if scheduler:
        scheduler.shutdown()


# ─────────────────────────────────────────────────────────
# FastAPI app instance
# ─────────────────────────────────────────────────────────
app = FastAPI(
    title       = "NetraAI API",
    description = """
## NetraAI — Unified AI Document Integrity & Compliance Engine
**SuRaksha Cyber Hackathon 2.0 | Canara Bank**

---

### Modules

#### 🔍 ForgeShield (Weeks 1 + 2)
Real-time AI document forgery detection pipeline:
- **Week 1**: Vision Transformer (ViT) pixel-level anomaly detection
- **Week 2**: NLP semantic cross-validation (MCA21 + CERSAI) + GNN graph coherence analysis

#### 📋 RegPilot (Weeks 3 + 4)
Agentic regulatory intelligence system:
- **Week 3**: Autonomous crawler for RBI, SEBI, IRDAI, MCA circulars + LLM MAP extraction
- **Week 4**: Evidence submission + autonomous compliance validation + audit trail

---

### Quick Start
1. `POST /forgeshield/analyze` — upload a document, get risk score
2. `POST /regpilot/fetch` — fetch latest circulars and generate MAPs
3. `GET /regpilot/dashboard` — view compliance heatmap
4. `GET /regpilot/audit` — view tamper-proof audit trail
    """,
    version     = "1.0.0",
    lifespan    = lifespan,
    docs_url    = "/docs",
    redoc_url   = "/redoc"
)


# ─────────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────────

def _get_cors_origins():
    origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return [origin.strip() for origin in origins.split(",") if origin.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_get_cors_origins(),
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX", r"https://.*\.vercel\.app"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────
# Middleware
# ─────────────────────────────────────────────────────────
@app.middleware("http")
async def response_time_middleware(request: Request, call_next):
    import time
    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    response.headers["X-Response-Time-Ms"] = str(duration_ms)
    if "/forgeshield" in str(request.url) or "/regpilot" in str(request.url):
        print(f"[{request.method}] {request.url.path} → {duration_ms}ms")
    return response


# ─────────────────────────────────────────────────────────
# Routers
# ─────────────────────────────────────────────────────────
app.include_router(forgeshield_router)
app.include_router(regpilot_router)
app.include_router(dossier_router)


# ─────────────────────────────────────────────────────────
# Root endpoints
# ─────────────────────────────────────────────────────────
@app.get("/", tags=["Root"], summary="API root")
def root():
    return {
        "app":         "NetraAI",
        "version":     "1.0.0",
        "hackathon":   "SuRaksha Cyber Hackathon 2.0",
        "organizer":   "Canara Bank",
        "modules": {
            "ForgeShield": {
                "description": "Real-time document forgery detection",
                "endpoints": {
                    "quick_scan": "POST /forgeshield/analyze",
                    "full_scan":  "POST /forgeshield/analyze/full",
                    "history":    "GET /forgeshield/history",
                    "stats":      "GET /forgeshield/stats"
                }
            },
            "RegPilot": {
                "description": "Agentic regulatory intelligence",
                "endpoints": {
                    "fetch":     "POST /regpilot/fetch",
                    "circulars": "GET /regpilot/circulars",
                    "maps":      "GET /regpilot/maps",
                    "validate":  "POST /regpilot/maps/{id}/validate",
                    "dashboard": "GET /regpilot/dashboard",
                    "audit":     "GET /regpilot/audit"
                }
            }
        },
        "docs":  "http://localhost:8000/docs",
        "redoc": "http://localhost:8000/redoc"
    }


@app.get("/health", tags=["Root"], summary="Health check")
def health():
    return {"status": "ok", "app": "NetraAI"}
