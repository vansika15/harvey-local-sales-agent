"""Workflow 8: Conversation and Reply Classification.
Classifies inbound prospect email responses into actionable sales categories:
interested, not_interested, objection, follow_up_required, meeting_requested.
Extracts objections, sentiment, and drafts recommended sales responses using local AI.
"""

import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from backend.models import Prospect, Product, ConversationReply
from backend.services.ollama_service import ollama_service


async def classify_conversation_reply(
    inbound_message: str,
    prospect_id: int,
    product_id: int,
    db: Session,
    model_override: Optional[str] = None
) -> Dict[str, Any]:
    """Classify prospect email reply, explain classification, and suggest response using local AI."""
    prospect = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not prospect:
        raise ValueError(f"Prospect ID {prospect_id} not found.")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise ValueError(f"Product ID {product_id} not found.")

    prompt = f"""You are an expert Sales Triage Specialist and Conversation AI.
Analyze the following inbound email message received from a prospect and classify it accurately.

Prospect Context:
- Prospect: {prospect.contact_name} ({prospect.contact_role}) at {prospect.company_name}
- Product Offered: {product.name} ({product.description})

Inbound Email Message Received:
\"\"\"{inbound_message}\"\"\"

Classification Categories (choose EXACTLY ONE):
- "meeting_requested": Prospect explicitly asks to book time, invites a demo, or shares calendar links.
- "interested": Prospect expresses curiosity, requests pricing, asks questions, or asks for more info.
- "objection": Prospect mentions timing, budget, competing tool, lack of need, or security concerns.
- "follow_up_required": Prospect asks to reconnect next quarter, loop in a colleague, or out-of-office message.
- "not_interested": Explicit refusal, unsubscribe request, or aggressive opt-out.

Return a JSON object with keys:
- "classification": Exactly one of ["meeting_requested", "interested", "objection", "follow_up_required", "not_interested"]
- "confidence": Float between 0.70 and 0.99
- "detected_sentiment": "positive", "neutral", "negative", or "cautious"
- "detected_objections": Array of specific objections found (e.g. ["budget constraints", "already using competitor", "bad timing"])
- "explanation": 2 sentences explaining WHY this classification was assigned based on specific phrasing in the text
- "suggested_response": A polite, high-converting 3-sentence reply draft for the sales rep to send back

Return strictly valid JSON only."""

    # Smart deterministic classifier for fallback
    msg_lower = inbound_message.lower()
    if any(k in msg_lower for k in ["calendar", "zoom", "meet", "schedule", "call tomorrow", "time on tuesday", "book a slot"]):
        fallback_class = "meeting_requested"
        fallback_sentiment = "positive"
        fallback_conf = 0.95
        fallback_exp = f"Prospect actively requested a meeting or shared scheduling availability for {product.name}."
        fallback_reply = f"Thanks for the quick response, {prospect.contact_name.split()[0] if prospect.contact_name else 'there'}. I'll send an invite with calendar options right away."
    elif any(k in msg_lower for k in ["interested", "pricing", "send more info", "how much", "tell me more", "share details", "deck"]):
        fallback_class = "interested"
        fallback_sentiment = "positive"
        fallback_conf = 0.90
        fallback_exp = f"Prospect showed clear buying intent and requested commercial information or collateral for {product.name}."
        fallback_reply = f"Glad to hear this aligns with what you're working on! Attached is our brief overview. When would be a good window to walk through how this applies to {prospect.company_name}?"
    elif any(k in msg_lower for k in ["already using", "no budget", "too busy", "not right now", "expensive", "contract with"]):
        fallback_class = "objection"
        fallback_sentiment = "cautious"
        fallback_conf = 0.88
        fallback_exp = "Prospect raised an operational objection regarding current tech stack or timing constraints."
        fallback_reply = f"Totally understand the timing around that, {prospect.contact_name.split()[0] if prospect.contact_name else 'there'}. Many of our customers initially used existing tools before seeing how {product.name} streamlined their handoffs. Mind if I check back next quarter?"
    elif any(k in msg_lower for k in ["next quarter", "reconnect in", "reach back", "out of office", "looping in", "talk to"]):
        fallback_class = "follow_up_required"
        fallback_sentiment = "neutral"
        fallback_conf = 0.87
        fallback_exp = "Prospect deferred immediate engagement or requested follow-up at a later date."
        fallback_reply = f"Will do! I'll put a note on my calendar to circle back as suggested. Hope your upcoming initiatives go smoothly."
    else:
        fallback_class = "not_interested"
        fallback_sentiment = "negative"
        fallback_conf = 0.92
        fallback_exp = "Prospect expressed no interest or opted out of further commercial outreach."
        fallback_reply = "Understood. Thanks for letting me know, and I've updated our system to ensure you won't hear from us again. All the best."

    deterministic_fallback = json.dumps({
        "classification": fallback_class,
        "confidence": fallback_conf,
        "detected_sentiment": fallback_sentiment,
        "detected_objections": ["timing_or_fit"] if fallback_class == "objection" else [],
        "explanation": fallback_exp,
        "suggested_response": fallback_reply,
    }, indent=2)

    result = await ollama_service.generate(
        prompt=prompt,
        workflow_name="reply_classification",
        system_prompt="You are a sales conversation analyst. Output strict JSON only.",
        model=model_override,
        db=db,
        entity_type="ConversationReply",
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

    # Persist in ConversationReply table with guard against small-model label confusion
    final_classification = parsed.get("classification", fallback_class)
    msg_low = inbound_message.lower()
    if any(k in msg_low for k in ["zoom", "call on", "calendar", "book a", "schedule a", "hop on a call"]):
        if final_classification in ["not_interested", "unqualified"]:
            final_classification = "meeting_requested"

    reply_record = ConversationReply(
        prospect_id=prospect.id,
        product_id=product.id,
        company_id=prospect.company_id,
        inbound_message=inbound_message,
        classification=final_classification,
        confidence=float(parsed.get("confidence", 0.9)),
        detected_sentiment=parsed.get("detected_sentiment", fallback_sentiment),
        detected_objections=json.dumps(parsed.get("detected_objections", [])),
        explanation=parsed.get("explanation", fallback_exp),
        suggested_response=parsed.get("suggested_response", fallback_reply),
    )
    db.add(reply_record)

    # Update prospect status to 'replied'
    prospect.status = "replied"
    db.commit()

    return {
        "reply_id": reply_record.id,
        "prospect_id": prospect.id,
        "product_id": product.id,
        "classification": reply_record.classification,
        "confidence": reply_record.confidence,
        "detected_sentiment": reply_record.detected_sentiment,
        "detected_objections": json.loads(reply_record.detected_objections),
        "explanation": reply_record.explanation,
        "suggested_response": reply_record.suggested_response,
        "model_used": result["model"],
        "duration_ms": result["duration_ms"],
        "tokens": result["tokens"],
        "is_deterministic_preview": result.get("is_deterministic_preview", False),
    }
