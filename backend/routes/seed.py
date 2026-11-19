"""Seed endpoints for loading realistic demonstration data.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.sample_data import seed_sample_database

router = APIRouter(prefix="/api/seed", tags=["Demonstration Seed Data"])


@router.post("/load-sample-data")
def load_sample_data(force_reset: bool = False, db: Session = Depends(get_db)):
    """Seed or re-seed realistic sample companies, products, and prospects."""
    return seed_sample_database(db=db, force_reset=force_reset)
