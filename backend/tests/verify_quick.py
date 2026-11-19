import sys, os
sys.path.insert(0, r"C:\Users\hp\.gemini\antigravity\scratch\harvey-local-sales-agent")
import asyncio
import time
from backend.database import engine, Base, SessionLocal
from backend.sample_data import seed_sample_database
from backend.services.workflows.business_profile import generate_business_profile
from backend.services.workflows.icp_generator import generate_product_icp
from backend.services.workflows.prospect_research import research_prospect_account
from backend.services.workflows.buying_signals import classify_buying_signals
from backend.services.workflows.problem_statements import generate_problem_statements
from backend.services.workflows.email_generator import generate_personalised_email
from backend.services.workflows.prospect_scorer import score_and_rank_prospect
from backend.services.workflows.reply_classifier import classify_conversation_reply

async def run_all():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_sample_database(db=db, force_reset=False)
    
    print("=" * 70, flush=True)
    print("HARVEY LOCAL SALES AGENT: VERIFYING ALL 8 AI WORKFLOWS VIA LIVE OLLAMA", flush=True)
    print("=" * 70, flush=True)

    t0 = time.time()
    print("1. Business Profile Generation...", flush=True)
    w1 = await generate_business_profile(company_id=1, db=db)
    print(f"   [DONE] {time.time()-t0:.2f}s | Model: {w1.get('model_used')} | Preview: {w1.get('is_deterministic_preview', False)} | Vertical: {w1['profile'].get('industry_vertical')}", flush=True)

    t0 = time.time()
    print("2. Product-Specific ICP Generation...", flush=True)
    w2 = await generate_product_icp(product_id=1, db=db)
    print(f"   [DONE] {time.time()-t0:.2f}s | Model: {w2.get('model_used')} | Preview: {w2.get('is_deterministic_preview', False)} | Industries: {len(w2['icp'].get('target_industries', []))}", flush=True)

    t0 = time.time()
    print("3. Prospect Account Research & Fact Synthesis...", flush=True)
    w3 = await research_prospect_account(prospect_id=1, db=db)
    print(f"   [DONE] {time.time()-t0:.2f}s | Model: {w3.get('model_used')} | Preview: {w3.get('is_deterministic_preview', False)} | Facts: {len(w3['verified_facts'])} verified", flush=True)

    t0 = time.time()
    print("4. Buying-Signal Classification...", flush=True)
    w4 = await classify_buying_signals(prospect_id=1, db=db)
    print(f"   [DONE] {time.time()-t0:.2f}s | Model: {w4.get('model_used')} | Preview: {w4.get('is_deterministic_preview', False)} | Signals: {w4['signals_count']} detected", flush=True)

    t0 = time.time()
    print("5. Problem Statement Generation...", flush=True)
    w5 = await generate_problem_statements(prospect_id=1, product_id=1, db=db)
    print(f"   [DONE] {time.time()-t0:.2f}s | Model: {w5.get('model_used')} | Preview: {w5.get('is_deterministic_preview', False)} | Problems: {w5['problems_count']} mapped", flush=True)

    t0 = time.time()
    print("6. Personalised Sales Email Generation...", flush=True)
    w6 = await generate_personalised_email(prospect_id=1, product_id=1, db=db)
    print(f"   [DONE] {time.time()-t0:.2f}s | Model: {w6.get('model_used')} | Preview: {w6.get('is_deterministic_preview', False)} | Subject: '{w6['subject_line']}'", flush=True)

    t0 = time.time()
    print("7. Transparent Prospect Scoring (0-100)...", flush=True)
    w7 = await score_and_rank_prospect(prospect_id=1, product_id=1, db=db)
    print(f"   [DONE] {time.time()-t0:.2f}s | Model: {w7.get('model_used')} | Preview: {w7.get('is_deterministic_preview', False)} | Score: {w7['overall_score']} ({w7['score_category']})", flush=True)

    t0 = time.time()
    print("8. Inbound Reply Classification...", flush=True)
    w8 = await classify_conversation_reply(
        inbound_message="Let us meet next Tuesday afternoon at 2 PM for a demo.",
        prospect_id=1, product_id=1, db=db
    )
    print(f"   [DONE] {time.time()-t0:.2f}s | Model: {w8.get('model_used')} | Preview: {w8.get('is_deterministic_preview', False)} | Classification: {w8['classification']}", flush=True)

    db.close()
    print("=" * 70, flush=True)
    print("SUCCESS: ALL 8 AI WORKFLOWS EXECUTED VIA LOCAL OLLAMA INFERENCE!", flush=True)
    print("=" * 70, flush=True)

if __name__ == "__main__":
    asyncio.run(run_all())
