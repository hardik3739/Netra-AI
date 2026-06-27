"""
ForgeShield — Week 2
NLP Semantic Consistency Engine

Cross-validates document text against:
- Mock MCA21 (Ministry of Corporate Affairs) company registry
- Mock CERSAI (Central Registry) land records
- Internal date consistency checker
- Amount plausibility checker

Uses mock APIs for hackathon demo reliability.
Real APIs require government portal registration.
"""

import re
import json
from datetime import datetime


# ─────────────────────────────────────────────────────────
# MOCK MCA21 — Company Registry
# ─────────────────────────────────────────────────────────
MOCK_MCA21 = {
    "TATA CONSULTANCY SERVICES":   {"status": "ACTIVE",      "cin": "L22210MH1995PLC084781", "type": "Public"},
    "INFOSYS LIMITED":             {"status": "ACTIVE",      "cin": "L85110KA1981PLC013115", "type": "Public"},
    "WIPRO LIMITED":               {"status": "ACTIVE",      "cin": "L32102KA1945PLC020800", "type": "Public"},
    "RELIANCE INDUSTRIES LIMITED": {"status": "ACTIVE",      "cin": "L17110MH1973PLC019786", "type": "Public"},
    "HDFC BANK LIMITED":           {"status": "ACTIVE",      "cin": "L65920MH1994PLC080618", "type": "Public"},
    "CANARA BANK":                 {"status": "ACTIVE",      "cin": "L65110KA1906GOI000017", "type": "Public"},
    "FRAUDCO PRIVATE LIMITED":     {"status": "STRUCK OFF",  "cin": "U00000MH2010PTC000000", "type": "Private"},
    "SHELL COMPANY XYZ LTD":       {"status": "STRUCK OFF",  "cin": "U00000DL2015PTC000001", "type": "Private"},
    "BOGUS ENTERPRISES PVT LTD":   {"status": "UNDER LIQUIDATION", "cin": "U00000MH2018PTC000002", "type": "Private"},
    "FAKE HOLDINGS LIMITED":       {"status": "STRUCK OFF",  "cin": "U00000GJ2012PLC000003", "type": "Private"},
}

# ─────────────────────────────────────────────────────────
# MOCK CERSAI — Land / Mortgage Registry
# ─────────────────────────────────────────────────────────
MOCK_CERSAI = {
    "SY123456": {"mortgaged": False, "owner": "Rajesh Kumar",   "district": "Mumbai",    "state": "Maharashtra"},
    "SY789012": {"mortgaged": True,  "owner": "Priya Sharma",   "district": "Pune",      "state": "Maharashtra",
                 "mortgaged_with": "Canara Bank", "loan_amount": "₹45,00,000"},
    "SY345678": {"mortgaged": False, "owner": "Amit Verma",     "district": "New Delhi", "state": "Delhi"},
    "SY999000": {"mortgaged": True,  "owner": "Unknown Entity", "district": "Chennai",   "state": "Tamil Nadu",
                 "mortgaged_with": "SBI", "loan_amount": "₹1,20,00,000"},
    "SY111222": {"mortgaged": False, "owner": "Sunita Patel",   "district": "Ahmedabad", "state": "Gujarat"},
    "SY333444": {"mortgaged": True,  "owner": "Ramesh Gupta",   "district": "Kolkata",   "state": "West Bengal",
                 "mortgaged_with": "PNB", "loan_amount": "₹80,00,000"},
}


# ─────────────────────────────────────────────────────────
# Entity extraction
# ─────────────────────────────────────────────────────────
def extract_entities(text: str) -> dict:
    """Extract all financial entities from document text."""
    text_upper = text.upper()

    # Companies — match against mock registry
    companies = [k for k in MOCK_MCA21 if k in text_upper]

    # Survey numbers — CERSAI format SYxxxxxx
    survey_numbers = list(set(re.findall(r'\bSY\d{6}\b', text, re.IGNORECASE)))
    survey_numbers = [s.upper() for s in survey_numbers]

    # Financial amounts
    amounts = re.findall(
        r'(?:RS\.?\s*|INR\s*|₹\s*)[\d,]+(?:\.\d{2})?(?:\s*(?:LAKHS?|CRORES?|CR|L))?',
        text, re.IGNORECASE
    )

    # Dates
    dates = re.findall(
        r'\b\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}\b'
        r'|\b\d{4}-\d{2}-\d{2}\b'
        r'|\b\d{1,2}\s+(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\w*\s+\d{4}\b',
        text, re.IGNORECASE
    )

    # PAN numbers
    pan_numbers = list(set(re.findall(r'\b[A-Z]{5}[0-9]{4}[A-Z]\b', text)))

    # Aadhaar (masked)
    aadhaar = re.findall(r'\b[X*]{8}\d{4}\b|\b\d{4}\s\d{4}\s\d{4}\b', text)

    # IFSC codes
    ifsc = list(set(re.findall(r'\b[A-Z]{4}0[A-Z0-9]{6}\b', text)))

    return {
        "companies":      companies,
        "survey_numbers": survey_numbers,
        "amounts":        amounts[:10],
        "dates":          dates[:10],
        "pan_numbers":    pan_numbers,
        "aadhaar":        aadhaar,
        "ifsc_codes":     ifsc
    }


# ─────────────────────────────────────────────────────────
# MCA21 cross-validation
# ─────────────────────────────────────────────────────────
def check_mca21(companies: list) -> dict:
    results, flags = {}, []
    for company in companies:
        key  = company.upper().strip()
        data = MOCK_MCA21.get(key)
        if data:
            results[company] = data
            if data["status"] in ("STRUCK OFF", "UNDER LIQUIDATION"):
                flags.append(
                    f"⚠ Company '{company}' status is '{data['status']}' in MCA21 — "
                    f"CIN: {data['cin']}"
                )
        else:
            results[company] = {"status": "NOT FOUND", "cin": None}
            flags.append(f"⚠ Company '{company}' not found in MCA21 registry")
    return {"results": results, "flags": flags}


# ─────────────────────────────────────────────────────────
# CERSAI cross-validation
# ─────────────────────────────────────────────────────────
def check_cersai(survey_numbers: list) -> dict:
    results, flags = {}, []
    for sn in survey_numbers:
        data = MOCK_CERSAI.get(sn.upper())
        if data:
            results[sn] = data
            if data["mortgaged"]:
                flags.append(
                    f"⚠ Land parcel {sn} is already mortgaged with "
                    f"{data.get('mortgaged_with','Unknown')} "
                    f"(Amount: {data.get('loan_amount','Unknown')})"
                )
        else:
            results[sn] = {"status": "NOT FOUND IN CERSAI"}
            flags.append(f"⚠ Survey number {sn} not found in CERSAI records")
    return {"results": results, "flags": flags}


# ─────────────────────────────────────────────────────────
# Date consistency check
# ─────────────────────────────────────────────────────────
def check_dates(dates: list) -> dict:
    flags = []
    today = datetime.now()
    formats = ["%d/%m/%Y", "%d-%m-%Y", "%Y-%m-%d", "%d/%m/%y",
               "%d-%m-%y", "%d %B %Y", "%d %b %Y"]
    parsed = []
    for d in dates:
        for fmt in formats:
            try:
                p = datetime.strptime(d.strip(), fmt)
                parsed.append(p)
                if p > today:
                    flags.append(f"⚠ Future date detected: {d} — document may be post-dated")
                if p.year < 1900:
                    flags.append(f"⚠ Implausible date detected: {d}")
                break
            except ValueError:
                continue

    # Check for illogical date ordering (e.g. end date before start date)
    if len(parsed) >= 2:
        parsed_sorted = sorted(parsed)
        if parsed[-1] < parsed[0]:
            flags.append("⚠ Date sequence inconsistency — end date appears before start date")

    return {"flags": flags, "parsed_count": len(parsed)}


# ─────────────────────────────────────────────────────────
# Semantic risk score calculation
# ─────────────────────────────────────────────────────────
def calculate_semantic_score(mca_flags: list, cersai_flags: list,
                              date_flags: list, entities: dict) -> float:
    score = 0.0
    score += len(mca_flags)    * 20   # Company fraud is high weight
    score += len(cersai_flags) * 25   # Duplicate mortgage is critical
    score += len(date_flags)   * 15   # Date anomaly medium weight

    # Suspicious: financial doc with no company or amount
    if not entities["companies"] and not entities["amounts"]:
        score += 10

    # Suspicious: no dates in a financial document
    if not entities["dates"]:
        score += 8

    return min(round(score, 2), 100.0)


# ─────────────────────────────────────────────────────────
# Main pipeline
# ─────────────────────────────────────────────────────────
def run_semantic_analysis(text: str) -> dict:
    """
    Run full NLP semantic analysis pipeline.
    Returns semantic_score, all flags, entities, and API results.
    """
    entities      = extract_entities(text)
    mca_result    = check_mca21(entities["companies"])
    cersai_result = check_cersai(entities["survey_numbers"])
    date_result   = check_dates(entities["dates"])

    all_flags = (
        mca_result["flags"] +
        cersai_result["flags"] +
        date_result["flags"]
    )

    semantic_score = calculate_semantic_score(
        mca_result["flags"],
        cersai_result["flags"],
        date_result["flags"],
        entities
    )

    return {
        "semantic_score": semantic_score,
        "entities":       entities,
        "mca21_status":   json.dumps(mca_result),
        "cersai_status":  json.dumps(cersai_result),
        "nlp_flags":      json.dumps(all_flags),
        "flag_count":     len(all_flags)
    }


# Optional Ollama integration (Phi-3)
try:
    from .ollama_service import run_model
except Exception:
    run_model = None


def llm_analyze_text_with_phi3(text: str) -> dict:
    """Use Phi-3 (via Ollama) to produce a concise compliance summary for the document text.

    Returns parsed JSON when available or a dict with an `error` key on failure.
    """
    if not run_model:
        return {"error": "ollama wrapper not available"}

    prompt = (
        "You are a compliance reviewer. Given the following document text, provide a concise list of potential compliance"
        " risks, suggested flags, and a one-paragraph summary. Return JSON with keys: summary, flags, recommendations.\n\n" + text
    )
    try:
        result = run_model("phi3", prompt, timeout=120, fmt="json")
    except Exception as e:
        return {"error": "exception", "details": str(e)}

    return {"llm_result": result}
