"""Pydantic schemas for Harvey Local Sales Agent API validation and responses.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


# -----------------------------------------------------------------------------
# Base & Common Schemas
# -----------------------------------------------------------------------------
class SystemHealthResponse(BaseModel):
    status: str
    ollama_connected: bool
    ollama_url: str
    active_model: str
    available_models: List[str]
    offline_mode: bool
    pending_tasks_count: int
    environment: str


class HardwareProfileResponse(BaseModel):
    os: str
    os_release: str
    cpu_model: str
    cpu_cores: int
    total_ram_gb: float
    available_ram_gb: float
    gpu_name: str
    gpu_vram_mb: Optional[float]
    free_disk_gb: float
    hardware_tier: str  # Laptop / Standard / High-Performance
    recommended_model: str
    recommended_config: Dict[str, Any]
    supported_models: List[Dict[str, Any]]


# -----------------------------------------------------------------------------
# Company Schemas
# -----------------------------------------------------------------------------
class CompanyBase(BaseModel):
    name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    description: Optional[str] = None
    target_market: Optional[str] = None
    business_context: Optional[str] = None
    raw_business_notes: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    domain: Optional[str] = None
    industry: Optional[str] = None
    size: Optional[str] = None
    description: Optional[str] = None
    target_market: Optional[str] = None
    business_context: Optional[str] = None
    raw_business_notes: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: int
    generated_profile: Optional[str] = None
    is_sample: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BusinessProfileGenerateRequest(BaseModel):
    business_notes: Optional[str] = None
    model_override: Optional[str] = None


# -----------------------------------------------------------------------------
# Product Schemas
# -----------------------------------------------------------------------------
class ProductBase(BaseModel):
    company_id: int
    name: str
    slug: Optional[str] = None
    category: Optional[str] = None
    description: str
    target_customer_summary: Optional[str] = None
    value_proposition: Optional[str] = None
    pain_points_solved: Optional[List[str]] = Field(default_factory=list)
    pricing_model: Optional[str] = None
    features: Optional[List[str]] = Field(default_factory=list)
    sales_context: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    target_customer_summary: Optional[str] = None
    value_proposition: Optional[str] = None
    pain_points_solved: Optional[List[str]] = None
    pricing_model: Optional[str] = None
    features: Optional[List[str]] = None
    sales_context: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    is_sample: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# ICP Profile Schemas
# -----------------------------------------------------------------------------
class ICPGenerateRequest(BaseModel):
    additional_guidelines: Optional[str] = None
    model_override: Optional[str] = None


class ICPProfileResponse(BaseModel):
    id: int
    product_id: int
    company_id: int
    target_industries: List[str]
    company_sizes: List[str]
    decision_maker_roles: List[str]
    target_geographies: List[str]
    core_pain_points: List[str]
    buying_triggers: List[str]
    disqualifiers: List[str]
    pitch_angle: Optional[str] = None
    is_sample: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Prospect Schemas
# -----------------------------------------------------------------------------
class ProspectBase(BaseModel):
    company_id: int
    product_id: Optional[int] = None
    company_name: str
    domain: Optional[str] = None
    industry: Optional[str] = None
    company_size: Optional[str] = None
    location: Optional[str] = None
    contact_name: Optional[str] = None
    contact_role: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    website_url: Optional[str] = None


class ProspectCreate(ProspectBase):
    source: Optional[str] = "manual"


class ProspectResponse(ProspectBase):
    id: int
    fit_score: int
    signal_score: int
    overall_score: int
    score_breakdown: Dict[str, Any]
    score_reasoning: Optional[str] = None
    status: str
    source: str
    is_sample: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Prospect Research Schemas
# -----------------------------------------------------------------------------
class ResearchRequest(BaseModel):
    force_live_scrape: bool = False
    model_override: Optional[str] = None


class ProspectResearchResponse(BaseModel):
    id: int
    prospect_id: int
    company_id: int
    site_summary: Optional[str]
    detected_tech_stack: List[str]
    hiring_notes: List[str]
    key_initiatives: List[str]
    site_facts: Dict[str, Any]
    verified_facts: List[str]
    unavailable_facts: List[str]
    source_urls: List[str]
    research_timestamp: datetime
    offline_cached: bool

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Buying Signal Schemas
# -----------------------------------------------------------------------------
class BuyingSignalResponse(BaseModel):
    id: int
    prospect_id: int
    company_id: int
    product_id: Optional[int]
    signal_type: str
    title: str
    description: str
    detected_value: Optional[str]
    confidence: float
    sales_implication: str
    source_url: Optional[str]
    source_date: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SignalClassifyRequest(BaseModel):
    model_override: Optional[str] = None


# -----------------------------------------------------------------------------
# Problem Statement Schemas
# -----------------------------------------------------------------------------
class ProblemStatementResponse(BaseModel):
    id: int
    prospect_id: int
    product_id: int
    company_id: int
    problem_title: str
    problem_description: str
    connection_to_product: str
    severity: str
    reasoning: str
    suggested_solution_pitch: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ProblemGenerateRequest(BaseModel):
    product_id: int
    model_override: Optional[str] = None


# -----------------------------------------------------------------------------
# Prospect Score Schemas
# -----------------------------------------------------------------------------
class ProspectScoreResponse(BaseModel):
    id: int
    prospect_id: int
    product_id: int
    company_id: int
    overall_score: int
    fit_score: int
    signal_score: int
    reachability_score: int
    score_category: str
    detailed_breakdown: Dict[str, Any]
    reasoning: str
    created_at: datetime

    class Config:
        from_attributes = True


class ScoreCalculateRequest(BaseModel):
    product_id: int
    model_override: Optional[str] = None


# -----------------------------------------------------------------------------
# Personalised Email Schemas
# -----------------------------------------------------------------------------
class EmailGenerateRequest(BaseModel):
    product_id: int
    sequence_step: int = 1
    tone: Optional[str] = "consultative and punchy"
    model_override: Optional[str] = None


class GeneratedEmailResponse(BaseModel):
    id: int
    prospect_id: int
    product_id: int
    company_id: int
    sequence_step: int
    subject_line: str
    email_body: str
    hook_opening: Optional[str]
    value_proposition: Optional[str]
    call_to_action: Optional[str]
    status: str
    model_used: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Reply Classification Schemas
# -----------------------------------------------------------------------------
class ReplyClassifyRequest(BaseModel):
    inbound_message: str
    prospect_id: int
    product_id: int
    model_override: Optional[str] = None


class ConversationReplyResponse(BaseModel):
    id: int
    prospect_id: int
    product_id: int
    company_id: int
    inbound_message: str
    classification: str
    confidence: float
    detected_sentiment: str
    detected_objections: List[str]
    explanation: str
    suggested_response: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Model Execution Log Schemas
# -----------------------------------------------------------------------------
class ModelExecutionLogResponse(BaseModel):
    id: int
    workflow_name: str
    model_name: str
    prompt_preview: Optional[str]
    response_preview: Optional[str]
    execution_time_ms: int
    token_estimate: int
    status: str
    is_offline: bool
    error_message: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# -----------------------------------------------------------------------------
# Task Queue Schemas
# -----------------------------------------------------------------------------
class TaskQueueResponse(BaseModel):
    id: int
    workflow_name: str
    entity_type: str
    entity_id: int
    status: str
    attempts: int
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
