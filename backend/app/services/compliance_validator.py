"""
RegPilot — Week 4
Autonomous Completion Validator

Validates MAP completion evidence against the original regulatory requirement.
Uses Ollama (local LLM) for intelligent validation.
Falls back to rule-based keyword matching if Ollama unavailable.
"""

import json
import re
import requests as req
from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_URL   = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3")


def _rule_based_validate(map_title: str, map_description: str,
                          map_department: str, evidence: str) -> dict:
    """
    Rule-based evidence validation.
    Checks keyword coverage between MAP requirement and submitted evidence.
    """
    map_lower  = (map_title + " " + map_description).lower()
    evid_lower = evidence.lower()

    # Extract key action verbs from MAP
    action_words = re.findall(
        r'\b(implement|deploy|submit|file|appoint|update|revise|conduct|'
        r'review|audit|train|install|configure|report|notify|maintain|'
        r'establish|integrate|publish|disclose|complete|create|develop)\w*\b',
        map_lower
    )

    # Extract key nouns/topics from MAP
    topic_words = re.findall(
        r'\b(kyc|aml|ciso|soc|xbrl|ews|dlp|mfa|dpo|brsr|crilc|fatf|'
        r'policy|system|report|certificate|training|audit|portal|'
        r'framework|assessment|integration|compliance)\w*\b',
        map_lower
    )

    all_keywords  = list(set(action_words + topic_words))
    matched       = sum(1 for kw in all_keywords if kw[:5] in evid_lower)
    coverage_pct  = (matched / len(all_keywords) * 100) if all_keywords else 50

    # Evidence length check
    word_count = len(evidence.split())

    if coverage_pct >= 55 and word_count >= 30:
        status  = "VALIDATED"
        message = "Evidence adequately addresses the regulatory requirement."
        score   = min(int(coverage_pct), 90)
        gaps    = []
    elif word_count < 15:
        status  = "INSUFFICIENT"
        message = "Evidence is too brief. Please provide detailed documentation."
        score   = 15
        gaps    = [
            "Evidence must describe specific actions taken",
            "Include dates, reference numbers, or document names",
            "Minimum 30 words required"
        ]
    elif coverage_pct < 30:
        status  = "INSUFFICIENT"
        message = "Evidence does not address key requirements of the MAP."
        score   = 25
        gaps    = [
            f"Missing coverage of: {', '.join(all_keywords[:3])}",
            "Reread the MAP requirement and address each point"
        ]
    else:
        status  = "PARTIAL"
        message = "Evidence partially satisfies the requirement. Additional documentation needed."
        score   = int(coverage_pct)
        unmatched = [kw for kw in all_keywords[:5] if kw[:5] not in evid_lower]
        gaps    = [f"Consider addressing: {', '.join(unmatched)}"] if unmatched else []

    return {
        "status":  status,
        "message": message,
        "score":   score,
        "gaps":    gaps,
        "method":  "rule-based"
    }


def validate_evidence(map_title: str, map_description: str,
                       map_department: str, evidence: str) -> dict:
    """
    Main validation function.
    Tries Ollama LLM validation first, falls back to rule-based.
    """
    prompt = f"""<|user|>
You are a strict Indian banking regulatory compliance auditor.

A bank department submitted evidence to close a compliance action point from a regulatory circular.

MAP TITLE: {map_title}
REQUIREMENT: {map_description}
DEPARTMENT: {map_department}
SUBMITTED EVIDENCE: {evidence}

Evaluate strictly if the evidence satisfies the requirement.

Return ONLY a valid JSON object with exactly these keys:
- "status": one of "VALIDATED", "PARTIAL", "INSUFFICIENT"
- "message": one sentence explaining your decision
- "score": integer 0-100 representing compliance completeness
- "gaps": array of strings listing missing elements (empty array if VALIDATED)

Be strict. Vague evidence without specifics is INSUFFICIENT.
JSON only. No markdown. No text outside the JSON.
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
                    "num_predict": 500
                }
            },
            timeout=60
        )

        if response.status_code != 200:
            raise Exception(f"Ollama HTTP {response.status_code}")

        raw   = response.json().get("response", "").strip()
        start = raw.find('{')
        end   = raw.rfind('}') + 1

        if start == -1:
            raise Exception("No JSON in LLM response")

        result = json.loads(raw[start:end])

        # Validate and clean response
        valid_statuses = {"VALIDATED", "PARTIAL", "INSUFFICIENT"}
        if result.get("status") not in valid_statuses:
            result["status"] = "PARTIAL"

        result["score"]  = max(0, min(100, int(result.get("score", 50))))
        result["gaps"]   = result.get("gaps", [])
        result["method"] = "ollama"

        return result

    except Exception as e:
        print("[Validator] Microsoft Phi-3 Mini unavailable — using rule-based validation")
        return _rule_based_validate(map_title, map_description, map_department, evidence)
