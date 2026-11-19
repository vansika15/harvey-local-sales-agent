import sys, os
sys.path.insert(0, r"C:\Users\hp\.gemini\antigravity\scratch\harvey-local-sales-agent")
import asyncio
import time
from backend.database import SessionLocal
from backend.services.workflows.business_profile import generate_business_profile
from backend.services.workflows.icp_generator import generate_product_icp
from backend.services.workflows.prospect_research import research_prospect_account
from backend.services.workflows.buying_signals import classify_buying_signals
from backend.services.workflows.problem_statements import generate_problem_statements
from backend.services.workflows.email_generator import generate_personalised_email
from backend.services.workflows.prospect_scorer import score_and_rank_prospect
from backend.services.workflows.reply_classifier import classify_conversation_reply

async def run_all():
    from backend.database import engine, Base, SessionLocal
    from backend.sample_data import seed_sample_database
    
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    seed_sample_database(db=db, force_reset=False)
    
    t0 = time.time()
    print("1. Business Profile...", flush=True)
    w1 = await generate_business_profile(company_id=1, db=db)
    print(f"   Done in {time.time()-t0:.2f}s -> {w1['profile'].get('industry_vertical')}", flush=True)

    t0 = time.time()
    print("2. ICP Generation...", flush=True)
    w2 = await generate_product_icp(product_id=1, db=db)
    print(f"   Done in {time.time()-t0:.2f}s -> {len(w2['icp'].get('target_industries', []))} industries", flush=True)

    t0 = time.time()
    print("3. Prospect Research...", flush=True)
    w3 = await research_prospect_account(prospect_id=1, db=db)
    print(f"   Done in {time.time()-t0:.2f}s -> {len(w3['verified_facts'])} verified facts", flush=True)

    t0 = time.time()
    print("4. Buying Signals...", flush=True)
    w4 = await classify_buying_signals(prospect_id=1, db=db)
    print(f"   Done in {time.time()-t0:.2f}s -> {w4['signals_count']} signals", flush=True)

    t0 = time.time()
    print("5. Problem Statements...", flush=True)
    w5 = await generate_problem_statements(prospect_id=1, product_id=1, db=db)
    print(f"   Done in {time.time()-t0:.2f}s -> {w5['problems_count']} problems", flush=True)

    t0 = time.time()
    print("6. Email Generation...", flush=True)
    w6 = await generate_personalised_email(prospect_id=1, product_id=1, db=db)
    print(f"   Done in {time.time()-t0:.2f}s -> Subject: '{w6['subject_line']}'", flush=True)

    t0 = time.time()
    print("7. Prospect Scoring...", flush=True)
    w7 = await score_and_rank_prospect(prospect_id=1, product_id=1, db=db)
    print(f"   Done in {time.time()-t0:.2f}s -> Score: {w7['overall_score']} ({w7['score_category']})", flush=True)

    t0 = time.time()
    print("8. Reply Classification...", flush=True)
    w8 = await classify_conversation_reply(
        inbound_message="Let us meet next Tuesday afternoon for a demo.",
        prospect_id=1, product_id=1, db=db
    )
    print(f"   Done in {time.time()-t0:.2f}s -> {w8['classification']}", flush=True)

    db.close()
    print("SUCCESS: ALL 8 AI WORKFLOWS COMPLETED AND VERIFIED!", flush=True)

if __name__ == "__main__":
    asyncio.run(run_all())
