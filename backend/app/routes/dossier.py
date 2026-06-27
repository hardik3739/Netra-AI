from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import json

from app.models.database import (
    get_db, LoanDossier, DossierDocument, AuditLog
)
from app.services.vit_analyzer import analyze_document
from app.services.ocr_service import extract_text_from_bytes
from app.services.nlp_engine import run_semantic_analysis
from app.services.gnn_analyzer import analyze_graph_coherence, generate_heatmap_data
from app.services.cross_checker import cross_document_check

router = APIRouter(prefix="/dossier", tags=["Dossier"])


class DossierCreate(BaseModel):
    applicant_name: str
    loan_amount: float
    loan_type: str


def _audit(db: Session, event: str, entity_id: str, details: str = ""):
    db.add(AuditLog(event_type=event, entity_id=entity_id, details=details))
    db.commit()


@router.post("/create")
def create_dossier(body: DossierCreate, db: Session = Depends(get_db)):
    dossier_id = str(uuid.uuid4())
    dossier = LoanDossier(
        id=dossier_id,
        applicant_name=body.applicant_name,
        loan_amount=body.loan_amount,
        loan_type=body.loan_type,
        status="pending",
        created_at=datetime.utcnow()
    )
    db.add(dossier)
    db.commit()

    _audit(db, "dossier_created", dossier_id, f"applicant={body.applicant_name} amount={body.loan_amount}")

    return {"dossier_id": dossier_id}


@router.post("/{dossier_id}/upload")
async def upload_documents(
    dossier_id: str,
    files: List[UploadFile] = File(...),
    doc_types: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    # Validate dossier exists
    dossier = db.query(LoanDossier).filter(LoanDossier.id == dossier_id).first()
    if not dossier:
        raise HTTPException(404, "Dossier not found")

    types = []
    if doc_types:
        types = [t.strip() for t in doc_types.split(",")]

    documents_summary = []

    for idx, f in enumerate(files):
        content = await f.read()
        content_type = f.content_type
        filename = f.filename
        dtype = types[idx] if idx < len(types) else "additional"

        # ViT analysis
        vit_result = analyze_document(content, filename)

        # OCR and NLP
        doc_text = extract_text_from_bytes(content, content_type)
        if not doc_text.strip():
            doc_text = f"Document filename: {filename}"
        nlp_result = run_semantic_analysis(doc_text)

        # GNN
        entities = nlp_result.get("entities", {})
        gnn_result = analyze_graph_coherence(entities)

        # Final score combining layers (same weights as forgeshield)
        final_score = round(
            vit_result.get("risk_score", 0) * 0.50 +
            nlp_result.get("semantic_score", 0) * 0.30 +
            gnn_result.get("graph_score", 0) * 0.20,
            2
        )

        if final_score > 70:
            final_verdict = "HIGH RISK"
        elif final_score > 40:
            final_verdict = "MEDIUM RISK"
        else:
            final_verdict = "LOW RISK"

        doc_id = str(uuid.uuid4())
        db.add(DossierDocument(
            id=doc_id,
            dossier_id=dossier_id,
            filename=filename,
            doc_type=dtype,
            risk_score=final_score,
            verdict=final_verdict,
            nlp_flags=json.dumps(nlp_result.get("nlp_flags", [])),
            entities=json.dumps(entities),
            created_at=datetime.utcnow()
        ))
        db.commit()

        documents_summary.append({
            "id": doc_id,
            "filename": filename,
            "doc_type": dtype,
            "risk_score": final_score,
            "verdict": final_verdict,
            "nlp_flags": nlp_result.get("nlp_flags", []),
            "entities": entities,
            "created_at": datetime.utcnow().isoformat()
        })

        _audit(db, "dossier_doc_analyzed", doc_id, f"dossier={dossier_id} file={filename} risk={final_score}")

    # Cross-document analysis
    cross = cross_document_check(documents_summary)

    # Update dossier with cross results
    dossier.overall_risk_score = cross.get("cross_risk_score")
    dossier.recommendation = cross.get("recommendation")
    dossier.cross_check_flags = json.dumps(cross.get("cross_flags", []))
    dossier.status = "analysed"
    db.commit()

    _audit(db, "dossier_analysed", dossier_id, f"cross_score={dossier.overall_risk_score} rec={dossier.recommendation}")

    return {
        "dossier_id": dossier_id,
        "overall_risk_score": dossier.overall_risk_score,
        "recommendation": dossier.recommendation,
        "cross_flags": cross.get("cross_flags", []),
        "documents": documents_summary
    }


@router.get("/{dossier_id}")
def get_dossier(dossier_id: str, db: Session = Depends(get_db)):
    d = db.query(LoanDossier).filter(LoanDossier.id == dossier_id).first()
    if not d:
        raise HTTPException(404, "Dossier not found")

    docs = db.query(DossierDocument).filter(DossierDocument.dossier_id == dossier_id).order_by(DossierDocument.created_at.desc()).all()
    docs_out = []
    for doc in docs:
        docs_out.append({
            "id": doc.id,
            "filename": doc.filename,
            "doc_type": doc.doc_type,
            "risk_score": doc.risk_score,
            "verdict": doc.verdict,
            "nlp_flags": json.loads(doc.nlp_flags or "[]"),
            "entities": json.loads(doc.entities or "{}"),
            "created_at": doc.created_at.isoformat()
        })

    return {
        "dossier": {
            "id": d.id,
            "applicant_name": d.applicant_name,
            "loan_amount": d.loan_amount,
            "loan_type": d.loan_type,
            "overall_risk_score": d.overall_risk_score,
            "recommendation": d.recommendation,
            "cross_check_flags": json.loads(d.cross_check_flags or "[]"),
            "status": d.status,
            "created_at": d.created_at.isoformat()
        },
        "documents": docs_out
    }


@router.get("/list")
def list_dossiers(db: Session = Depends(get_db)):
    rows = db.query(LoanDossier).order_by(LoanDossier.created_at.desc()).all()
    return [{
        "id": r.id,
        "applicant_name": r.applicant_name,
        "loan_amount": r.loan_amount,
        "loan_type": r.loan_type,
        "overall_risk_score": r.overall_risk_score,
        "recommendation": r.recommendation,
        "status": r.status,
        "created_at": r.created_at.isoformat()
    } for r in rows]
