import re
import json
from datetime import datetime

# Helper: extract amounts from text (simple rupee detection)
AMOUNT_RE = re.compile(r'[₹Rs\.\s]*([0-9,]+(?:\.[0-9]{1,2})?)')
PAN_RE = re.compile(r'([A-Z]{5}[0-9]{4}[A-Z])')
SURVEY_RE = re.compile(r'(SY\d{3,}|SURVEY\s*NO\.?\s*\d+)')
DATE_RE = re.compile(r'(\d{1,2}[\-/]\d{1,2}[\-/]\d{2,4}|\d{1,2}\s+\w+\s+\d{4})')


def _extract_amounts_from_text(text: str):
    found = AMOUNT_RE.findall(text)
    nums = []
    for f in found:
        s = f.replace(',', '').strip()
        try:
            nums.append(float(s))
        except Exception:
            continue
    return nums


def _extract_company_names(text: str):
    # crude heuristic: capitalized words sequences up to 4 words
    candidates = re.findall(r'([A-Z][A-Za-z&\.,]{2,}(?:\s+[A-Z][A-Za-z&\.,]{2,}){0,3})', text)
    # dedupe and return
    unique = []
    for c in candidates:
        c = c.strip()
        if c not in unique and len(c) > 2:
            unique.append(c)
    return unique


def _extract_pan(text: str):
    m = PAN_RE.findall(text)
    return list(set(m))


def _extract_survey(text: str):
    m = SURVEY_RE.findall(text)
    return list(set(m))


def _extract_dates(text: str):
    m = DATE_RE.findall(text)
    dates = []
    for d in m:
        dates.append(d)
    return dates


def cross_document_check(documents: list) -> dict:
    """
    documents: list of dicts containing at least: doc_type, entities, risk_score, filename, created_at
    """
    cross_flags = []
    doc_count = len(documents)

    # Collect amounts and companies
    salary_amounts = []
    bank_credits = []
    company_names = set()
    pan_map = {}
    survey_map = {}
    all_dates = []
    scores = []

    for d in documents:
        scores.append(d.get('risk_score', 0) or 0)
        dtype = (d.get('doc_type') or '').lower()
        text_entities = ''
        try:
            # entities might be dict or string
            ents = d.get('entities')
            if isinstance(ents, dict):
                text_entities = json.dumps(ents)
            else:
                text_entities = str(ents or '')
        except Exception:
            text_entities = str(d.get('entities') or '')

        # amounts from entities text
        amounts = _extract_amounts_from_text(text_entities + ' ' + (d.get('filename') or ''))
        dates = _extract_dates(text_entities)
        all_dates.extend(dates)

        if dtype == 'salary_slip' or 'salary' in dtype:
            salary_amounts.extend(amounts)
        if dtype == 'bank_statement' or 'bank' in dtype:
            bank_credits.extend(amounts)

        # company names
        names = _extract_company_names(text_entities)
        for n in names:
            company_names.add(n)

        # PANs
        pans = _extract_pan(text_entities)
        for p in pans:
            if p not in pan_map:
                pan_map[p] = []
            pan_map[p].append(d.get('filename'))

        # survey numbers
        svs = _extract_survey(text_entities)
        for s in svs:
            if s not in survey_map:
                survey_map[s] = []
            survey_map[s].append(d.get('filename'))

    # a) Salary vs bank statement check
    if salary_amounts and bank_credits:
        avg_salary = sum(salary_amounts) / len(salary_amounts)
        avg_bank = sum(bank_credits) / len(bank_credits)
        if avg_bank < avg_salary * 0.7:
            cross_flags.append("Salary amount inconsistent with bank credits — possible salary slip inflation")

    # b) Company name consistency
    if len(company_names) > 1:
        cross_flags.append("Inconsistent employer name across documents")

    # c) Duplicate entity check (PAN / survey)
    for pan, files in pan_map.items():
        # if PAN appears in multiple files with different owner names — not trivial to detect owners here; flag if appears in multiple files
        if len(files) > 1:
            cross_flags.append("Entity identity conflict across documents (PAN appears in multiple documents)")
            break
    for sv, files in survey_map.items():
        if len(files) > 1:
            cross_flags.append("Entity identity conflict across documents (survey number appears in multiple documents)")
            break

    # d) Date consistency: if date span > 6 months (approx 180 days)
    parsed_dates = []
    for d in all_dates:
        try:
            # try common formats dd-mm-yyyy or dd/mm/yyyy
            if '/' in d or '-' in d:
                parts = re.split('[-/]', d)
                if len(parts[-1]) == 2:
                    year = int(parts[-1]) + 2000
                else:
                    year = int(parts[-1])
                day = int(parts[0])
                month = int(parts[1])
                parsed_dates.append(datetime(year, month, day))
            else:
                # try textual dates
                parsed_dates.append(datetime.strptime(d, '%d %B %Y'))
        except Exception:
            continue

    if parsed_dates:
        min_d = min(parsed_dates)
        max_d = max(parsed_dates)
        delta = (max_d - min_d).days if max_d and min_d else 0
        if delta > 180:
            cross_flags.append("Documents from significantly different time periods — may not represent current financial status")

    # e) cross_risk_score
    base = (sum(scores) / len(scores)) if scores else 0
    extra = 15 * len(cross_flags)
    cross_risk_score = min(100, round(base + extra, 2))

    # f) recommendation
    rec = ""
    if cross_risk_score <= 30:
        rec = "APPROVE — All documents consistent and genuine"
    elif cross_risk_score <= 55:
        rec = "MANUAL REVIEW — Minor inconsistencies detected"
    elif cross_risk_score <= 75:
        rec = "HOLD — Significant inconsistencies, request fresh documents"
    else:
        rec = "REJECT + FILE STR — High fraud probability detected"

    return {
        "cross_risk_score": cross_risk_score,
        "cross_flags": cross_flags,
        "recommendation": rec,
        "doc_count": doc_count
    }
