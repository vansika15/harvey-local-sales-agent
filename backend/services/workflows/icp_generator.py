"""Workflow 2: Product-Specific ICP Generation.
Generates tailored Ideal Customer Profiles for specific products using local AI inference.
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Product, Company, ICPProfile
from backend.services.ollama_service import ollama_service


async def generate_product_icp(
    product_id: int,
    db: Session,
    additional_guidelines: Optional[str] = None,
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """Generate product-specific ICP using Ollama local inference."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product ID {product_id} not found.")

    company = db.query(Company).filter(Company.id == product.company_id).first()

    prompt = f"""You are an elite B2B Go-To-Market and RevOps Architect.
Analyze the following product details and generate an in-depth, product-specific Ideal Customer Profile (ICP).

Product Name: {product.name}
Parent Company: {company.name if company else 'Unknown'}
Product Category: {product.category or 'B2B Software'}
Product Description: {product.description}
Current Value Proposition: {product.value_proposition or 'Not specified'}
Target Customer Summary: {product.target_customer_summary or 'Not specified'}
Known Pain Points Solved: {product.pain_points_solved or '[]'}
Features: {product.features or '[]'}
Pricing Model: {product.pricing_model or 'Subscription'}
Additional Strategic Guidelines: {additional_guidelines or 'None'}

Return a JSON object with EXACTLY these keys:
- "target_industries": Array of 3-5 specific vertical industries most likely to buy this product
- "company_sizes": Array of employee size tiers (e.g. ["50-200 employees", "201-1000 employees"])
- "decision_maker_roles": Array of 4-6 specific job titles who control budget and sign off (e.g. ["VP Sales", "Chief Technology Officer"])
- "target_geographies": Array of optimal regions (e.g. ["North America", "UK & Western Europe"])
- "core_pain_points": Array of 4-5 acute business problems this product resolves
- "buying_triggers": Array of 3-4 organizational events or signals that trigger an urgent purchase
- "disqualifiers": Array of 3-4 characteristics that indicate a bad fit
- "pitch_angle": A crisp 2-sentence positioning angle for sales reps

Return strictly valid JSON only. No markdown formatting around the JSON."""

    deterministic_fallback = json.dumps({
        "target_industries": [
            "B2B SaaS & Cloud Software",
            "Professional & Financial Services",
            "E-commerce & Logistics",
            "HealthTech & Managed Care",
            "Industrial & Manufacturing Services"
        ],
        "company_sizes": [
            "50-200 employees (Scale-up tier)",
            "201-1,000 employees (Mid-market tier)",
            "1,001-5,000 employees (Enterprise tier)"
        ],
        "decision_maker_roles": [
            "Vice President of Sales / Revenue",
            "Head of Business Development",
            "Chief Technology Officer (CTO)",
            "VP of Operations / RevOps",
            "Managing Director / Founder"
        ],
        "target_geographies": [
            "North America (US & Canada)",
            "United Kingdom & Ireland",
            "Western Europe (DACH & Nordics)",
            "Australia & New Zealand"
        ],
        "core_pain_points": [
            "High customer acquisition costs and low cold outreach conversion rates",
            "Fragmented sales tech stacks causing slow lead enrichment and duplicate research",
            "Sales reps spending 60%+ of their time researching accounts instead of selling",
            "Lack of contextual personalization leading to high prospect spam complaints",
            "Inability to detect real-time commercial buying signals before competitors"
        ],
        "buying_triggers": [
            "Recent funding round or aggressive quarterly growth targets",
            "Rapid hiring of sales development reps or account executives",
            "Launch of new product lines or expansion into new geographic territories",
            "Executive leadership change (new CRO, VP Sales, or Head of Ops)"
        ],
        "disqualifiers": [
            "Pure B2C companies with no high-ticket sales motions",
            "Very early stage pre-revenue teams without dedicated sales budget",
            "Companies with strict blanket outbound contact bans",
            "Non-digital or cash-only localized retail operations"
        ],
        "pitch_angle": f"Empower revenue leaders to cut prospecting cycle times by 75% with {product.name}'s intelligent, autonomous account research and signal-based outreach."
    }, indent=2)

    result = await ollama_service.generate(
        prompt=prompt,
        workflow_name="icp_generation",
        system_prompt="You are a B2B sales development strategist. Output only valid JSON.",
        model=model_override,
        db=db,
        entity_type="Product",
        entity_id=product.id,
        deterministic_fallback=deterministic_fallback,
    )

    response_text = result["text"]
    try:
        cleaned = response_text
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        parsed_data = json.loads(cleaned)
    except Exception:
        parsed_data = json.loads(deterministic_fallback)

    # Persist or update ICPProfile in database
    icp = db.query(ICPProfile).filter(ICPProfile.product_id == product.id).first()
    if not icp:
        icp = ICPProfile(
            product_id=product.id,
            company_id=product.company_id,
        )
        db.add(icp)

    icp.target_industries = json.dumps(parsed_data.get("target_industries", []))
    icp.company_sizes = json.dumps(parsed_data.get("company_sizes", []))
    icp.decision_maker_roles = json.dumps(parsed_data.get("decision_maker_roles", []))
    icp.target_geographies = json.dumps(parsed_data.get("target_geographies", []))
    icp.core_pain_points = json.dumps(parsed_data.get("core_pain_points", []))
    icp.buying_triggers = json.dumps(parsed_data.get("buying_triggers", []))
    icp.disqualifiers = json.dumps(parsed_data.get("disqualifiers", []))
    icp.pitch_angle = parsed_data.get("pitch_angle", "")
    icp.raw_profile_json = json.dumps(parsed_data, indent=2)

    db.commit()

    return {
        "product_id": product.id,
        "product_name": product.name,
        "company_id": product.company_id,
        "icp": parsed_data,
        "model_used": result["model"],
        "duration_ms": result["duration_ms"],
        "tokens": result["tokens"],
        "is_deterministic_preview": result.get("is_deterministic_preview", False),
    }
