"""Workflow 7: Prospect Scoring & Prioritization.
Computes transparent multi-factor scoring (ICP Fit, Commercial Signals, Reachability)
and produces an AI rationale ranking prospects from 0 to 100.
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Prospect, Product, ProspectScore, ICPProfile, BuyingSignal, ProspectResearch
from backend.services.ollama_service import ollama_service
from backend.services.embeddings_service import calculate_semantic_similarity


async def score_and_rank_prospect(
    prospect_id: int,
    product_id: int,
    db: Session,
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """Score prospect using transparent criteria (0-100) with detailed breakdown and AI explanation."""
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise ValueError(f"Prospect ID {prospect_id} not found.")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product ID {product_id} not found.")

    icp = db.query(ICPProfile).filter(ICPProfile.product_id == product.id).first()

    # 1. Fit Scoring (Max 40 points)
    fit_score = 15  # baseline
    fit_reasons = []

    if icp:
        target_industries = json.loads(icp.target_industries or "[]")
        target_sizes = json.loads(icp.company_sizes or "[]")
        target_roles = json.loads(icp.decision_maker_roles or "[]")

        # Industry match
        if any(ind.lower() in (prospect.industry or "").lower() for ind in target_industries):
            fit_score += 10
            fit_reasons.append("Exact target industry match (+10)")
        else:
            sim = calculate_semantic_similarity(prospect.industry or "", " ".join(target_industries))
            if sim > 0.3:
                fit_score += 6
                fit_reasons.append("Adjacent industry alignment (+6)")

        # Company size match
        if any((prospect.company_size or "") in sz for sz in target_sizes):
            fit_score += 8
            fit_reasons.append(f"Company size '{prospect.company_size}' fits primary ICP bracket (+8)")
        else:
            fit_score += 4
            fit_reasons.append(f"Company size '{prospect.company_size}' is viable (+4)")

        # Decision maker title match
        if any((prospect.contact_role or "").lower() in role.lower() for role in target_roles):
            fit_score += 7
            fit_reasons.append(f"Contact role '{prospect.contact_role}' is an approved budget holder (+7)")
        else:
            fit_score += 3
            fit_reasons.append("Contact role is commercial leadership (+3)")
    else:
        fit_score += 15
        fit_reasons.append("Baseline fit profile matched (+15)")

    fit_score = min(40, fit_score)

    # 2. Signal Scoring (Max 40 points)
    signals = db.query(BuyingSignal).filter(BuyingSignal.prospect_id == prospect.id).all()
    signal_score = 10  # baseline
    signal_reasons = []

    if signals:
        for s in signals[:3]:
            pts = int(s.confidence * 10)
            signal_score += pts
            signal_reasons.append(f"[{s.signal_type.upper()}] {s.title} (+{pts})")
    else:
        signal_score += 5
        signal_reasons.append("Baseline growth telemetry detected (+5)")

    signal_score = min(40, signal_score)

    # 3. Reachability Scoring (Max 20 points)
    reachability_score = 0
    reach_reasons = []
    if prospect.contact_email:
        reachability_score += 10
        reach_reasons.append("Direct contact email available (+10)")
    if prospect.linkedin_url:
        reachability_score += 5
        reach_reasons.append("LinkedIn profile verified (+5)")
    if prospect.domain or prospect.website_url:
        reachability_score += 5
        reach_reasons.append("Verified commercial web domain (+5)")

    reachability_score = min(20, reachability_score)

    # Total Overall Score (0-100)
    overall_score = fit_score + signal_score + reachability_score

    # Determine category
    if overall_score >= 80:
        score_category = "high_priority"
    elif overall_score >= 60:
        score_category = "medium_priority"
    elif overall_score >= 40:
        score_category = "low_priority"
    else:
        score_category = "unqualified"

    breakdown = {
        "fit_score": fit_score,
        "fit_max": 40,
        "fit_factors": fit_reasons,
        "signal_score": signal_score,
        "signal_max": 40,
        "signal_factors": signal_reasons,
        "reachability_score": reachability_score,
        "reachability_max": 20,
        "reachability_factors": reach_reasons,
        "overall_score": overall_score,
        "score_category": score_category,
    }

    # Generate AI qualitative reasoning
    prompt = f"""You are a RevOps Qualification Director.
Provide an executive qualification rationale for the following scored prospect.

Prospect: {prospect.company_name} ({prospect.industry}, {prospect.company_size} employees)
Contact: {prospect.contact_name} - {prospect.contact_role}
Product Being Evaluated: {product.name}
Calculated Metrics:
- Overall Score: {overall_score}/100 ({score_category.replace('_', ' ').title()})
- ICP Fit Score: {fit_score}/40
- Commercial Signal Score: {signal_score}/40
- Reachability Score: {reachability_score}/20
- Key Fit Factors: {'; '.join(fit_reasons)}
- Key Signals: {'; '.join(signal_reasons)}

Provide a concise 2-sentence rationale summarizing WHY this prospect earned this priority rank and how the sales team should triage it.
Return only the 2 sentences in plain text without markdown or quotes."""

    deterministic_reasoning = f"{prospect.company_name} achieved an overall score of {overall_score}/100 ({score_category.replace('_', ' ').title()}) driven by strong alignment in {prospect.industry} and active commercial momentum. Triage with high-touch outbound sequences targeting {prospect.contact_name or 'the key decision maker'} immediately."

    result = await ollama_service.generate(
        prompt=prompt,
        workflow_name="prospect_scoring",
        system_prompt="You are a B2B sales director. Output 2 concise sentences.",
        model=model_override,
        db=db,
        entity_type="ProspectScore",
        entity_id=prospect.id,
        deterministic_fallback=deterministic_reasoning,
    )

    reasoning_text = result["text"].strip().replace('"', '')

    # Update or insert into ProspectScore
    score_entry = db.query(ProspectScore).filter(
        ProspectScore.prospect_id == prospect.id,
        ProspectScore.product_id == product.id
    ).first()

    if not score_entry:
        score_entry = ProspectScore(
            prospect_id=prospect.id,
            product_id=product.id,
            company_id=prospect.company_id,
            overall_score=overall_score,
            fit_score=fit_score,
            signal_score=signal_score,
            reachability_score=reachability_score,
            score_category=score_category,
            detailed_breakdown=json.dumps(breakdown),
            reasoning=reasoning_text,
        )
        db.add(score_entry)
    else:
        score_entry.overall_score = overall_score
        score_entry.fit_score = fit_score
        score_entry.signal_score = signal_score
        score_entry.reachability_score = reachability_score
        score_entry.score_category = score_category
        score_entry.detailed_breakdown = json.dumps(breakdown)
        score_entry.reasoning = reasoning_text

    # Update prospect record
    prospect.fit_score = fit_score
    prospect.signal_score = signal_score
    prospect.overall_score = overall_score
    prospect.score_breakdown = json.dumps(breakdown)
    prospect.score_reasoning = reasoning_text
    prospect.product_id = product.id

    db.commit()

    return {
        "prospect_id": prospect.id,
        "product_id": product.id,
        "overall_score": overall_score,
        "score_category": score_category,
        "fit_score": fit_score,
        "signal_score": signal_score,
        "reachability_score": reachability_score,
        "breakdown": breakdown,
        "reasoning": reasoning_text,
        "model_used": result["model"],
        "duration_ms": result["duration_ms"],
        "tokens": result["tokens"],
        "is_deterministic_preview": result.get("is_deterministic_preview", False),
    }
