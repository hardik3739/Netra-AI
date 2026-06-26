"""Fraud pattern library and matching utilities for ForgeShield.

Provides a curated FRAUD_PATTERNS list and a helper function
`match_patterns` that identifies which patterns match a given
ForgeShield scan output.
"""
from typing import List, Dict, Any
import json

FRAUD_PATTERNS: List[Dict[str, Any]] = [
    {
        "id": "FP001",
        "name": "Salary Slip Inflation",
        "description": "Digitally altering salary figures on payslips to qualify for higher loan amounts",
        "trigger_flags": ["pixel anomaly", "compression artifact", "font irregularity"],
        "trigger_keywords": ["salary", "gross pay", "net pay", "ctc", "per month"],
        "severity": "HIGH",
        "frequency": "Very Common",
        "india_impact": "Accounts for approximately 34% of retail loan fraud cases in India",
        "legal_reference": "Section 420 IPC — Cheating and dishonestly inducing delivery of property",
        "recommended_action": "Reject application. Request Form 16 directly from employer. File complaint if confirmed.",
        "detection_indicators": [
            "Inconsistent font weight in amount fields",
            "Copy-paste artifacts around figures",
            "Metadata mismatch"
        ]
    },
    {
        "id": "FP002",
        "name": "Duplicate Mortgage Fraud",
        "description": "Pledging the same property as collateral to multiple banks simultaneously",
        "trigger_flags": ["already mortgaged", "cersai", "survey number"],
        "trigger_keywords": ["sy", "survey", "land", "property", "collateral", "mortgage"],
        "severity": "CRITICAL",
        "frequency": "Common",
        "india_impact": "Caused losses exceeding ₹8,000 Crore to Indian banks in 2019-2023",
        "legal_reference": "Section 420 IPC + SARFAESI Act 2002 Section 31B",
        "recommended_action": "Immediately reject. Cross-verify with CERSAI. Report to Banking Ombudsman.",
        "detection_indicators": [
            "Survey number found in CERSAI as already mortgaged",
            "Multiple bank names in same document"
        ]
    },
    {
        "id": "FP003",
        "name": "Shell Company Fraud",
        "description": "Using struck-off or fictitious companies as employers or guarantors in loan applications",
        "trigger_flags": ["struck off", "mca21", "not found in registry"],
        "trigger_keywords": ["private limited", "pvt ltd", "ltd", "company", "employer", "guarantor"],
        "severity": "CRITICAL",
        "frequency": "Common",
        "india_impact": "Shell company fraud involved in 67% of large corporate NPAs in India",
        "legal_reference": "Companies Act 2013 Section 248 + RBI Master Circular on KYC",
        "recommended_action": "Reject immediately. Verify company status on MCA21 portal. File STR with FIU-IND.",
        "detection_indicators": [
            "Company name found as STRUCK OFF in MCA21",
            "CIN not traceable",
            "No GST registration found"
        ]
    },
    {
        "id": "FP004",
        "name": "Bank Statement Round-Tripping",
        "description": "Creating fake recurring credits in bank statements to inflate apparent income",
        "trigger_flags": ["amount inconsistency", "pattern anomaly"],
        "trigger_keywords": ["credit", "deposit", "transfer", "neft", "rtgs", "imps", "balance"],
        "severity": "HIGH",
        "frequency": "Very Common",
        "india_impact": "Primary method used in personal loan fraud — affects over 2 lakh cases annually",
        "legal_reference": "Section 420 IPC + Prevention of Money Laundering Act 2002",
        "recommended_action": "Request last 12 months statements directly from bank. Verify with CIBIL.",
        "detection_indicators": [
            "Regular round-number credits from same source",
            "Credits immediately followed by equal withdrawals",
            "Statement printed privately rather than bank-issued"
        ]
    },
    {
        "id": "FP005",
        "name": "Identity Document Cloning",
        "description": "Using another person's PAN, Aadhaar, or identity documents in a loan application",
        "trigger_flags": ["pan mismatch", "multiple pan", "identity conflict"],
        "trigger_keywords": ["pan", "aadhaar", "passport", "voter id", "identity"],
        "severity": "CRITICAL",
        "frequency": "Growing Rapidly",
        "india_impact": "Identity fraud cases grew 145% in Indian banking sector 2021-2024",
        "legal_reference": "Section 419/420 IPC + Aadhaar Act 2016 Section 29",
        "recommended_action": "Reject and escalate to fraud team. Verify PAN with Income Tax portal. File police complaint.",
        "detection_indicators": [
            "PAN format valid but photo mismatch",
            "Same PAN in multiple applications",
            "Aadhaar demographic mismatch"
        ]
    },
    {
        "id": "FP006",
        "name": "Post-dated Document Fraud",
        "description": "Submitting documents backdated or forward-dated to appear within loan eligibility periods",
        "trigger_flags": ["future date", "date inconsistency", "post-dated"],
        "trigger_keywords": ["date", "issued on", "valid from", "effective date"],
        "severity": "MEDIUM",
        "frequency": "Common",
        "india_impact": "Present in approximately 18% of all fraudulent loan applications reviewed by RBI",
        "legal_reference": "Section 464/465 IPC — Forgery of valuable security",
        "recommended_action": "Manual verification of document issuance date with issuing authority.",
        "detection_indicators": [
            "Document date is in the future",
            "Date format inconsistent with issuer standards",
            "Metadata creation date differs from printed date"
        ]
    }
]


def _normalize_list(value):
    """Ensure the value is a list of lowercase strings."""
    if value is None:
        return []
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, list):
                return [str(v).lower() for v in parsed]
        except Exception:
            return [value.lower()]
    if isinstance(value, list):
        return [str(v).lower() for v in value]
    return [str(value).lower()]


def match_patterns(nlp_flags: list, entities: dict, vit_score: float, filename: str) -> list:
    """Match FRAUD_PATTERNS against the outputs from ForgeShield.

    Rules:
    - If any pattern trigger_flags appear in `nlp_flags` (case-insensitive)
    - If any pattern trigger_keywords appear in `filename` or in any entity value
    - If either matches, pattern is triggered
    - Confidence: BOTH flags and keywords -> HIGH, else MEDIUM
    """
    nlp_list = _normalize_list(nlp_flags)
    fname = (filename or "").lower()

    # Flatten entity values to searchable strings
    entity_values = []
    if isinstance(entities, dict):
        for v in entities.values():
            if isinstance(v, list):
                entity_values.extend([str(x).lower() for x in v])
            else:
                entity_values.append(str(v).lower())

    matched = []
    for p in FRAUD_PATTERNS:
        flags = [f.lower() for f in p.get("trigger_flags", [])]
        kws = [k.lower() for k in p.get("trigger_keywords", [])]

        flag_match = False
        if nlp_list:
            for nf in nlp_list:
                for f in flags:
                    if f in nf or nf in f:
                        flag_match = True
                        break
                if flag_match:
                    break

        # Check keywords in filename or entities
        kw_in_fname = any(k in fname for k in kws)
        kw_in_entities = any(any(k in ev for ev in entity_values) for k in kws) if entity_values else False
        keyword_match = kw_in_fname or kw_in_entities

        if flag_match or keyword_match:
            confidence = "MEDIUM"
            if flag_match and keyword_match:
                confidence = "HIGH"

            p_copy = dict(p)
            p_copy["match_confidence"] = confidence
            matched.append(p_copy)

    return matched
