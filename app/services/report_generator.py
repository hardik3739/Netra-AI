"""
Narrative Report Generator for ForgeShield

Generates human-readable analysis narratives using Ollama (Phi-3)
or deterministic templates when LLM unavailable.
"""

import os
import json
import requests
from typing import Dict, Any, Optional

OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3")


def generate_narrative(
    document_text: str,
    scan_results: Dict[str, Any],
    filename: str,
    mode: str = "full"
) -> str:
    """
    Generate a human-readable narrative for the ForgeShield scan results.
    
    Args:
        document_text: Extracted text from the scanned document
        scan_results: Dict with keys: final_score, verdict, nlp_flags, gnn_anomalies, filename
        filename: Original filename for context
        mode: "full" or "demo" — affects template selection
    
    Returns:
        Human-readable narrative string
    """
    final_score = scan_results.get("final_score", 0)
    verdict = scan_results.get("verdict", "INCONCLUSIVE")
    nlp_flags = scan_results.get("nlp_flags", [])
    gnn_anomalies = scan_results.get("gnn_anomalies", [])
    
    # Try Ollama LLM narrative generation
    try:
        llm_narrative = _ollama_generate_narrative(
            document_text, final_score, verdict, nlp_flags, gnn_anomalies, filename
        )
        if llm_narrative:
            return llm_narrative
    except Exception as e:
        print(f"[ReportGen] Ollama narrative generation failed: {e}")
    
    # Fallback: template-based narrative
    return _template_narrative(final_score, verdict, nlp_flags, gnn_anomalies, filename, mode)


def _ollama_generate_narrative(
    document_text: str,
    final_score: float,
    verdict: str,
    nlp_flags: list,
    gnn_anomalies: list,
    filename: str
) -> Optional[str]:
    """Generate narrative using Ollama (Phi-3 Mini)."""
    prompt = f"""You are a financial fraud analyst. Generate a concise 2-3 sentence professional narrative for this document scan result:

Document: {filename}
Final Risk Score: {final_score}%
Verdict: {verdict}

Key NLP Flags: {'; '.join(nlp_flags) if nlp_flags else 'None'}
Graph Anomalies: {'; '.join(gnn_anomalies) if gnn_anomalies else 'None'}

Provide a brief, actionable summary suitable for a loan officer."""
    
    try:
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            narrative = result.get("response", "").strip()
            if narrative and len(narrative) > 10:
                return narrative
    except Exception:
        pass
    
    return None


def _template_narrative(
    final_score: float,
    verdict: str,
    nlp_flags: list,
    gnn_anomalies: list,
    filename: str,
    mode: str
) -> str:
    """Generate narrative using deterministic template."""
    
    if final_score > 70:
        risk_text = "high-risk anomalies detected"
        action = "REJECT"
    elif final_score > 40:
        risk_text = "cross-validation concerns identified"
        action = "MANUAL REVIEW"
    else:
        risk_text = "passes all integrity checks"
        action = "APPROVE"
    
    # Build narrative
    parts = []
    
    if mode == "demo":
        parts.append(f"[DEMO MODE] Document '{filename}' underwent multi-layer ForgeShield analysis.")
    else:
        parts.append(f"Document '{filename}' underwent comprehensive ForgeShield analysis.")
    
    parts.append(f"Combined risk assessment: {final_score}% — {risk_text}.")
    
    if nlp_flags and len(nlp_flags) > 0:
        parts.append(f"NLP registry checks flagged: {nlp_flags[0]}")
    
    if gnn_anomalies and len(gnn_anomalies) > 0:
        parts.append(f"Entity coherence analysis noted: {gnn_anomalies[0]}")
    
    parts.append(f"Recommended action: {action}.")
    
    return " ".join(parts)
