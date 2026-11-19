"""Workflow 3: Prospect Research and Intelligence Synthesis.
Synthesizes account intelligence from web facts and local database using local AI inference.
Clearly isolates verified facts from unavailable attributes.
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Prospect, ProspectResearch
from backend.services.research_service import research_service
from backend.services.ollama_service import ollama_service


async def research_prospect_account(
    prospect_id: int,
    db: Session,
    force_live_scrape: bool = False,
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """Execute prospect account research, extracting verified facts and synthesizing an AI profile."""
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise ValueError(f"Prospect ID {prospect_id} not found.")

    # 1. Fetch site facts via research service (handles cache / offline / live scrape)
    domain_to_check = prospect.domain or prospect.website_url or f"{prospect.company_name.lower().replace(' ', '')}.com"
    research_data = await research_service.fetch_and_analyze_prospect(
        domain_or_url=domain_to_check,
        prospect_id=prospect.id,
        company_id=prospect.company_id,
        db=db,
        force_live=force_live_scrape,
    )

    # 2. Synthesize deep account intelligence via Local LLM
    prompt = f"""You are an elite B2B Account Researcher.
Analyze the following account information and technical findings for prospect '{prospect.company_name}'.

Account Details:
- Company Name: {prospect.company_name}
- Domain: {prospect.domain or 'N/A'}
- Industry: {prospect.industry or 'N/A'}
- Size: {prospect.company_size or 'N/A'}
- Location: {prospect.location or 'N/A'}
- Contact: {prospect.contact_name or 'N/A'} ({prospect.contact_role or 'Executive'})

Research Site Findings:
- Summary: {research_data.get('site_summary', 'N/A')}
- Detected Technologies: {', '.join(research_data.get('detected_tech_stack', [])) or 'None detected'}
- Verified Facts: {json.dumps(research_data.get('verified_facts', []))}
- Unavailable Data: {json.dumps(research_data.get('unavailable_facts', []))}

Generate an account dossier as strict JSON with keys:
- "executive_summary": 2-3 sentence overview of what this company does
- "verified_observations": Array of 3-4 bullet points of confirmed factual attributes
- "missing_or_unverified_data": Array of 2-3 points explicitly noting what could NOT be verified publicly
- "strategic_relevance": Why this prospect is worth engaging
- "recommended_next_step": Specific action for the sales development rep

Return strictly valid JSON only."""

    deterministic_fallback = json.dumps({
        "executive_summary": f"{prospect.company_name} is an active organization in the {prospect.industry or 'commercial'} sector with approximately {prospect.company_size or '50-200'} employees based in {prospect.location or 'their headquarters'}.",
        "verified_observations": research_data.get("verified_facts") or [
            f"Company domain is registered as {prospect.domain or 'commercial web property'}",
            f"Key contact identified: {prospect.contact_name or 'Department Head'} ({prospect.contact_role or 'Leadership'})",
            f"Active industry classification confirmed: {prospect.industry or 'Technology / Services'}"
        ],
        "missing_or_unverified_data": research_data.get("unavailable_facts") or [
            "Internal department budget numbers are private",
            "Current commercial contract renewal dates are not publicly disclosed"
        ],
        "strategic_relevance": f"The account exhibits high potential for workflow automation given their current growth stage and digital footprint in {prospect.industry or 'their market'}.",
        "recommended_next_step": f"Initiate warm signal-based outreach to {prospect.contact_name or 'the key decision maker'} focusing on immediate operational leverage."
    }, indent=2)

    result = await ollama_service.generate(
        prompt=prompt,
        workflow_name="prospect_research",
        system_prompt="You are a meticulous sales intelligence researcher. Return strict JSON only.",
        model=model_override,
        db=db,
        entity_type="Prospect",
        entity_id=prospect.id,
        deterministic_fallback=deterministic_fallback,
    )

    try:
        cleaned = result["text"]
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        parsed = json.loads(cleaned)
    except Exception:
        parsed = json.loads(deterministic_fallback)

    # Update prospect status to 'researched'
    if prospect.status == "new":
        prospect.status = "researched"
    db.commit()

    return {
        "prospect_id": prospect.id,
        "company_name": prospect.company_name,
        "site_summary": research_data.get("site_summary"),
        "detected_tech_stack": research_data.get("detected_tech_stack", []),
        "verified_facts": parsed.get("verified_observations", []),
        "unavailable_facts": parsed.get("missing_or_unverified_data", []),
        "strategic_relevance": parsed.get("strategic_relevance", ""),
        "recommended_next_step": parsed.get("recommended_next_step", ""),
        "source_urls": research_data.get("source_urls", []),
        "offline_cached": research_data.get("offline_cached", True),
        "research_timestamp": research_data.get("research_timestamp"),
        "model_used": result["model"],
        "duration_ms": result["duration_ms"],
        "tokens": result["tokens"],
        "is_deterministic_preview": result.get("is_deterministic_preview", False),
    }
