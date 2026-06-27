"""
RegPilot — Week 3
LLM-Powered Circular Parser using Ollama (local, no API key)

Extracts Measurable Action Points (MAPs) from regulatory circular text.
Uses Ollama with Microsoft Phi-3 Mini (install: ollama pull phi3).
Falls back to robust rule-based extraction if Ollama is unavailable.
"""

import json
import re
import requests as req
from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_URL   = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3")

# ─────────────────────────────────────────────────────────
# Department routing keywords
# ─────────────────────────────────────────────────────────
DEPT_KEYWORDS = {
    "credit": [
        "loan", "credit", "borrower", "npa", "lending", "underwriting",
        "stressed asset", "resolution plan", "collateral", "sma", "crilc",
        "defaulter", "restructur", "exposure"
    ],
    "treasury": [
        "investment", "treasury", "bond", "securities", "liquidity",
        "capital adequacy", "encrypt", "financial statement", "xbrl",
        "dsc", "digital signature", "esg", "sustainability bond"
    ],
    "retail": [
        "customer", "branch", "retail", "onboarding", "kyc",
        "consumer", "deposit", "authentication", "touchpoint", "mfa",
        "mobile app", "consent form", "grievance"
    ],
    "AML": [
        "aml", "anti-money laundering", "suspicious", "str",
        "transaction monitoring", "fatf", "purge", "inactive",
        "wilful default", "crilc", "credit information"
    ],
    "IT": [
        "it department", "technology", "system", "cyber", "digital",
        "software", "database", "infrastructure", "ciso", "data masking",
        "xbrl", "automated", "real-time", "integration", "erp", "soc",
        "cert-in", "dlp", "ews", "portal", "api", "uidai", "encryption"
    ],
    "compliance": [
        "compliance", "audit", "report", "filing", "annual return",
        "penalty", "policy", "regulation", "amendment", "certificate",
        "brsr", "dpo", "data protection officer", "board", "disclosure"
    ]
}


def _detect_department(text: str) -> str:
    text_lower = text.lower()
    scores = {}
    for dept, keywords in DEPT_KEYWORDS.items():
        scores[dept] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "compliance"


def _detect_priority(text: str) -> str:
    text_lower = text.lower()
    high_words   = ["immediately", "urgent", "within 30 days", "within 21 days",
                    "critical", "mandatory", "shall", "within 45 days"]
    medium_words = ["within 60 days", "within 90 days", "quarterly", "required"]
    if any(w in text_lower for w in high_words):
        return "high"
    if any(w in text_lower for w in medium_words):
        return "medium"
    return "low"


def _extract_deadline(text: str) -> str:
    patterns = [
        r'within\s+(\d+)\s+days',
        r'by\s+(31st\s+\w+\s+\d{4})',
        r'by\s+(\w+\s+\d{4})',
        r'before\s+([\w\s]+\d{4})',
        r'(\d{1,2}(?:st|nd|rd|th)?\s+\w+\s+\d{4})',
        r'(FY\s+\d{4}-\d{2,4})',
        r'next\s+(reporting\s+cycle|due\s+date|quarter)'
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(1).strip()
    return "As per regulatory timeline"


def get_regulatory_reference(department: str, circular_source: str) -> str:
    source = (circular_source or "").upper()
    dept = (department or "").lower()

    if dept == "credit" and source == "RBI":
        return "RBI Master Direction on Prudential Norms — Section 4 | Banking Regulation Act 1949 S.21"
    if dept == "it" and source == "SEBI":
        return "SEBI Cybersecurity Framework 2024 — Circular SEBI/HO/ITD/1/2024"
    if dept == "it" and source == "RBI":
        return "RBI IT Framework for Banks 2011 — Section 7 (Cybersecurity)"
    if dept == "aml" and source == "RBI":
        return "RBI Master Circular on KYC/AML — PMLA 2002 Section 12"
    if dept == "retail" and source == "RBI":
        return "RBI Master Direction on KYC 2016 — Section 16(b) Customer Due Diligence"
    if dept == "compliance":
        return "Banking Regulation Act 1949 Section 47 — Penalty up to Rs.1 Crore per violation"
    if dept == "treasury":
        return "RBI Guidelines on Investment Portfolio — Section 3 | FEMA 1999"
    return "RBI Circular on Compliance Function — Section 2.1 Compliance Risk Management"


def _rule_based_maps(circular_text: str) -> list:
    """
    Rule-based MAP extraction for when Ollama is unavailable.
    Parses numbered list items and action sentences from circular text.
    """
    action_words = [
        "must", "shall", "should", "required to", "mandated",
        "implement", "ensure", "submit", "file", "appoint",
        "update", "revise", "conduct", "establish", "appoint",
        "deploy", "integrate", "notify", "maintain", "report",
        "train", "review", "publish", "disclose"
    ]

    maps  = []
    seen  = set()

    # Strategy 1: Extract numbered list items (most circulars use 1. 2. 3. format)
    numbered = re.findall(r'\d+\.\s+(.+?)(?=\n\s*\d+\.|\Z)', circular_text, re.DOTALL)
    for item in numbered:
        item = item.strip().replace('\n', ' ')
        item = re.sub(r'\s+', ' ', item)
        if len(item) > 40 and any(w in item.lower() for w in action_words):
            if item not in seen:
                seen.add(item)
                maps.append({
                    "title":       (item[:75] + "...") if len(item) > 75 else item,
                    "description": item,
                    "department":  _detect_department(item),
                    "deadline":    _extract_deadline(item),
                    "priority":    _detect_priority(item)
                })

    # Strategy 2: Sentence-level extraction if numbered list found nothing
    if not maps:
        sentences = re.split(r'(?<=[.!?])\s+', circular_text)
        for sentence in sentences:
            sentence = sentence.strip().replace('\n', ' ')
            if (len(sentence) > 40 and
                    any(w in sentence.lower() for w in action_words) and
                    sentence not in seen):
                seen.add(sentence)
                maps.append({
                    "title":       (sentence[:75] + "...") if len(sentence) > 75 else sentence,
                    "description": sentence,
                    "department":  _detect_department(sentence),
                    "deadline":    _extract_deadline(sentence),
                    "priority":    _detect_priority(sentence)
                })

    return maps[:6]  # Cap at 6 MAPs per circular


def _ollama_maps(circular_text: str) -> list | None:
    """
    Use local Ollama LLM to extract MAPs from circular text.
    Returns list of MAP dicts or None if Ollama unavailable.
    """
    prompt = f"""<|user|>
You are a senior Indian banking regulatory compliance expert.

Read the following regulatory circular and extract all Measurable Action Points (MAPs) — specific actions that a bank department must take to comply.

Return ONLY a valid JSON array. No explanation. No markdown.
No text before or after the JSON array.

Each item must have exactly these keys:
- "title": short action title, max 10 words
- "description": full action description, 1-3 sentences
- "department": exactly one of: credit, treasury, retail, AML, IT, compliance
- "deadline": specific deadline or "As per regulatory timeline"
- "priority": exactly one of: high, medium, low

CIRCULAR TEXT:
{circular_text[:3000]}
<|end|>
<|assistant|>"""

    try:
        response = req.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model":  OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,
                    "num_predict": 1200,
                    "top_p": 0.9
                }
            },
            timeout=90
        )

        if response.status_code != 200:
            raise Exception(f"Ollama HTTP {response.status_code}")

        raw = response.json().get("response", "").strip()

        # Extract JSON array from response
        start = raw.find('[')
        end   = raw.rfind(']') + 1
        if start == -1 or end == 0:
            raise Exception("No JSON array in LLM response")

        maps = json.loads(raw[start:end])

        # Validate and clean up each MAP
        cleaned = []
        valid_depts = {"credit", "treasury", "retail", "AML", "IT", "compliance"}
        valid_prios = {"high", "medium", "low"}

        for m in maps:
            if not isinstance(m, dict):
                continue
            if not m.get("title") or not m.get("description"):
                continue
            m["department"] = m.get("department", "compliance")
            if m["department"] not in valid_depts:
                m["department"] = _detect_department(m["description"])
            m["priority"] = m.get("priority", "medium")
            if m["priority"] not in valid_prios:
                m["priority"] = "medium"
            m["deadline"] = m.get("deadline", "As per regulatory timeline")
            cleaned.append(m)

        return cleaned[:6] if cleaned else None

    except Exception as e:
        print("[RegPilot] Microsoft Phi-3 Mini unavailable — using rule-based MAP extraction")
        return None


def extract_maps(circular_text: str, circular_source: str, circular_id: str) -> list:
    """
    Main MAP extraction entry point.
    1. Try Ollama first
    2. Fall back to rule-based extraction
    """
    # Try Ollama first
    maps = _ollama_maps(circular_text)

    # Fall back to rule-based
    if not maps:
        maps = _rule_based_maps(circular_text)

    # Attach regulatory reference for every MAP
    for m in maps:
        if "department" in m:
            m["regulatory_reference"] = get_regulatory_reference(
                m.get("department", "compliance"), circular_source
            )
        else:
            m["regulatory_reference"] = get_regulatory_reference("compliance", circular_source)

    return maps
