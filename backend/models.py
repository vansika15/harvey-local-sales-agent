"""SQLAlchemy models for Harvey Local Sales Agent.
Ensures clean multi-company and multi-product data separation.
"""

from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, Boolean, Float, DateTime, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from backend.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), nullable=True)
    industry = Column(String(100), nullable=True)
    size = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    target_market = Column(Text, nullable=True)
    business_context = Column(Text, nullable=True)
    raw_business_notes = Column(Text, nullable=True)
    generated_profile = Column(Text, nullable=True)
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    products = relationship("Product", back_populates="company", cascade="all, delete-orphan")
    prospects = relationship("Prospect", back_populates="company", cascade="all, delete-orphan")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    description = Column(Text, nullable=False)
    target_customer_summary = Column(Text, nullable=True)
    value_proposition = Column(Text, nullable=True)
    pain_points_solved = Column(Text, default="[]")  # JSON list
    pricing_model = Column(String(100), nullable=True)
    features = Column(Text, default="[]")  # JSON list
    sales_context = Column(Text, nullable=True)
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="products")
    icp_profiles = relationship("ICPProfile", back_populates="product", cascade="all, delete-orphan")
    problem_statements = relationship("ProblemStatement", back_populates="product", cascade="all, delete-orphan")
    generated_emails = relationship("GeneratedEmail", back_populates="product", cascade="all, delete-orphan")


class ICPProfile(Base):
    __tablename__ = "icp_profiles"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    target_industries = Column(Text, default="[]")  # JSON list
    company_sizes = Column(Text, default="[]")  # JSON list
    decision_maker_roles = Column(Text, default="[]")  # JSON list
    target_geographies = Column(Text, default="[]")  # JSON list
    core_pain_points = Column(Text, default="[]")  # JSON list
    buying_triggers = Column(Text, default="[]")  # JSON list
    disqualifiers = Column(Text, default="[]")  # JSON list
    pitch_angle = Column(Text, nullable=True)
    raw_profile_json = Column(Text, nullable=True)
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product", back_populates="icp_profiles")


class Prospect(Base):
    __tablename__ = "prospects"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    domain = Column(String(255), nullable=True, index=True)
    industry = Column(String(100), nullable=True)
    company_size = Column(String(50), nullable=True)
    location = Column(String(150), nullable=True)
    contact_name = Column(String(150), nullable=True)
    contact_role = Column(String(150), nullable=True)
    contact_email = Column(String(255), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    linkedin_url = Column(String(500), nullable=True)
    website_url = Column(String(500), nullable=True)
    fit_score = Column(Integer, default=0)
    signal_score = Column(Integer, default=0)
    overall_score = Column(Integer, default=0)
    score_breakdown = Column(Text, default="{}")  # JSON dict
    score_reasoning = Column(Text, nullable=True)
    status = Column(String(50), default="new", index=True)  # new, researched, qualified, contacted, replied
    source = Column(String(50), default="manual")  # csv_import, manual, sample, web_research
    is_sample = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="prospects")
    research = relationship("ProspectResearch", back_populates="prospect", uselist=False, cascade="all, delete-orphan")
    buying_signals = relationship("BuyingSignal", back_populates="prospect", cascade="all, delete-orphan")
    problem_statements = relationship("ProblemStatement", back_populates="prospect", cascade="all, delete-orphan")
    scores = relationship("ProspectScore", back_populates="prospect", cascade="all, delete-orphan")
    generated_emails = relationship("GeneratedEmail", back_populates="prospect", cascade="all, delete-orphan")
    replies = relationship("ConversationReply", back_populates="prospect", cascade="all, delete-orphan")


class ProspectResearch(Base):
    __tablename__ = "prospect_research"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    site_summary = Column(Text, nullable=True)
    detected_tech_stack = Column(Text, default="[]")  # JSON list
    hiring_notes = Column(Text, default="[]")  # JSON list
    key_initiatives = Column(Text, default="[]")  # JSON list
    site_facts = Column(Text, default="{}")  # JSON dict (schema markup, robots, thin pages)
    verified_facts = Column(Text, default="[]")  # JSON list of confirmed facts
    unavailable_facts = Column(Text, default="[]")  # JSON list of unverified/missing info
    source_urls = Column(Text, default="[]")  # JSON list of source URLs
    research_timestamp = Column(DateTime, default=datetime.utcnow)
    offline_cached = Column(Boolean, default=True)
    raw_html_excerpt = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="research")


class BuyingSignal(Base):
    __tablename__ = "buying_signals"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    signal_type = Column(String(50), nullable=False)  # hiring, expansion, funding, product_launch, tech_change
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    detected_value = Column(String(255), nullable=True)
    confidence = Column(Float, default=0.85)  # 0.0 to 1.0
    sales_implication = Column(Text, nullable=False)
    source_url = Column(String(500), nullable=True)
    source_date = Column(String(50), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="buying_signals")


class ProblemStatement(Base):
    __tablename__ = "problem_statements"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    problem_title = Column(String(255), nullable=False)
    problem_description = Column(Text, nullable=False)
    connection_to_product = Column(Text, nullable=False)
    severity = Column(String(20), default="medium")  # high, medium, low
    reasoning = Column(Text, nullable=False)
    suggested_solution_pitch = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="problem_statements")
    product = relationship("Product", back_populates="problem_statements")


class ProspectScore(Base):
    __tablename__ = "prospect_scores"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    overall_score = Column(Integer, nullable=False)  # 0-100
    fit_score = Column(Integer, nullable=False)  # 0-40
    signal_score = Column(Integer, nullable=False)  # 0-40
    reachability_score = Column(Integer, nullable=False)  # 0-20
    score_category = Column(String(50), nullable=False)  # high_priority, medium_priority, low_priority, unqualified
    detailed_breakdown = Column(Text, default="{}")  # JSON dict
    reasoning = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="scores")


class GeneratedEmail(Base):
    __tablename__ = "generated_emails"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    sequence_step = Column(Integer, default=1)  # 1, 2, 3
    subject_line = Column(String(255), nullable=False)
    email_body = Column(Text, nullable=False)
    hook_opening = Column(Text, nullable=True)
    value_proposition = Column(Text, nullable=True)
    call_to_action = Column(Text, nullable=True)
    status = Column(String(50), default="draft")  # draft, approved, sent, rejected
    model_used = Column(String(100), default="qwen2.5:3b")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="generated_emails")
    product = relationship("Product", back_populates="generated_emails")


class ConversationReply(Base):
    __tablename__ = "conversation_replies"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(Integer, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    inbound_message = Column(Text, nullable=False)
    classification = Column(String(50), nullable=False)  # interested, not_interested, objection, follow_up_required, meeting_requested
    confidence = Column(Float, default=0.9)
    detected_sentiment = Column(String(50), default="neutral")  # positive, neutral, negative, cautious
    detected_objections = Column(Text, default="[]")  # JSON list
    explanation = Column(Text, nullable=False)
    suggested_response = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="replies")


class ModelExecutionLog(Base):
    __tablename__ = "model_execution_logs"

    id = Column(Integer, primary_key=True, index=True)
    workflow_name = Column(String(100), nullable=False, index=True)
    model_name = Column(String(100), nullable=False)
    prompt_preview = Column(Text, nullable=True)
    response_preview = Column(Text, nullable=True)
    execution_time_ms = Column(Integer, default=0)
    token_estimate = Column(Integer, default=0)
    status = Column(String(50), default="success")  # success, queued, error
    is_offline = Column(Boolean, default=False)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class TaskQueue(Base):
    __tablename__ = "task_queue"

    id = Column(Integer, primary_key=True, index=True)
    workflow_name = Column(String(100), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    payload_json = Column(Text, default="{}")
    status = Column(String(50), default="pending", index=True)  # pending, processing, completed, failed
    attempts = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
