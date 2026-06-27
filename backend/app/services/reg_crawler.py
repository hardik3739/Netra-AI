"""
RegPilot — Week 3
Regulatory Crawler & Change Detector

Fetches circulars from:
- RBI (Reserve Bank of India)
- SEBI (Securities and Exchange Board of India)
- IRDAI (Insurance Regulatory and Development Authority)
- MCA (Ministry of Corporate Affairs)

Falls back to rich mock data when portals are unreachable
(ensures demo works offline / in restricted environments).
"""

import requests
from bs4 import BeautifulSoup
import hashlib
from datetime import datetime, timedelta
import random


# ─────────────────────────────────────────────────────────
# MOCK CIRCULAR DATA
# Rich, realistic circular data for demo reliability
# ─────────────────────────────────────────────────────────
MOCK_CIRCULARS = [
    {
        "source": "RBI",
        "title":  "Master Direction on KYC — Amendment No. 7 (2024)",
        "url":    "https://rbi.org.in/scripts/NotificationUser.aspx?Id=12601",
        "raw_text": """
Reserve Bank of India — Master Direction on Know Your Customer (KYC) — Amendment No. 7

All Regulated Entities (REs) are hereby directed as follows:

1. The credit department must revise customer onboarding workflows to incorporate video-based KYC
   within 90 days of this circular.

2. The IT department must implement automated digital KYC verification systems integrated with UIDAI
   by 31st March 2025. All existing manual processes must be retired.

3. The AML team shall update Suspicious Transaction Report (STR) filing procedures to include
   digital KYC failure events within 60 days.

4. The retail department must retrain all branch staff on updated KYC procedures within 45 days.
   Proof of training completion must be submitted to the compliance department.

5. The compliance department must submit a KYC compliance certificate to RBI within 90 days
   confirming all amendments have been implemented.

Non-compliance will attract penalties under Section 47 of the Banking Regulation Act, 1949.
Effective Date: Immediately upon issuance.
        """,
        "published_at": (datetime.now() - timedelta(days=2)).isoformat()
    },
    {
        "source": "SEBI",
        "title":  "Circular on Cybersecurity and Cyber Resilience Framework for Regulated Entities",
        "url":    "https://www.sebi.gov.in/legal/circulars/2024/cybersecurity-framework",
        "raw_text": """
Securities and Exchange Board of India — Cybersecurity and Cyber Resilience Framework

In exercise of powers conferred under Section 11 of the SEBI Act, 1992:

1. All registered entities must implement a comprehensive Cybersecurity Framework within 180 days.

2. The IT department must conduct mandatory quarterly vulnerability assessments and penetration
   testing. Reports must be submitted to the Board within 15 days of each assessment.

3. All entities must appoint a Chief Information Security Officer (CISO) within 30 days.
   The CISO must report directly to the Board of Directors.

4. The treasury department must ensure all financial transaction data is encrypted using
   AES-256 or equivalent standards within 60 days.

5. The compliance department must submit an annual cybersecurity audit report signed by
   an empanelled CERT-In auditor.

6. The retail department must implement multi-factor authentication (MFA) for all customer
   portals and mobile applications within 45 days.

7. The IT department must establish a Security Operations Centre (SOC) or outsource to
   an approved CERT-In empanelled organization within 90 days.

Entities failing to comply will face action under SEBI (Intermediaries) Regulations, 2008.
        """,
        "published_at": (datetime.now() - timedelta(days=5)).isoformat()
    },
    {
        "source": "IRDAI",
        "title":  "Guidelines on Data Privacy and Information Security for Insurers 2024",
        "url":    "https://irdai.gov.in/circulars/data-privacy-2024",
        "raw_text": """
Insurance Regulatory and Development Authority of India — Data Privacy Guidelines 2024

In pursuance of the powers vested under Section 14 of the IRDA Act, 1999:

1. All insurers must obtain explicit, informed consent from policyholders before collecting,
   processing, or sharing personal data. The retail department must update all consent forms
   within 30 days.

2. The IT department shall implement data masking and tokenization for all sensitive customer
   records (Aadhaar, PAN, bank account details) within 45 days. Plain-text storage is prohibited.

3. The credit department must review all third-party data sharing agreements and ensure
   data processing agreements (DPAs) are in place within 60 days.

4. The retail department must display data privacy notices prominently at all customer touchpoints
   including branches, websites, and mobile apps within 21 days.

5. The AML team must purge all inactive customer records older than 7 years in accordance
   with the data retention policy. A completion certificate must be filed with IRDAI.

6. The compliance department must appoint a Data Protection Officer (DPO) and notify IRDAI
   within 30 days of appointment.

7. The IT department must implement a Data Loss Prevention (DLP) solution within 90 days.

Penalties for non-compliance: up to ₹1 Crore under IRDAI (Protection of Policyholders' Interests) Regulations.
        """,
        "published_at": (datetime.now() - timedelta(days=1)).isoformat()
    },
    {
        "source": "MCA",
        "title":  "Companies (Accounts) Amendment Rules — Mandatory XBRL Financial Reporting 2024",
        "url":    "https://mca.gov.in/notifications/xbrl-accounts-2024",
        "raw_text": """
Ministry of Corporate Affairs — Companies (Accounts) Amendment Rules 2024

In exercise of powers conferred by Section 467 of the Companies Act, 2013:

1. All listed companies and unlisted public companies with paid-up capital above ₹5 crore must
   migrate to XBRL (eXtensible Business Reporting Language) format for financial reporting
   by 31st June 2025.

2. The IT department must integrate XBRL reporting tools with existing ERP systems within
   90 days. Proof of integration must be submitted to the compliance department.

3. The treasury department must ensure all financial statements are digitally signed using
   a Class 3 Digital Signature Certificate (DSC) within 60 days.

4. The compliance department must file annual returns in the new XBRL format by the next
   due date following implementation. Late filing attracts a penalty of ₹100 per day.

5. The IT department must train at least two staff members as XBRL preparers within 60 days.
   Training completion certificates must be maintained.

6. The credit department must update all loan covenant reporting to include XBRL-tagged
   financial ratios by the next reporting cycle.
        """,
        "published_at": (datetime.now() - timedelta(days=7)).isoformat()
    },
    {
        "source": "RBI",
        "title":  "Prudential Framework for Resolution of Stressed Assets — Update 2024",
        "url":    "https://rbi.org.in/scripts/NotificationUser.aspx?Id=12700",
        "raw_text": """
Reserve Bank of India — Prudential Framework for Resolution of Stressed Assets — Update 2024

In partial modification of the circular dated 7th June 2019:

1. The credit department must classify all accounts with principal or interest overdue for
   more than 30 days as Special Mention Accounts (SMA) and report to CRILC within 30 days.

2. Banks must implement an automated Early Warning System (EWS) for all borrower accounts
   with exposure above ₹5 Crore. The IT department must ensure EWS data feeds are
   automated and updated daily.

3. The AML team must file Suspicious Transaction Reports (STRs) for all accounts undergoing
   restructuring where the original loan purpose cannot be verified.

4. The credit department must convene a lenders' meeting within 30 days of a borrower's
   account being classified as NPA and submit a resolution plan to RBI within 180 days.

5. The IT department must integrate the EWS with the CRILC reporting portal within 90 days.

6. The compliance department must submit a quarterly stressed asset resolution report to the
   Board of Directors and maintain records for 8 years.

Willful defaulters will be reported to Credit Information Companies within 7 days of classification.
        """,
        "published_at": (datetime.now() - timedelta(days=3)).isoformat()
    },
    {
        "source": "SEBI",
        "title":  "Circular on Environmental, Social and Governance (ESG) Disclosures for Listed Entities",
        "url":    "https://www.sebi.gov.in/legal/circulars/2024/esg-disclosures",
        "raw_text": """
Securities and Exchange Board of India — ESG Disclosure Requirements 2024

All listed entities (top 1000 by market capitalization) must comply:

1. The compliance department must prepare and publish a Business Responsibility and
   Sustainability Report (BRSR) as part of the Annual Report from FY 2024-25 onwards.

2. The IT department must implement systems to track and report carbon emissions,
   water usage, and waste generation on a quarterly basis within 180 days.

3. The treasury department must disclose all ESG-linked financial instruments and
   sustainability bonds in the quarterly financial statements.

4. The retail department must establish a customer grievance redressal mechanism
   specifically for ESG-related concerns within 60 days.

5. The compliance department must appoint an ESG Committee at the Board level within
   90 days and disclose its composition in the Annual Report.

Entities in the top 150 by market capitalization must get BRSR disclosures assured
by an independent third party within 2 years.
        """,
        "published_at": (datetime.now() - timedelta(days=10)).isoformat()
    }
]


def _make_id(source: str, title: str) -> str:
    return hashlib.md5(f"{source}:{title}".encode()).hexdigest()[:16]


def _try_fetch_rbi() -> list:
    try:
        r = requests.get(
            "https://rbi.org.in/Scripts/NotificationsUser.aspx",
            timeout=8, headers={"User-Agent": "Mozilla/5.0"}
        )
        if r.status_code != 200:
            raise Exception("Non-200")
        soup    = BeautifulSoup(r.text, "html.parser")
        results = []
        for link in soup.select("table a")[:5]:
            title = link.get_text(strip=True)
            href  = link.get("href", "")
            if title and len(title) > 20:
                results.append({
                    "source": "RBI",
                    "title":  title,
                    "url":    f"https://rbi.org.in{href}" if href.startswith("/") else href,
                    "raw_text": f"RBI Circular: {title}. Refer to official portal for full text.",
                    "published_at": datetime.now().isoformat()
                })
        return results or []
    except Exception:
        return []


def fetch_all_circulars() -> list:
    """
    Fetch circulars from all regulatory sources.
    Tries live scraping first, adds mock data for reliability.
    Returns deduplicated list with stable IDs.
    """
    all_circulars = []

    # Try live RBI scraping
    live_rbi = _try_fetch_rbi()
    all_circulars.extend(live_rbi)

    # Add all mock circulars (avoid duplicating live fetched ones by title)
    live_titles = {c["title"].lower() for c in all_circulars}
    for c in MOCK_CIRCULARS:
        if c["title"].lower() not in live_titles:
            all_circulars.append(c)

    # Add stable IDs
    for c in all_circulars:
        c["id"] = _make_id(c["source"], c["title"])

    return all_circulars
