"""Company management routes and Business Profile Generation workflow.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Company
from backend.schemas import (
    CompanyCreate, CompanyUpdate, CompanyResponse,
    BusinessProfileGenerateRequest
)
from backend.services.workflows.business_profile import generate_business_profile

router = APIRouter(prefix="/api/companies", tags=["Companies"])


@router.get("", response_model=List[CompanyResponse])
def list_companies(db: Session = Depends(get_db)):
    """List all registered business profiles."""
    return db.query(Company).order_by(Company.created_at.desc()).all()


@router.post("", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(payload: CompanyCreate, db: Session = Depends(get_db)):
    """Register a new business organization."""
    company = Company(**payload.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    """Get single company details."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(company_id: int, payload: CompanyUpdate, db: Session = Depends(get_db)):
    """Update company profile."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for k, v in payload.dict(exclude_unset=True).items():
        setattr(company, k, v)

    db.commit()
    db.refresh(company)
    return company


@router.delete("/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(company_id: int, db: Session = Depends(get_db)):
    """Delete company and cascade to all its products and prospects."""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    db.delete(company)
    db.commit()
    return None


@router.post("/{company_id}/generate-profile")
async def trigger_business_profile_generation(
    company_id: int,
    payload: BusinessProfileGenerateRequest,
    db: Session = Depends(get_db)
):
    """Workflow 1: Business Profile Generation using local AI inference."""
    try:
        result = await generate_business_profile(
            company_id=company_id,
            db=db,
            business_notes=payload.business_notes,
            model_override=payload.model_override
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
