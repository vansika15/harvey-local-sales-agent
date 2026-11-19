"""Workflow 5: Problem Statement Generation.
Synthesizes prospect-specific business problems and establishes clear causality
linking pain points to the selected product's value proposition using local AI.
"""

import json
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.models import Prospect, Product, ProblemStatement, BuyingSignal
from backend.services.ollama_service import ollama_service


async def generate_problem_statements(
    prospect_id: int,
    product_id: int,
    db: Session,
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """Generate contextual business problem statements connecting prospect situation to product."""
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise ValueError(f"Prospect ID {prospect_id} not found.")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product ID {product_id} not found.")

    # Retrieve existing signals
    signals = db.query(BuyingSignal).filter(BuyingSignal.prospect_id == prospect.id).all()
    signals_summary = "\n".join([f"- [{s.signal_type.upper()}] {s.title}: {s.sales_implication}" for s in signals])

    prompt = f"""You are a Strategic B2B Solution Architect.
Analyze the following prospect profile and connect their operational reality to the specific software product being offered.

Prospect Profile:
- Company Name: {prospect.company_name}
- Industry: {prospect.industry}
- Size: {prospect.company_size}
- Contact: {prospect.contact_name} ({prospect.contact_role})
- Detected Commercial Signals:
{signals_summary or 'Standard commercial scaling signals'}

Solution Being Offered:
- Product Name: {product.name}
- Product Category: {product.category}
- Product Description: {product.description}
- Value Proposition: {product.value_proposition}
- Pain Points Solved: {product.pain_points_solved}

Generate 2 to 3 acute, realistic problem statements that {prospect.company_name} is facing today, explaining how {product.name} specifically solves them.

Return a JSON array of objects with keys:
- "problem_title": Crisp summary of the acute business problem
- "problem_description": 2-sentence diagnostic describing the bottleneck or inefficiency
- "connection_to_product": Explicit explanation of which feature/capability in {product.name} fixes this problem
- "severity": "high", "medium", or "low"
- "reasoning": The analytical logic connecting the prospect's industry/size/role to this pain point
- "suggested_solution_pitch": A concise, consultative talk-track sentence for the sales rep

Return ONLY valid JSON array."""

    deterministic_problems = [
        {
            "problem_title": f"Manual Workflow Bottlenecks Throttling {prospect.company_name}'s Growth",
            "problem_description": f"With {prospect.company_size} employees in {prospect.industry}, teams spend excessive hours manually coordinating disconnected processes, creating delays and high operational overhead.",
            "connection_to_product": f"{product.name}'s automated execution pipeline eliminates repetitive operational tasks, cutting cycle times by over 60%.",
            "severity": "high",
            "reasoning": f"Mid-market organizations in {prospect.industry} rapidly outgrow manual spreadsheets and legacy ad-hoc tooling during expansion phases.",
            "suggested_solution_pitch": f"We help companies like {prospect.company_name} replace hours of manual data wrangling with {product.name}'s streamlined workflow engine."
        },
        {
            "problem_title": f"Siloed Revenue & Account Intelligence for {prospect.contact_role or 'Leadership'}",
            "problem_description": f"Leadership lacks unified, real-time visibility into account signals and team bottlenecks, resulting in delayed commercial decisions and missed opportunities.",
            "connection_to_product": f"{product.name} provides centralized, auditable tracking and instant signal intelligence directly to {prospect.contact_role or 'decision makers'}.",
            "severity": "medium",
            "reasoning": f"Without automated signal detection, sales and operations teams fail to engage accounts at their highest-propensity buying moments.",
            "suggested_solution_pitch": f"Give {prospect.contact_name or 'your team'} real-time clarity into high-priority pipeline signals before your competitors spot them."
        }
    ]

    result = await ollama_service.generate(
        prompt=prompt,
        workflow_name="problem_statement_generation",
        system_prompt="You are a B2B sales solution architect. Return strict JSON array.",
        model=model_override,
        db=db,
        entity_type="ProblemStatement",
        entity_id=prospect.id,
        deterministic_fallback=json.dumps(deterministic_problems, indent=2),
    )

    try:
        cleaned = result["text"]
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        elif "```" in cleaned:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()
        problems_list = json.loads(cleaned)
        if not isinstance(problems_list, list):
            problems_list = deterministic_problems
    except Exception:
        problems_list = deterministic_problems

    # Delete existing problem statements for this prospect & product combo and save fresh ones
    db.query(ProblemStatement).filter(
        ProblemStatement.prospect_id == prospect.id,
        ProblemStatement.product_id == product.id
    ).delete()

    saved_problems: List[Dict[str, Any]] = []
    for p in problems_list:
        new_prob = ProblemStatement(
            prospect_id=prospect.id,
            product_id=product.id,
            company_id=prospect.company_id,
            problem_title=p.get("problem_title", "Operational Inefficiency"),
            problem_description=p.get("problem_description", ""),
            connection_to_product=p.get("connection_to_product", ""),
            severity=p.get("severity", "medium"),
            reasoning=p.get("reasoning", ""),
            suggested_solution_pitch=p.get("suggested_solution_pitch", ""),
        )
        db.add(new_prob)
        saved_problems.append({
            "problem_title": new_prob.problem_title,
            "problem_description": new_prob.problem_description,
            "connection_to_product": new_prob.connection_to_product,
            "severity": new_prob.severity,
            "reasoning": new_prob.reasoning,
            "suggested_solution_pitch": new_prob.suggested_solution_pitch,
        })

    db.commit()

    return {
        "prospect_id": prospect.id,
        "product_id": product.id,
        "problems_count": len(saved_problems),
        "problems": saved_problems,
        "model_used": result["model"],
        "duration_ms": result["duration_ms"],
        "tokens": result["tokens"],
        "is_deterministic_preview": result.get("is_deterministic_preview", False),
    }
