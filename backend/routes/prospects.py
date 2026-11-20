"""Prospect management routes and core sales intelligence workflows (Workflows 3, 4, 5, 6, 7).
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import (
    Prospect, ProspectResearch, BuyingSignal, ProblemStatement,
    GeneratedEmail, ProspectScore
)
from backend.schemas import (
    ProspectCreate, ProspectUpdate, ProspectResponse, ResearchRequest,
    ProspectResearchResponse, BuyingSignalResponse, SignalClassifyRequest,
    ProblemStatementResponse, ProblemGenerateRequest,
    GeneratedEmailResponse, EmailGenerateRequest,
    ProspectScoreResponse, ScoreCalculateRequest
)
from backend.services.research_service import research_service
from backend.services.workflows.prospect_research import research_prospect_account
from backend.services.workflows.buying_signals import classify_buying_signals
from backend.services.workflows.problem_statements import generate_problem_statements
from backend.services.workflows.email_generator import generate_personalised_email
from backend.services.workflows.prospect_scorer import score_and_rank_prospect

router = APIRouter(prefix="/api/prospects", tags=["Prospects & Intelligence Workflows"])


@router.get("", response_model=List[ProspectResponse])
def list_prospects(
    company_id: Optional[int] = None,
    product_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """List prospects with optional company, product, status, and search filters."""
    query = db.query(Prospect)
    if company_id is not None:
        query = query.filter(Prospect.company_id == company_id)
    if product_id is not None:
        query = query.filter(Prospect.product_id == product_id)
    if status_filter:
        query = query.filter(Prospect.status == status_filter)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Prospect.company_name.ilike(s)) |
            (Prospect.contact_name.ilike(s)) |
            (Prospect.domain.ilike(s))
        )

    prospects = query.order_by(Prospect.overall_score.desc(), Prospect.created_at.desc()).all()

    res = []
    for p in prospects:
        res.append({
            "id": p.id,
            "company_id": p.company_id,
            "product_id": p.product_id,
            "company_name": p.company_name,
            "domain": p.domain,
            "industry": p.industry,
            "company_size": p.company_size,
            "location": p.location,
            "contact_name": p.contact_name,
            "contact_role": p.contact_role,
            "contact_email": p.contact_email,
            "contact_phone": p.contact_phone,
            "linkedin_url": p.linkedin_url,
            "website_url": p.website_url,
            "fit_score": p.fit_score or 0,
            "signal_score": p.signal_score or 0,
            "overall_score": p.overall_score or 0,
            "score_breakdown": json.loads(p.score_breakdown or "{}"),
            "score_reasoning": p.score_reasoning,
            "status": p.status,
            "source": p.source,
            "is_sample": p.is_sample,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        })
    return res


@router.post("", response_model=ProspectResponse, status_code=status.HTTP_201_CREATED)
def create_prospect(payload: ProspectCreate, db: Session = Depends(get_db)):
    """Create a new prospect manually."""
    prospect = Prospect(**payload.dict())
    db.add(prospect)
    db.commit()
    db.refresh(prospect)

    return {
        **prospect.__dict__,
        "score_breakdown": json.loads(prospect.score_breakdown or "{}"),
    }


@router.get("/{prospect_id}", response_model=ProspectResponse)
def get_prospect(prospect_id: int, db: Session = Depends(get_db)):
    """Get prospect details."""
    p = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prospect not found")

    return {
        "id": p.id,
        "company_id": p.company_id,
        "product_id": p.product_id,
        "company_name": p.company_name,
        "domain": p.domain,
        "industry": p.industry,
        "company_size": p.company_size,
        "location": p.location,
        "contact_name": p.contact_name,
        "contact_role": p.contact_role,
        "contact_email": p.contact_email,
        "contact_phone": p.contact_phone,
        "linkedin_url": p.linkedin_url,
        "website_url": p.website_url,
        "fit_score": p.fit_score or 0,
        "signal_score": p.signal_score or 0,
        "overall_score": p.overall_score or 0,
        "score_breakdown": json.loads(p.score_breakdown or "{}"),
        "score_reasoning": p.score_reasoning,
        "status": p.status,
        "source": p.source,
        "is_sample": p.is_sample,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


@router.put("/{prospect_id}", response_model=ProspectResponse)
def update_prospect(prospect_id: int, payload: ProspectUpdate, db: Session = Depends(get_db)):
    """Update prospect details."""
    p = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prospect not found")

    data = payload.model_dump(exclude_unset=True)
    for key, val in data.items():
        if hasattr(p, key) and val is not None:
            setattr(p, key, val)
    db.commit()
    db.refresh(p)
    return {
        "id": p.id,
        "company_id": p.company_id,
        "product_id": p.product_id,
        "company_name": p.company_name,
        "domain": p.domain,
        "industry": p.industry,
        "company_size": p.company_size,
        "location": p.location,
        "contact_name": p.contact_name,
        "contact_role": p.contact_role,
        "contact_email": p.contact_email,
        "contact_phone": p.contact_phone,
        "linkedin_url": p.linkedin_url,
        "website_url": p.website_url,
        "fit_score": p.fit_score or 0,
        "signal_score": p.signal_score or 0,
        "overall_score": p.overall_score or 0,
        "score_breakdown": json.loads(p.score_breakdown or "{}"),
        "score_reasoning": p.score_reasoning,
        "status": p.status,
        "source": p.source,
        "is_sample": p.is_sample,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


@router.delete("/{prospect_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prospect(prospect_id: int, db: Session = Depends(get_db)):
    """Delete prospect."""
    p = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prospect not found")
    db.delete(p)
    db.commit()
    return None


@router.post("/import-csv")
async def import_prospects_csv(
    company_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import prospects from CSV file with deduplication and validation."""
    content = await file.read()
    result = research_service.parse_prospects_csv(content, company_id=company_id, db=db)
    return result


# -----------------------------------------------------------------------------
# Workflow 3: Prospect Research
# -----------------------------------------------------------------------------
@router.post("/{prospect_id}/research")
async def trigger_prospect_research(
    prospect_id: int,
    payload: ResearchRequest,
    db: Session = Depends(get_db)
):
    """Workflow 3: Prospect Research and Intelligence Synthesis."""
    try:
        return await research_prospect_account(
            prospect_id=prospect_id,
            db=db,
            force_live_scrape=payload.force_live_scrape,
            model_override=payload.model_override
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{prospect_id}/research", response_model=Optional[ProspectResearchResponse])
def get_prospect_research(prospect_id: int, db: Session = Depends(get_db)):
    """Retrieve saved research dossier for a prospect."""
    r = db.query(ProspectResearch).filter(ProspectResearch.prospect_id == prospect_id).first()
    if not r:
        return None

    return {
        "id": r.id,
        "prospect_id": r.prospect_id,
        "company_id": r.company_id,
        "site_summary": r.site_summary,
        "detected_tech_stack": json.loads(r.detected_tech_stack or "[]"),
        "hiring_notes": json.loads(r.hiring_notes or "[]"),
        "key_initiatives": json.loads(r.key_initiatives or "[]"),
        "site_facts": json.loads(r.site_facts or "{}"),
        "verified_facts": json.loads(r.verified_facts or "[]"),
        "unavailable_facts": json.loads(r.unavailable_facts or "[]"),
        "source_urls": json.loads(r.source_urls or "[]"),
        "research_timestamp": r.research_timestamp,
        "offline_cached": r.offline_cached,
    }


# -----------------------------------------------------------------------------
# Workflow 4: Buying-Signal Classification
# -----------------------------------------------------------------------------
@router.post("/{prospect_id}/classify-signals")
async def trigger_buying_signal_classification(
    prospect_id: int,
    payload: SignalClassifyRequest,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Workflow 4: Buying-Signal Classification using local AI."""
    try:
        return await classify_buying_signals(
            prospect_id=prospect_id,
            product_id=product_id,
            db=db,
            model_override=payload.model_override
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{prospect_id}/signals", response_model=List[BuyingSignalResponse])
def get_prospect_signals(prospect_id: int, db: Session = Depends(get_db)):
    """List buying signals detected for prospect."""
    return db.query(BuyingSignal).filter(BuyingSignal.prospect_id == prospect_id).all()


# -----------------------------------------------------------------------------
# Workflow 5: Problem Statement Generation
# -----------------------------------------------------------------------------
@router.post("/{prospect_id}/generate-problems")
async def trigger_problem_statement_generation(
    prospect_id: int,
    payload: ProblemGenerateRequest,
    db: Session = Depends(get_db)
):
    """Workflow 5: Problem Statement Generation using local AI."""
    try:
        return await generate_problem_statements(
            prospect_id=prospect_id,
            product_id=payload.product_id,
            db=db,
            model_override=payload.model_override
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{prospect_id}/problems", response_model=List[ProblemStatementResponse])
def get_prospect_problems(prospect_id: int, db: Session = Depends(get_db)):
    """List problem statements generated for prospect."""
    return db.query(ProblemStatement).filter(ProblemStatement.prospect_id == prospect_id).all()


# -----------------------------------------------------------------------------
# Workflow 6: Personalised Email Generation
# -----------------------------------------------------------------------------
@router.post("/{prospect_id}/generate-email")
async def trigger_email_generation(
    prospect_id: int,
    payload: EmailGenerateRequest,
    db: Session = Depends(get_db)
):
    """Workflow 6: Personalised Sales Email Generation using local AI."""
    try:
        return await generate_personalised_email(
            prospect_id=prospect_id,
            product_id=payload.product_id,
            db=db,
            sequence_step=payload.sequence_step,
            tone=payload.tone or "consultative and punchy",
            model_override=payload.model_override
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{prospect_id}/emails", response_model=List[GeneratedEmailResponse])
def get_prospect_emails(prospect_id: int, db: Session = Depends(get_db)):
    """List generated emails for prospect."""
    return db.query(GeneratedEmail).filter(GeneratedEmail.prospect_id == prospect_id).order_by(GeneratedEmail.sequence_step).all()


# -----------------------------------------------------------------------------
# Workflow 7: Prospect Scoring & Prioritisation
# -----------------------------------------------------------------------------
@router.post("/{prospect_id}/score")
async def trigger_prospect_scoring(
    prospect_id: int,
    payload: ScoreCalculateRequest,
    db: Session = Depends(get_db)
):
    """Workflow 7: Prospect Scoring and Prioritisation."""
    try:
        return await score_and_rank_prospect(
            prospect_id=prospect_id,
            product_id=payload.product_id,
            db=db,
            model_override=payload.model_override
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
