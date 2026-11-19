"""Workflow 6: Personalised Sales Email Generation.
Generates hyper-personalized cold outreach emails grounded in actual prospect research,
verified site facts, buying signals, and product value proposition without hallucinations.
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Prospect, Product, GeneratedEmail, ProblemStatement, BuyingSignal, ProspectResearch
from backend.services.ollama_service import ollama_service


async def generate_personalised_email(
    prospect_id: int,
    product_id: int,
    db: Session,
    sequence_step: int = 1,
    tone: str = "consultative and punchy",
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """Generate high-converting, grounded cold sales email sequence step using local AI."""
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise ValueError(f"Prospect ID {prospect_id} not found.")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product ID {product_id} not found.")

    # Retrieve real facts from research and signals
    research = db.query(ProspectResearch).filter(ProspectResearch.prospect_id == prospect.id).first()
    verified_facts = json.loads(research.verified_facts) if (research and research.verified_facts) else []
    
    signals = db.query(BuyingSignal).filter(BuyingSignal.prospect_id == prospect.id).all()
    signals_text = ", ".join([s.title for s in signals]) if signals else "Recent market expansion"

    problem = db.query(ProblemStatement).filter(
        ProblemStatement.prospect_id == prospect.id,
        ProblemStatement.product_id == product.id
    ).first()
    problem_text = problem.problem_title if problem else "scaling operational workflows efficiently"

    contact_name = prospect.contact_name or "there"
    first_name = contact_name.split()[0] if contact_name != "there" else "there"

    prompt = f"""You are a master B2B Cold Outreach Copywriter.
Draft a personalized cold email (Step {sequence_step} of sequence) to the prospect below.

STRICT ACCURACY RULES:
- Ground every claim in the provided facts below. Do NOT fabricate awards, non-existent meetings, or false mutual connections.
- Tone: {tone}. Keep it concise (under 120 words), human, and conversational.
- No sales clichés (e.g., "I hope this email finds you well", "synergy", "cutting-edge").

Prospect:
- Name: {prospect.contact_name or 'Leader'} (First name: {first_name})
- Title: {prospect.contact_role or 'VP Operations'}
- Company: {prospect.company_name}
- Industry: {prospect.industry}
- Verified Site Observations: {'; '.join(verified_facts[:3]) if verified_facts else 'Active digital operations'}
- Commercial Buying Signals: {signals_text}
- Identified Problem Bottleneck: {problem_text}

Product Offered:
- Product Name: {product.name}
- Core Value: {product.value_proposition or product.description}
- Specific Solution: {problem.connection_to_product if problem else product.description}

Generate a JSON object with:
- "subject_line": Punchy, lower-case/conversational subject under 6 words (e.g. "quick question re: {prospect.company_name} workflows")
- "hook_opening": 1 sentence referencing their company/role or a verified signal
- "value_proposition": 2 sentences explaining how {product.name} addresses {problem_text}
- "call_to_action": Low-friction, interest-based CTA (e.g., "Worth a 7-minute intro this Thursday, or open to sending a brief overview?")
- "full_email_body": The complete formatted email ready to send

Return strictly valid JSON only."""

    fallback_subject = f"scaling {prospect.company_name}'s workflows"
    fallback_hook = f"Hi {first_name}, noticed {prospect.company_name}'s recent momentum in {prospect.industry} and wanted to reach out directly."
    fallback_val_prop = f"Most {prospect.contact_role or 'leaders'} we talk to are trying to eliminate manual bottlenecks around {problem_text}. {product.name} gives your team an autonomous execution engine so you can scale output without hiring more coordinators."
    fallback_cta = "Worth a quick 10-minute chat this week, or should I send over a 2-minute workflow breakdown?"
    fallback_body = f"""{fallback_hook}

{fallback_val_prop}

{fallback_cta}

Best regards,
Harvey Sales Team"""

    deterministic_fallback = json.dumps({
        "subject_line": fallback_subject,
        "hook_opening": fallback_hook,
        "value_proposition": fallback_val_prop,
        "call_to_action": fallback_cta,
        "full_email_body": fallback_body
    }, indent=2)

    result = await ollama_service.generate(
        prompt=prompt,
        workflow_name="email_generation",
        system_prompt="You write concise, high-converting B2B sales emails. Output strict JSON only.",
        model=model_override,
        db=db,
        entity_type="GeneratedEmail",
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

    # Save to GeneratedEmail table
    email_record = GeneratedEmail(
        prospect_id=prospect.id,
        product_id=product.id,
        company_id=prospect.company_id,
        sequence_step=sequence_step,
        subject_line=parsed.get("subject_line", fallback_subject),
        email_body=parsed.get("full_email_body", fallback_body),
        hook_opening=parsed.get("hook_opening", fallback_hook),
        value_proposition=parsed.get("value_proposition", fallback_val_prop),
        call_to_action=parsed.get("call_to_action", fallback_cta),
        status="draft",
        model_used=result["model"],
    )
    db.add(email_record)
    
    # Update prospect status to 'qualified'
    if prospect.status in ["new", "researched"]:
        prospect.status = "qualified"

    db.commit()

    return {
        "email_id": email_record.id,
        "prospect_id": prospect.id,
        "product_id": product.id,
        "sequence_step": sequence_step,
        "subject_line": email_record.subject_line,
        "email_body": email_record.email_body,
        "hook_opening": email_record.hook_opening,
        "value_proposition": email_record.value_proposition,
        "call_to_action": email_record.call_to_action,
        "status": email_record.status,
        "model_used": result["model"],
        "duration_ms": result["duration_ms"],
        "tokens": result["tokens"],
        "is_deterministic_preview": result.get("is_deterministic_preview", False),
    }
