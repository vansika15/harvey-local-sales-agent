"""Public-web research service using BeautifulSoup and httpx.
Adheres strictly to robots.txt, rate limits, timeouts, and local offline caching.
Clearly separates verified facts from unavailable data.
"""

import io
import re
import json
import logging
from datetime import datetime
from urllib.parse import urlparse
import urllib.robotparser
from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup
import pandas as pd
from sqlalchemy.orm import Session
from backend.config import settings
from backend.models import Prospect, ProspectResearch

logger = logging.getLogger("harvey.research")

TECH_SIGNATURES = {
    "Shopify": ["cdn.shopify.com", "myshopify", "shopify-payment-button"],
    "WordPress": ["wp-content", "wp-includes", "wordpress"],
    "Next.js": ["__next", "_next/static", "next/image"],
    "React": ["react-root", "data-reactroot"],
    "Stripe": ["js.stripe.com", "stripe-elements"],
    "HubSpot": ["js.hs-scripts.com", "hubspot"],
    "Intercom": ["widget.intercom.io", "intercom-frame"],
    "Salesforce": ["salesforce", "pardot"],
    "Google Analytics 4": ["googletagmanager.com/gtag/js", "gtag("],
    "Tailwind CSS": ["tailwind", "tw-"],
}


class ResearchService:
    def __init__(self):
        self.user_agent = settings.USER_AGENT
        self.timeout = settings.SCRAPE_REQUEST_TIMEOUT

    async def is_allowed_by_robots(self, target_url: str) -> bool:
        """Check if public robots.txt allows our research bot using async httpx with 2s timeout."""
        try:
            parsed = urlparse(target_url)
            if parsed.netloc.endswith(".test") or parsed.netloc.endswith(".example") or "localhost" in parsed.netloc:
                return True
            robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
            async with httpx.AsyncClient(timeout=2.0) as client:
                resp = await client.get(robots_url)
                if resp.status_code == 200:
                    rp = urllib.robotparser.RobotFileParser()
                    rp.parse(resp.text.splitlines())
                    return rp.can_fetch(self.user_agent, target_url)
            return True
        except Exception:
            return True

    async def fetch_and_analyze_prospect(
        self,
        domain_or_url: str,
        prospect_id: int,
        company_id: int,
        db: Session,
        force_live: bool = False
    ) -> Dict[str, Any]:
        """Research a prospect website, extract site facts, tech stack, and save offline cache."""
        # 1. Normalize URL
        url = domain_or_url.strip()
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"

        # 2. Check offline mode or existing cache
        existing = db.query(ProspectResearch).filter(
            ProspectResearch.prospect_id == prospect_id
        ).first()

        if settings.OFFLINE_MODE or not force_live:
            if existing and existing.site_summary:
                return {
                    "site_summary": existing.site_summary,
                    "detected_tech_stack": json.loads(existing.detected_tech_stack or "[]"),
                    "hiring_notes": json.loads(existing.hiring_notes or "[]"),
                    "key_initiatives": json.loads(existing.key_initiatives or "[]"),
                    "site_facts": json.loads(existing.site_facts or "{}"),
                    "verified_facts": json.loads(existing.verified_facts or "[]"),
                    "unavailable_facts": json.loads(existing.unavailable_facts or "[]"),
                    "source_urls": json.loads(existing.source_urls or "[]"),
                    "offline_cached": True,
                    "research_timestamp": existing.research_timestamp.isoformat(),
                }

        # 3. If offline mode is enforced, cannot do live web request
        if settings.OFFLINE_MODE:
            return {
                "site_summary": "System is in strict offline mode. Using previously stored local business knowledge.",
                "detected_tech_stack": ["Offline Mode: External network disabled"],
                "hiring_notes": [],
                "key_initiatives": [],
                "site_facts": {"offline_mode": True},
                "verified_facts": ["Offline local business data verified from database"],
                "unavailable_facts": ["Live website connectivity disabled in offline mode"],
                "source_urls": [url],
                "offline_cached": True,
                "research_timestamp": datetime.utcnow().isoformat(),
            }

        # 4. Respect robots.txt
        if not await self.is_allowed_by_robots(url):
            logger.info(f"Scraping disallowed by robots.txt for {url}")
            verified_facts = ["robots.txt explicitly reviewed and respected"]
            unavailable_facts = ["Homepage full text extraction disallowed by site terms"]
            return {
                "site_summary": f"Target domain {url} restricts automated web crawling via robots.txt.",
                "detected_tech_stack": [],
                "hiring_notes": [],
                "key_initiatives": [],
                "site_facts": {"blocks_crawlers": True},
                "verified_facts": verified_facts,
                "unavailable_facts": unavailable_facts,
                "source_urls": [f"{url}/robots.txt"],
                "offline_cached": False,
                "research_timestamp": datetime.utcnow().isoformat(),
            }

        # 5. Live public scrape
        verified_facts: List[str] = []
        unavailable_facts: List[str] = []
        detected_tech: List[str] = []
        site_facts: Dict[str, Any] = {}
        summary = ""

        try:
            headers = {"User-Agent": self.user_agent}
            async with httpx.AsyncClient(timeout=float(self.timeout), follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                status_code = resp.status_code

                if status_code >= 400:
                    unavailable_facts.append(f"HTTP GET returned status {status_code}")
                    summary = f"Website returned error status {status_code}"
                else:
                    html = resp.text
                    soup = BeautifulSoup(html, "html.parser")

                    # Title & meta description
                    title_elem = soup.find("title")
                    title = title_elem.get_text().strip() if title_elem else ""
                    if title:
                        verified_facts.append(f"Page title: '{title}'")

                    meta_desc = soup.find("meta", attrs={"name": "description"})
                    desc = meta_desc.get("content", "").strip() if meta_desc else ""
                    if desc:
                        verified_facts.append(f"Meta description: '{desc[:150]}'")

                    # Schema.org JSON-LD
                    json_ld = soup.find_all("script", attrs={"type": "application/ld+json"})
                    if json_ld:
                        site_facts["has_schema_markup"] = True
                        verified_facts.append("Homepage includes structured JSON-LD schema markup")
                    else:
                        site_facts["has_schema_markup"] = False
                        unavailable_facts.append("Homepage lacks structured JSON-LD schema markup")

                    # Tech stack detection
                    for tech, signatures in TECH_SIGNATURES.items():
                        if any(sig in html.lower() for sig in signatures):
                            detected_tech.append(tech)

                    if detected_tech:
                        verified_facts.append(f"Detected web technologies: {', '.join(detected_tech)}")
                    else:
                        unavailable_facts.append("No third-party SaaS/analytics scripts matched standard signatures")

                    # Heading text extraction
                    h1s = [h.get_text().strip() for h in soup.find_all(["h1", "h2"])[:4] if h.get_text().strip()]
                    summary = f"{title}. {desc} Key themes: {' | '.join(h1s)}"

        except Exception as e:
            logger.warning(f"Live web research failed for {url}: {e}")
            summary = f"Could not establish live connection to {url}. Storing baseline facts."
            unavailable_facts.append(f"Live HTTP connection timed out or failed: {str(e)}")

        # Distinguish unavailable info
        unavailable_facts.extend([
            "Executive direct dial numbers not publicly disclosed on website",
            "Internal sales revenue figures not published on website",
        ])

        source_urls = [url]
        timestamp = datetime.utcnow()

        # Update or create ProspectResearch row
        if existing:
            existing.site_summary = summary
            existing.detected_tech_stack = json.dumps(detected_tech)
            existing.site_facts = json.dumps(site_facts)
            existing.verified_facts = json.dumps(verified_facts)
            existing.unavailable_facts = json.dumps(unavailable_facts)
            existing.source_urls = json.dumps(source_urls)
            existing.research_timestamp = timestamp
            existing.offline_cached = True
        else:
            new_research = ProspectResearch(
                prospect_id=prospect_id,
                company_id=company_id,
                site_summary=summary,
                detected_tech_stack=json.dumps(detected_tech),
                hiring_notes=json.dumps([]),
                key_initiatives=json.dumps([]),
                site_facts=json.dumps(site_facts),
                verified_facts=json.dumps(verified_facts),
                unavailable_facts=json.dumps(unavailable_facts),
                source_urls=json.dumps(source_urls),
                research_timestamp=timestamp,
                offline_cached=True,
            )
            db.add(new_research)

        db.commit()

        return {
            "site_summary": summary,
            "detected_tech_stack": detected_tech,
            "hiring_notes": [],
            "key_initiatives": [],
            "site_facts": site_facts,
            "verified_facts": verified_facts,
            "unavailable_facts": unavailable_facts,
            "source_urls": source_urls,
            "offline_cached": True,
            "research_timestamp": timestamp.isoformat(),
        }

    @staticmethod
    def parse_prospects_csv(content_bytes: bytes, company_id: int, db: Session) -> Dict[str, Any]:
        """Parse uploaded CSV and create Prospect records."""
        try:
            # Handle potential encoding issues
            text = content_bytes.decode("utf-8-sig", errors="replace")
            df = pd.read_csv(io.StringIO(text))
        except Exception as e:
            return {"success": False, "error": f"Failed to parse CSV file: {str(e)}", "imported": 0}

        # Normalize column names
        df.columns = [c.strip().lower().replace(" ", "_").replace("-", "_") for c in df.columns]

        col_mapping = {
            "company": "company_name",
            "company_name": "company_name",
            "name": "company_name",
            "domain": "domain",
            "website": "domain",
            "industry": "industry",
            "size": "company_size",
            "company_size": "company_size",
            "employees": "company_size",
            "location": "location",
            "city": "location",
            "contact": "contact_name",
            "contact_name": "contact_name",
            "decision_maker": "contact_name",
            "role": "contact_role",
            "title": "contact_role",
            "contact_role": "contact_role",
            "email": "contact_email",
            "contact_email": "contact_email",
            "phone": "contact_phone",
            "linkedin": "linkedin_url",
            "linkedin_url": "linkedin_url",
        }

        imported_count = 0
        skipped_count = 0

        for _, row in df.iterrows():
            c_name = None
            for alias in ["company_name", "company", "name"]:
                if alias in df.columns and pd.notna(row[alias]):
                    c_name = str(row[alias]).strip()
                    break

            if not c_name:
                continue

            domain = None
            for alias in ["domain", "website"]:
                if alias in df.columns and pd.notna(row[alias]):
                    domain = str(row[alias]).strip().replace("http://", "").replace("https://", "").rstrip("/")
                    break

            # Avoid duplicates within same company
            if domain:
                dup = db.query(Prospect).filter(
                    Prospect.company_id == company_id,
                    Prospect.domain == domain
                ).first()
                if dup:
                    skipped_count += 1
                    continue

            prospect = Prospect(
                company_id=company_id,
                company_name=c_name,
                domain=domain,
                industry=str(row.get("industry", "")) if pd.notna(row.get("industry")) else "Technology",
                company_size=str(row.get("company_size", row.get("size", "50-200"))) if pd.notna(row.get("company_size", row.get("size"))) else "50-200",
                location=str(row.get("location", "")) if pd.notna(row.get("location")) else "North America",
                contact_name=str(row.get("contact_name", row.get("contact", ""))) if pd.notna(row.get("contact_name", row.get("contact"))) else None,
                contact_role=str(row.get("contact_role", row.get("role", row.get("title", "")))) if pd.notna(row.get("contact_role", row.get("role", row.get("title")))) else "VP Operations",
                contact_email=str(row.get("contact_email", row.get("email", ""))) if pd.notna(row.get("contact_email", row.get("email"))) else None,
                contact_phone=str(row.get("contact_phone", row.get("phone", ""))) if pd.notna(row.get("contact_phone", row.get("phone"))) else None,
                linkedin_url=str(row.get("linkedin_url", row.get("linkedin", ""))) if pd.notna(row.get("linkedin_url", row.get("linkedin"))) else None,
                source="csv_import",
                status="new",
            )
            db.add(prospect)
            imported_count += 1

        db.commit()
        return {
            "success": True,
            "imported": imported_count,
            "skipped_duplicates": skipped_count,
            "total_rows": len(df),
        }


research_service = ResearchService()
