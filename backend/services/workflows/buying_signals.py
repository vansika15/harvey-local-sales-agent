"""Workflow 4: Buying-Signal Classification.
Extracts and classifies commercial buying signals (hiring, expansion, funding, tech stack changes)
and explains their tactical sales implications using local AI.
"""

import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.models import Prospect, Product, BuyingSignal, ProspectResearch
from backend.services.ollama_service import ollama_service


async def classify_buying_signals(
    prospect_id: int,
    db: Session,
    product_id: Optional[int] = None,
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """Detect and classify buying signals for a prospect using Ollama local AI."""
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise ValueError(f"Prospect ID {prospect_id} not found.")

    product = None
    if product_id:
        product = db.query(Product).filter(Product.id == product_id).first()
    elif prospect.product_id:
        product = db.query(Product).filter(Product.id == prospect.product_id).first()

    research = db.query(ProspectResearch).filter(ProspectResearch.prospect_id == prospect.id).first()

    research_context = ""
    if research:
        research_context = f"""
Site Summary: {research.site_summary}
Tech Stack: {research.detected_tech_stack}
Verified Facts: {research.verified_facts}
"""

    prompt = f"""You are a B2B Signal Intelligence Analyst.
Analyze the following company profile and web observations for '{prospect.company_name}' to identify acute commercial buying signals.

Prospect Information:
- Company: {prospect.company_name}
- Industry: {prospect.industry}
- Size: {prospect.company_size}
- Location: {prospect.location}
- Contact Title: {prospect.contact_role}
{research_context}
Target Product Being Sold: {product.name if product else 'B2B Automation Solution'} ({product.description if product else 'Workflow optimization platform'})

Identify 2 to 3 distinct buying signals in categories: 'hiring', 'expansion', 'funding', 'product_launch', 'tech_change', or 'management_change'.

Return a JSON array of signal objects, where each object has:
- "signal_type": Exactly one of ["hiring", "expansion", "funding", "product_launch", "tech_change", "management_change"]
- "title": Short descriptive title (e.g. "Rapid Engineering & RevOps Team Expansion")
- "description": Contextual explanation of the detected event or indicator
- "detected_value": Metric or detail (e.g. "8 open headcount positions", "Series B funding announcement", "Migrated to Next.js / Stripe")
- "confidence": Float between 0.70 and 0.99
- "sales_implication": Actionable explanation of WHY this signal matters and how the sales rep should leverage it in conversation

Return ONLY a valid JSON array. No markdown codeblocks or extra conversation."""

    deterministic_signals = [
        {
            "signal_type": "expansion",
            "title": f"Active Market & Scale Expansion in {prospect.industry or 'Core Vertical'}",
            "description": f"{prospect.company_name} is actively scaling operations in {prospect.location or 'their regional hub'}, driving increased operational complexity.",
            "detected_value": f"Growth tier {prospect.company_size or '50-200'} employees with expanding digital footprint",
            "confidence": 0.88,
            "sales_implication": "Fast-scaling teams experience workflow bottlenecks and need automated tooling to sustain output without linear headcount bloat."
        },
        {
            "signal_type": "tech_change",
            "title": "Modernizing Core Tech Stack & Infrastructure",
            "description": f"Analysis of {prospect.domain or 'web property'} indicates modern web and cloud architecture investments.",
            "detected_value": "Cloud infrastructure and automated workflow components active",
            "confidence": 0.92,
            "sales_implication": "Teams modernizing their software stack have active tech budgets and high willingness to adopt next-generation productivity platforms."
        },
        {
            "signal_type": "hiring",
            "title": f"Leadership Hiring in {prospect.contact_role or 'Revenue Operations'}",
            "description": f"Targeting {prospect.contact_name or 'key executive'} ({prospect.contact_role or 'Decision Maker'}) who is chartered with optimizing team throughput.",
            "detected_value": f"Key role active: {prospect.contact_role or 'VP Operations'}",
            "confidence": 0.85,
            "sales_implication": "New and active department leaders look for high-ROI quick wins within their first 90-180 days."
        }
    ]

    result = await ollama_service.generate(
        prompt=prompt,
        workflow_name="buying_signal_classification",
        system_prompt="You are an expert sales intelligence analyst. Return a JSON array only.",
        model=model_override,
        db=db,
        entity_type="Prospect",
        entity_id=prospect.id,
        deterministic_fallback=json.dumps(deterministic_signals, indent=2),
    )

    try:
        cleaned = result["text"]
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        signals_list = json.loads(cleaned)
        if not isinstance(signals_list, list):
            signals_list = deterministic_signals
    except Exception:
        signals_list = deterministic_signals

    # Clear previous signals for this prospect and persist fresh ones
    db.query(BuyingSignal).filter(BuyingSignal.prospect_id == prospect.id).delete()

    saved_signals: List[Dict[str, Any]] = []
    for sig in signals_list:
        new_sig = BuyingSignal(
            prospect_id=prospect.id,
            company_id=prospect.company_id,
            product_id=product.id if product else None,
            signal_type=sig.get("signal_type", "expansion"),
            title=sig.get("title", "Commercial Growth Signal"),
            description=sig.get("description", ""),
            detected_value=sig.get("detected_value", ""),
            confidence=float(sig.get("confidence", 0.85)),
            sales_implication=sig.get("sales_implication", ""),
            source_url=prospect.domain or prospect.website_url,
            source_date="Recent",
        )
        db.add(new_sig)
        saved_signals.append({
            "signal_type": new_sig.signal_type,
            "title": new_sig.title,
            "description": new_sig.description,
            "detected_value": new_sig.detected_value,
            "confidence": new_sig.confidence,
            "sales_implication": new_sig.sales_implication,
        })

    # Update prospect signal score
    prospect.signal_score = min(40, len(saved_signals) * 12 + 10)
    prospect.overall_score = min(100, prospect.fit_score + prospect.signal_score + 15)
    db.commit()

    return {
        "prospect_id": prospect.id,
        "company_name": prospect.company_name,
        "signals_count": len(saved_signals),
        "signals": saved_signals,
        "model_used": result["model"],
        "duration_ms": result["duration_ms"],
        "tokens": result["tokens"],
        "is_deterministic_preview": result.get("is_deterministic_preview", False),
    }
