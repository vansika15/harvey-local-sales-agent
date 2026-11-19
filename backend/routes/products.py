"""Product management routes and Product-Specific ICP Generation workflow.
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import Product, ICPProfile, Company
from backend.schemas import (
    ProductCreate, ProductUpdate, ProductResponse,
    ICPProfileResponse, ICPGenerateRequest
)
from backend.services.workflows.icp_generator import generate_product_icp

router = APIRouter(prefix="/api/products", tags=["Products & ICP"])


@router.get("", response_model=List[ProductResponse])
def list_products(
    company_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List products, optionally filtered by company."""
    query = db.query(Product)
    if company_id is not None:
        query = query.filter(Product.company_id == company_id)
    products = query.order_by(Product.created_at.desc()).all()

    # Convert JSON strings to lists for response
    res = []
    for p in products:
        p_dict = {
            "id": p.id,
            "company_id": p.company_id,
            "name": p.name,
            "slug": p.slug,
            "category": p.category,
            "description": p.description,
            "target_customer_summary": p.target_customer_summary,
            "value_proposition": p.value_proposition,
            "pain_points_solved": json.loads(p.pain_points_solved or "[]"),
            "pricing_model": p.pricing_model,
            "features": json.loads(p.features or "[]"),
            "sales_context": p.sales_context,
            "is_sample": p.is_sample,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        res.append(p_dict)
    return res


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    """Add a new product under a company."""
    company = db.query(Company).filter(Company.id == payload.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Parent company not found")

    prod_data = payload.dict()
    prod_data["pain_points_solved"] = json.dumps(payload.pain_points_solved or [])
    prod_data["features"] = json.dumps(payload.features or [])

    product = Product(**prod_data)
    db.add(product)
    db.commit()
    db.refresh(product)

    return {
        **product.__dict__,
        "pain_points_solved": json.loads(product.pain_points_solved or "[]"),
        "features": json.loads(product.features or "[]"),
    }


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Get single product details."""
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")

    return {
        "id": p.id,
        "company_id": p.company_id,
        "name": p.name,
        "slug": p.slug,
        "category": p.category,
        "description": p.description,
        "target_customer_summary": p.target_customer_summary,
        "value_proposition": p.value_proposition,
        "pain_points_solved": json.loads(p.pain_points_solved or "[]"),
        "pricing_model": p.pricing_model,
        "features": json.loads(p.features or "[]"),
        "sales_context": p.sales_context,
        "is_sample": p.is_sample,
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    """Update product information."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for k, v in payload.dict(exclude_unset=True).items():
        if k in ["pain_points_solved", "features"] and v is not None:
            setattr(product, k, json.dumps(v))
        else:
            setattr(product, k, v)

    db.commit()
    db.refresh(product)

    return {
        "id": product.id,
        "company_id": product.company_id,
        "name": product.name,
        "slug": product.slug,
        "category": product.category,
        "description": product.description,
        "target_customer_summary": product.target_customer_summary,
        "value_proposition": product.value_proposition,
        "pain_points_solved": json.loads(product.pain_points_solved or "[]"),
        "pricing_model": product.pricing_model,
        "features": json.loads(product.features or "[]"),
        "sales_context": product.sales_context,
        "is_sample": product.is_sample,
        "created_at": product.created_at,
        "updated_at": product.updated_at,
    }


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Delete product."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return None


@router.post("/{product_id}/generate-icp")
async def trigger_icp_generation(
    product_id: int,
    payload: ICPGenerateRequest,
    db: Session = Depends(get_db)
):
    """Workflow 2: Product-Specific ICP Generation using local AI inference."""
    try:
        return await generate_product_icp(
            product_id=product_id,
            db=db,
            additional_guidelines=payload.additional_guidelines,
            model_override=payload.model_override
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}/icp", response_model=Optional[ICPProfileResponse])
def get_product_icp(product_id: int, db: Session = Depends(get_db)):
    """Retrieve saved ICP profile for a product."""
    icp = db.query(ICPProfile).filter(ICPProfile.product_id == product_id).first()
    if not icp:
        return None

    return {
        "id": icp.id,
        "product_id": icp.product_id,
        "company_id": icp.company_id,
        "target_industries": json.loads(icp.target_industries or "[]"),
        "company_sizes": json.loads(icp.company_sizes or "[]"),
        "decision_maker_roles": json.loads(icp.decision_maker_roles or "[]"),
        "target_geographies": json.loads(icp.target_geographies or "[]"),
        "core_pain_points": json.loads(icp.core_pain_points or "[]"),
        "buying_triggers": json.loads(icp.buying_triggers or "[]"),
        "disqualifiers": json.loads(icp.disqualifiers or "[]"),
        "pitch_angle": icp.pitch_angle,
        "is_sample": icp.is_sample,
        "created_at": icp.created_at,
        "updated_at": icp.updated_at,
    }
