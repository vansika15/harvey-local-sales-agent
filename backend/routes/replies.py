"""Workflow 8: Conversation reply classification and reply history routes.
"""

import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import ConversationReply
from backend.schemas import (
    ConversationReplyResponse, ReplyClassifyRequest
)
from backend.services.workflows.reply_classifier import classify_conversation_reply

router = APIRouter(prefix="/api/replies", tags=["Reply Classification & Conversation"])


@router.post("/classify")
async def trigger_reply_classification(
    payload: ReplyClassifyRequest,
    db: Session = Depends(get_db)
):
    """Workflow 8: Reply Classification using local AI inference."""
    try:
        return await classify_conversation_reply(
            inbound_message=payload.inbound_message,
            prospect_id=payload.prospect_id,
            product_id=payload.product_id,
            db=db,
            model_override=payload.model_override
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", response_model=List[ConversationReplyResponse])
def list_conversation_replies(
    company_id: Optional[int] = None,
    product_id: Optional[int] = None,
    prospect_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List historical conversation replies and classifications."""
    query = db.query(ConversationReply)
    if company_id is not None:
        query = query.filter(ConversationReply.company_id == company_id)
    if product_id is not None:
        query = query.filter(ConversationReply.product_id == product_id)
    if prospect_id is not None:
        query = query.filter(ConversationReply.prospect_id == prospect_id)

    replies = query.order_by(ConversationReply.created_at.desc()).all()

    res = []
    for r in replies:
        res.append({
            "id": r.id,
            "prospect_id": r.prospect_id,
            "product_id": r.product_id,
            "company_id": r.company_id,
            "inbound_message": r.inbound_message,
            "classification": r.classification,
            "confidence": r.confidence,
            "detected_sentiment": r.detected_sentiment,
            "detected_objections": json.loads(r.detected_objections or "[]"),
            "explanation": r.explanation,
            "suggested_response": r.suggested_response,
            "created_at": r.created_at,
        })
    return res
