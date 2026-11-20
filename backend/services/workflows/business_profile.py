"""Workflow 1: Business Profile Generation.
Synthesizes company profile from locally stored business information using local AI.
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Company
from backend.services.ollama_service import ollama_service


async def generate_business_profile(
    company_id: int,
    db: Session,
    business_notes: Optional[str] = None,
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """Generate structured company profile from local notes using Ollama local inference."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise ValueError(f"Company ID {company_id} not found.")

    notes = business_notes or company.raw_business_notes or company.description or ""
    
    prompt = f"""You are an expert sales strategy analyst. Analyze the following business information for company '{company.name}' and synthesize a structured, executive business profile.

Business Notes / Context:
{notes}

Domain / Website: {company.domain or 'N/A'}
Industry: {company.industry or 'N/A'}

Return a JSON object with the following keys:
- "industry_vertical": Detailed industry classification
- "business_model": e.g., B2B SaaS, Managed Services, Enterprise Software, etc.
- "target_market": Summary of ideal customer organization types and buyers
- "core_value_proposition": Punchy single-sentence value proposition
- "key_differentiators": List of 3-4 bullet points highlighting competitive advantages
- "sales_context": High-level strategic context for outbound sales messaging
- "summary_markdown": A clean 2-paragraph executive overview in markdown

Ensure output is strictly valid JSON only. No preamble or conversational filler."""

    deterministic_fallback = json.dumps({
        "industry_vertical": company.industry or "Enterprise B2B Software",
        "business_model": "B2B SaaS / Solution Provider",
        "target_market": company.target_market or "Mid-market to Enterprise organizations seeking workflow optimization",
        "core_value_proposition": f"{company.name} delivers modern, scalable software that accelerates business growth and automates mission-critical operations.",
        "key_differentiators": [
            "Rapid deployment and local infrastructure control",
            "Zero cloud lock-in and transparent ownership",
            "Custom workflow automation tailored to modern sales teams",
            "Enterprise-grade reliability and security"
        ],
        "sales_context": f"Position {company.name} as a modern, high-ROI partner solving operational inefficiencies for fast-growing organizations.",
        "summary_markdown": f"### {company.name} Executive Business Profile\n\n**{company.name}** operates as an innovative B2B solutions provider focused on delivering high-efficiency technology.\n\nThe organization targets progressive commercial teams requiring modern automation, seamless integrations, and reliable performance."
    }, indent=2)

    result = await ollama_service.generate(
        prompt=prompt,
        workflow_name="business_profile_generation",
        system_prompt="You are a senior B2B sales strategist. You produce strict, valid JSON responses.",
        model=model_override,
        db=db,
        entity_type="Company",
        entity_id=company.id,
        deterministic_fallback=deterministic_fallback,
    )

    response_text = result["text"]
    
    # Try parsing JSON or clean markdown
    try:
        # Extract json block if wrapped in ```json
        cleaned = response_text
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        parsed_data = json.loads(cleaned)
    except Exception:
        parsed_data = json.loads(deterministic_fallback)

    # Normalize fields if LLM returned structured objects instead of strings
    if isinstance(parsed_data.get("target_market"), dict):
        parts = []
        for k, v in parsed_data["target_market"].items():
            if isinstance(v, (dict, list)):
                parts.append(f"{k.replace('_', ' ').title()}: {json.dumps(v)}")
            else:
                parts.append(f"{k.replace('_', ' ').title()}: {v}")
        parsed_data["target_market"] = " | ".join(parts)
    elif isinstance(parsed_data.get("target_market"), list):
        parsed_data["target_market"] = ", ".join(str(x) for x in parsed_data["target_market"])

    if isinstance(parsed_data.get("key_differentiators"), list):
        parsed_data["key_differentiators"] = [
            str(x) if not isinstance(x, (dict, list)) else json.dumps(x)
            for x in parsed_data["key_differentiators"]
        ]

    # Update company record
    company.generated_profile = json.dumps(parsed_data, indent=2)
    if parsed_data.get("industry_vertical") and not company.industry:
        company.industry = str(parsed_data["industry_vertical"])
    if parsed_data.get("target_market") and not company.target_market:
        company.target_market = str(parsed_data["target_market"])
    if parsed_data.get("sales_context") and not company.business_context:
        company.business_context = str(parsed_data["sales_context"])
    
    db.commit()

    return {
        "company_id": company.id,
        "company_name": company.name,
        "profile": parsed_data,
        "model_used": result["model"],
        "duration_ms": result["duration_ms"],
        "tokens": result["tokens"],
        "is_deterministic_preview": result.get("is_deterministic_preview", False),
    }
