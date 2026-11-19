"""Realistic sample data for multi-company and multi-product demonstration.
Provides instant, fully populated sales environments for demonstration and offline testing.
All records are marked with is_sample=True.
"""

import json
from datetime import datetime
from sqlalchemy.orm import Session
from backend.models import (
    Company, Product, ICPProfile, Prospect, ProspectResearch,
    BuyingSignal, ProblemStatement, ProspectScore, GeneratedEmail, ConversationReply
)


def seed_sample_database(db: Session, force_reset: bool = False):
    """Seed sample companies, products, prospects, and conversation replies."""
    if force_reset:
        db.query(ConversationReply).filter(ConversationReply.company_id.isnot(None)).delete()
        db.query(GeneratedEmail).filter(GeneratedEmail.company_id.isnot(None)).delete()
        db.query(ProspectScore).filter(ProspectScore.company_id.isnot(None)).delete()
        db.query(ProblemStatement).filter(ProblemStatement.company_id.isnot(None)).delete()
        db.query(BuyingSignal).filter(BuyingSignal.company_id.isnot(None)).delete()
        db.query(ProspectResearch).filter(ProspectResearch.company_id.isnot(None)).delete()
        db.query(Prospect).filter(Prospect.is_sample == True).delete()
        db.query(ICPProfile).filter(ICPProfile.is_sample == True).delete()
        db.query(Product).filter(Product.is_sample == True).delete()
        db.query(Company).filter(Company.is_sample == True).delete()
        db.commit()

    # Check if already seeded
    existing_sample = db.query(Company).filter(Company.is_sample == True).first()
    if existing_sample:
        return {"status": "already_seeded", "message": "Sample data is already present."}

    # =========================================================================
    # Company 1: CloudOps Dynamics
    # =========================================================================
    c1 = Company(
        name="CloudOps Dynamics",
        domain="cloudopsdynamics.io",
        industry="Cloud Infrastructure & DevOps",
        size="100-250 employees",
        description="Autonomous cloud reliability, telemetry, and Kubernetes cost-optimization software.",
        target_market="Engineering leaders at mid-market and enterprise B2B SaaS companies spending $30k+/mo on AWS/GCP.",
        business_context="High-growth enterprise DevOps market. Key competitors include Datadog and Dynatrace.",
        raw_business_notes="Founded in 2023. Backed by top infrastructure angels. Customers see 35% reduction in cloud waste within 14 days.",
        generated_profile=json.dumps({
            "industry_vertical": "DevOps & Cloud Infrastructure Automation",
            "business_model": "B2B SaaS with consumption-based compute tier",
            "target_market": "Mid-market & enterprise tech companies scaling Kubernetes clusters",
            "core_value_proposition": "Cut cloud infrastructure bills by 35% and eliminate manual Kubernetes triage with autonomous reliability agents.",
            "key_differentiators": [
                "Zero-agent eBPF real-time kernel observability",
                "Automated FinOps right-sizing with instant rollback",
                "Sub-minute root-cause incident analysis",
                "Full SOC2 Type II and HIPAA compliance"
            ],
            "sales_context": "Focus on engineering executives and DevOps directors experiencing runaway cloud bills and alert fatigue."
        }, indent=2),
        is_sample=True,
    )
    db.add(c1)
    db.flush()

    # Product 1A: KubeGuard AI
    p1a = Product(
        company_id=c1.id,
        name="KubeGuard AI",
        slug="kubeguard-ai",
        category="Kubernetes Optimization",
        description="Autonomous Kubernetes cluster right-sizing and security posture management engine.",
        target_customer_summary="VP Engineering, Head of DevOps, and FinOps Directors running 50+ microservices on EKS/GKE.",
        value_proposition="Save 35% on cluster compute and fix security misconfigurations automatically without breaking deployments.",
        pain_points_solved=json.dumps([
            "Over-provisioned pod CPU and memory requests draining cloud budgets",
            "Constant manual tuning of Horizontal Pod Autoscalers",
            "Undetected CVEs and privilege escalations in staging and production pods"
        ]),
        pricing_model="$49 per node/month with a 14-day zero-risk trial",
        features=json.dumps([
            "Predictive workload right-sizing",
            "eBPF container runtime security",
            "One-click Terraform integration",
            "Slack & PagerDuty smart alerts"
        ]),
        sales_context="Position against manual FinOps spreadsheets and noisy static security scanners.",
        is_sample=True,
    )
    db.add(p1a)

    # Product 1B: LogStream Pro
    p1b = Product(
        company_id=c1.id,
        name="LogStream Pro",
        slug="logstream-pro",
        category="Telemetry & Incident Triage",
        description="High-velocity distributed telemetry pipeline and AI incident triage platform.",
        target_customer_summary="SRE managers and Platform Leads struggling with million-dollar Datadog log ingestion bills.",
        value_proposition="Reduce log ingestion costs by 70% while detecting production anomalies 10x faster.",
        pain_points_solved=json.dumps([
            "Unpredictable log indexing bills during traffic spikes",
            "Mean-Time-To-Resolution (MTTR) over 45 minutes for critical microservice outages",
            "SRE burnout from triaging thousands of noisy alerts"
        ]),
        pricing_model="$0.10 per GB ingested with unlimited query retention",
        features=json.dumps([
            "Smart in-flight log de-duplication",
            "Automated trace-to-log correlation",
            "Root-cause AI incident summaries"
        ]),
        sales_context="Direct displacement campaign against expensive legacy APM platforms.",
        is_sample=True,
    )
    db.add(p1b)
    db.flush()

    # ICP Profile for KubeGuard AI
    icp1a = ICPProfile(
        product_id=p1a.id,
        company_id=c1.id,
        target_industries=json.dumps(["B2B SaaS", "Fintech & Payments", "HealthTech", "E-commerce Infrastructure"]),
        company_sizes=json.dumps(["50-200 employees", "201-1,000 employees"]),
        decision_maker_roles=json.dumps(["VP Engineering", "Head of Infrastructure", "Director of DevOps", "Chief Technology Officer"]),
        target_geographies=json.dumps(["United States", "Canada", "United Kingdom", "Germany"]),
        core_pain_points=json.dumps([
            "Over-provisioned cloud infrastructure burning $10k+ monthly in idle compute",
            "DevOps team overwhelmed by repetitive cluster maintenance",
            "Failing SOC2 audit checks due to container privilege gaps"
        ]),
        buying_triggers=json.dumps([
            "Quarterly executive mandate to reduce cloud hosting expenditures",
            "Recent migration to Kubernetes / AWS EKS",
            "Post-mortem following a high-severity cluster outage"
        ]),
        disqualifiers=json.dumps([
            "On-premise bare-metal only without containerization",
            "Monthly cloud spend under $5,000",
            "No dedicated DevOps or infrastructure engineer on staff"
        ]),
        pitch_angle="Cut Kubernetes compute waste by 35% in your first week with zero configuration changes.",
        is_sample=True,
    )
    db.add(icp1a)

    # Prospects for CloudOps Dynamics
    pr1 = Prospect(
        company_id=c1.id,
        product_id=p1a.id,
        company_name="FinScale Technologies",
        domain="finscaletech.com",
        industry="Fintech & Payments",
        company_size="150-300 employees",
        location="New York, NY",
        contact_name="Marcus Vance",
        contact_role="VP of Engineering",
        contact_email="marcus.vance@finscaletech.com",
        contact_phone="+1-212-555-0194",
        linkedin_url="https://linkedin.com/in/marcusvance-fintech",
        website_url="https://finscaletech.com",
        fit_score=38,
        signal_score=35,
        overall_score=91,
        score_breakdown=json.dumps({
            "fit_score": 38,
            "signal_score": 35,
            "reachability_score": 18,
            "overall_score": 91,
            "score_category": "high_priority"
        }),
        score_reasoning="FinScale is an ideal match: fast-growing fintech scaling on AWS EKS with heavy microservice compliance requirements. Marcus Vance holds direct budget sign-off.",
        status="qualified",
        source="sample",
        is_sample=True,
    )
    db.add(pr1)
    db.flush()

    # Research for FinScale
    res1 = ProspectResearch(
        prospect_id=pr1.id,
        company_id=c1.id,
        site_summary="FinScale Technologies builds real-time multi-currency clearing APIs for global digital banks. Their platform processes over 10M transactions daily on AWS.",
        detected_tech_stack=json.dumps(["Kubernetes (EKS)", "Next.js", "Stripe", "AWS CloudFront", "Tailwind CSS"]),
        hiring_notes=json.dumps(["Hiring 4 Senior Infrastructure Engineers", "Open requisition for Lead DevOps Architect"]),
        key_initiatives=json.dumps(["Expanding European clearing infrastructure", "Preparing for SOC2 Type II audit renewal"]),
        site_facts=json.dumps({"has_schema_markup": True, "blocks_crawlers": False, "stale_blog": False}),
        verified_facts=json.dumps([
            "Processes high-volume payments on distributed Kubernetes microservices",
            "Marcus Vance actively leads the platform engineering organization",
            "Currently hiring senior DevOps engineers in North America"
        ]),
        unavailable_facts=json.dumps([
            "Exact monthly AWS compute bill is confidential",
            "Current cloud FinOps tool provider not publicly listed"
        ]),
        source_urls=json.dumps(["https://finscaletech.com", "https://finscaletech.com/careers"]),
        offline_cached=True,
    )
    db.add(res1)

    # Buying Signals for FinScale
    sig1 = BuyingSignal(
        prospect_id=pr1.id,
        company_id=c1.id,
        product_id=p1a.id,
        signal_type="hiring",
        title="Aggressive Infrastructure Engineering Expansion",
        description="FinScale opened 4 senior DevOps and platform engineering roles in the past 30 days.",
        detected_value="4 senior infrastructure requisitions active",
        confidence=0.94,
        sales_implication="Rapid infrastructure hiring signals capacity bottlenecks and urgent need for automation tooling.",
        source_url="https://finscaletech.com/careers",
        source_date="Recent",
    )
    sig2 = BuyingSignal(
        prospect_id=pr1.id,
        company_id=c1.id,
        product_id=p1a.id,
        signal_type="expansion",
        title="European API Launch & Multi-Region Compute Scaling",
        description="Announced new European banking gateway, requiring multi-region EKS clusters.",
        detected_value="Multi-region cluster expansion",
        confidence=0.91,
        sales_implication="Multi-region deployments double idle compute waste without automated pod right-sizing.",
        source_url="https://finscaletech.com/press",
        source_date="Recent",
    )
    db.add(sig1)
    db.add(sig2)

    # Problem Statement for FinScale
    prob1 = ProblemStatement(
        prospect_id=pr1.id,
        product_id=p1a.id,
        company_id=c1.id,
        problem_title="FinScale's Multi-Region EKS Clusters Burning Idle Compute",
        problem_description="With 150+ engineers and multi-region payment APIs, FinScale maintains massive pod overhead to handle unexpected transaction spikes, causing 30-40% cloud overspend.",
        connection_to_product="KubeGuard AI's predictive right-sizing automatically scales pod requests based on transaction velocity, preserving 99.999% SLA while slashing idle spend.",
        severity="high",
        reasoning="Fintech microservices require high headroom for reliability; without autonomous tuning, engineering teams default to expensive static over-provisioning.",
        suggested_solution_pitch="Marcus, we show FinTech engineering teams how to reclaim 35% of their EKS spend without risking latency spikes.",
    )
    db.add(prob1)

    # Personalised Email for FinScale
    em1 = GeneratedEmail(
        prospect_id=pr1.id,
        product_id=p1a.id,
        company_id=c1.id,
        sequence_step=1,
        subject_line="cutting FinScale's EKS compute waste",
        email_body="""Hi Marcus,

Noticed FinScale's recent European gateway expansion and your open senior DevOps requisitions.

Most fintech engineering leaders scaling multi-region microservices tell us their teams are forced to massively over-provision EKS pods to guarantee transaction headroom, resulting in 30%+ wasted compute.

KubeGuard AI autonomically right-sizes pod resources in real time with zero code changes, saving our customers an average of 35% on AWS bills while locking down container security.

Worth a 10-minute chat this Thursday, or should I send over a quick 2-page case study on how similar payment platforms reduced cluster waste?""",
        hook_opening="Noticed FinScale's recent European gateway expansion and your open senior DevOps requisitions.",
        value_proposition="KubeGuard AI autonomically right-sizes pod resources in real time with zero code changes, saving our customers an average of 35% on AWS bills.",
        call_to_action="Worth a 10-minute chat this Thursday, or should I send over a quick 2-page case study?",
        status="approved",
        model_used="qwen2.5:3b",
    )
    db.add(em1)

    # Sample Conversation Replies for FinScale
    rep1 = ConversationReply(
        prospect_id=pr1.id,
        product_id=p1a.id,
        company_id=c1.id,
        inbound_message="Hi team, appreciate the note. Our AWS bills have indeed been ballooning since the multi-region rollout. How does KubeGuard handle latency-sensitive microservices? Can you share a calendar link for Tuesday afternoon?",
        classification="meeting_requested",
        confidence=0.96,
        detected_sentiment="positive",
        detected_objections=json.dumps([]),
        explanation="Prospect confirmed pain point regarding ballooning AWS bills and explicitly requested a calendar link for Tuesday afternoon.",
        suggested_response="Hi Marcus, glad this resonated! KubeGuard is built specifically for sub-millisecond payment services using predictive buffers. Here is my link for Tuesday: [Link]. Looking forward to speaking.",
    )
    db.add(rep1)

    # =========================================================================
    # Company 2: Bookwell Systems (Multi-Product Field & Clinic SaaS)
    # =========================================================================
    c2 = Company(
        name="Bookwell Systems",
        domain="bookwell.io",
        industry="Vertical SaaS & Field Automation",
        size="50-100 employees",
        description="Modern scheduling, automated booking, and dispatch workflows for clinics and field contractors.",
        target_market="Dental practices, medical wellness centers, and specialty trade contractors (roofing, HVAC).",
        business_context="Direct homage to the upstream Harvey outreach system, extending multi-product capabilities.",
        raw_business_notes="Two flagship software products: PracticePilot for healthcare clinics and FieldSync for commercial contractors.",
        generated_profile=json.dumps({
            "industry_vertical": "Vertical SaaS & Mobile Field Operations",
            "business_model": "Monthly B2B SaaS subscription per seat/truck",
            "target_market": "High-ticket service businesses losing bookings to manual phone tag and legacy dispatch",
            "core_value_proposition": "Turn missed calls and messy dispatch sheets into instant revenue with automated 24/7 online booking.",
            "key_differentiators": [
                "Two-way SMS booking widget with zero app download required",
                "Automated technician routing based on live traffic and job skill requirements",
                "Instant payment pre-authorization",
                "Full integration with Dentrix, Jobber, and QuickBooks"
            ],
            "sales_context": "Help business owners recapture lost customer bookings during evenings and weekends."
        }, indent=2),
        is_sample=True,
    )
    db.add(c2)
    db.flush()

    # Product 2A: PracticePilot
    p2a = Product(
        company_id=c2.id,
        name="PracticePilot",
        slug="practice-pilot",
        category="Healthcare Practice SaaS",
        description="Self-service patient scheduling, automated intake, and chair-fill automation for clinics.",
        target_customer_summary="Dental practice owners, clinic directors, and healthcare operations managers.",
        value_proposition="Fill 98% of empty chair hours and eliminate phone tag with instant online patient booking.",
        pain_points_solved=json.dumps([
            "Front desk staff bogged down by phone scheduling",
            "High patient no-show rates (15-20%)",
            "Patients booking after-hours finding no way to confirm an appointment"
        ]),
        pricing_model="$299/month per clinic location",
        features=json.dumps(["Direct Dentrix sync", "Two-way automated SMS reminders", "Insurance verification"]),
        is_sample=True,
    )
    db.add(p2a)

    # Product 2B: FieldSync Mobile
    p2b = Product(
        company_id=c2.id,
        name="FieldSync Mobile",
        slug="fieldsync-mobile",
        category="Contractor Field Service",
        description="Automated job dispatch, crew tracking, and instant quote-to-invoice software for field contractors.",
        target_customer_summary="Commercial roofing, HVAC, and plumbing business owners running 5 to 30 service trucks.",
        value_proposition="Dispatch service crews 40% faster and collect payment on-site with zero paper invoices.",
        pain_points_solved=json.dumps([
            "Dispatchers using whiteboards and phone calls to coordinate technicians",
            "Delayed customer billing taking 30+ days to collect",
            "Technicians arriving at jobs without access to equipment history"
        ]),
        pricing_model="$65 per technician/month",
        features=json.dumps(["GPS technician tracking", "Mobile photo work-orders", "On-site credit card processing"]),
        is_sample=True,
    )
    db.add(p2b)
    db.flush()

    # Prospects for Bookwell
    pr2 = Prospect(
        company_id=c2.id,
        product_id=p2a.id,
        company_name="Harbor Dental Studio",
        domain="harbordental.test",
        industry="Dental & Healthcare",
        company_size="25-50 employees",
        location="Seattle, WA",
        contact_name="Dr. Elena Park",
        contact_role="Practice Owner & Lead Clinician",
        contact_email="elena.park@harbordental.test",
        contact_phone="+1-206-555-0182",
        website_url="https://harbordental.test",
        fit_score=36,
        signal_score=32,
        overall_score=86,
        score_breakdown=json.dumps({
            "fit_score": 36,
            "signal_score": 32,
            "reachability_score": 18,
            "overall_score": 86,
            "score_category": "high_priority"
        }),
        score_reasoning="High-priority clinic lead: 3 locations, no online booking widget on homepage, losing after-hours appointment requests to competitors.",
        status="qualified",
        source="sample",
        is_sample=True,
    )
    db.add(pr2)

    pr3 = Prospect(
        company_id=c2.id,
        product_id=p2b.id,
        company_name="Highline Roofing & Solar",
        domain="highlineroofing.test",
        industry="Commercial Contracting",
        company_size="35-75 employees",
        location="Denver, CO",
        contact_name="Priya Nair",
        contact_role="Director of Operations",
        contact_email="priya.nair@highlineroofing.test",
        contact_phone="+1-303-555-0144",
        website_url="https://highlineroofing.test",
        fit_score=35,
        signal_score=30,
        overall_score=83,
        score_breakdown=json.dumps({
            "fit_score": 35,
            "signal_score": 30,
            "reachability_score": 18,
            "overall_score": 83,
            "score_category": "high_priority"
        }),
        score_reasoning="Growing commercial contractor with 18 field crews. Hiring 3 new service coordinators.",
        status="qualified",
        source="sample",
        is_sample=True,
    )
    db.add(pr3)

    db.commit()
    return {"status": "success", "message": "Sample companies, products, prospects, and intelligence successfully seeded."}
