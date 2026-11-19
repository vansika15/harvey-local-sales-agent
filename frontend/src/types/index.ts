export interface Company {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  size?: string;
  description?: string;
  target_market?: string;
  business_context?: string;
  raw_business_notes?: string;
  generated_profile?: string;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  company_id: number;
  name: string;
  slug?: string;
  category?: string;
  description: string;
  target_customer_summary?: string;
  value_proposition?: string;
  pain_points_solved: string[];
  pricing_model?: string;
  features: string[];
  sales_context?: string;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface ICPProfile {
  id: number;
  product_id: number;
  company_id: number;
  target_industries: string[];
  company_sizes: string[];
  decision_maker_roles: string[];
  target_geographies: string[];
  core_pain_points: string[];
  buying_triggers: string[];
  disqualifiers: string[];
  pitch_angle?: string;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prospect {
  id: number;
  company_id: number;
  product_id?: number;
  company_name: string;
  domain?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  contact_name?: string;
  contact_role?: string;
  contact_email?: string;
  contact_phone?: string;
  linkedin_url?: string;
  website_url?: string;
  fit_score: number;
  signal_score: number;
  overall_score: number;
  score_breakdown: Record<string, any>;
  score_reasoning?: string;
  status: "new" | "researched" | "qualified" | "contacted" | "replied";
  source: string;
  is_sample: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProspectResearch {
  id: number;
  prospect_id: number;
  company_id: number;
  site_summary?: string;
  detected_tech_stack: string[];
  hiring_notes: string[];
  key_initiatives: string[];
  site_facts: Record<string, any>;
  verified_facts: string[];
  unavailable_facts: string[];
  source_urls: string[];
  research_timestamp: string;
  offline_cached: boolean;
}

export interface BuyingSignal {
  id: number;
  prospect_id: number;
  company_id: number;
  product_id?: number;
  signal_type: "hiring" | "expansion" | "funding" | "product_launch" | "tech_change" | "management_change";
  title: string;
  description: string;
  detected_value?: string;
  confidence: number;
  sales_implication: string;
  source_url?: string;
  source_date?: string;
  created_at: string;
}

export interface ProblemStatement {
  id: number;
  prospect_id: number;
  product_id: number;
  company_id: number;
  problem_title: string;
  problem_description: string;
  connection_to_product: string;
  severity: "high" | "medium" | "low";
  reasoning: string;
  suggested_solution_pitch?: string;
  created_at: string;
}

export interface ProspectScore {
  id: number;
  prospect_id: number;
  product_id: number;
  company_id: number;
  overall_score: number;
  fit_score: number;
  signal_score: number;
  reachability_score: number;
  score_category: "high_priority" | "medium_priority" | "low_priority" | "unqualified";
  detailed_breakdown: Record<string, any>;
  reasoning: string;
  created_at: string;
}

export interface GeneratedEmail {
  id: number;
  prospect_id: number;
  product_id: number;
  company_id: number;
  sequence_step: number;
  subject_line: string;
  email_body: string;
  hook_opening?: string;
  value_proposition?: string;
  call_to_action?: string;
  status: "draft" | "approved" | "sent" | "rejected";
  model_used: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationReply {
  id: number;
  prospect_id: number;
  product_id: number;
  company_id: number;
  inbound_message: string;
  classification: "interested" | "not_interested" | "objection" | "follow_up_required" | "meeting_requested";
  confidence: number;
  detected_sentiment: "positive" | "neutral" | "negative" | "cautious";
  detected_objections: string[];
  explanation: string;
  suggested_response?: string;
  created_at: string;
}

export interface ModelExecutionLog {
  id: number;
  workflow_name: string;
  model_name: string;
  prompt_preview?: string;
  response_preview?: string;
  execution_time_ms: number;
  token_estimate: number;
  status: "success" | "queued" | "error";
  is_offline: boolean;
  error_message?: string;
  created_at: string;
}

export interface TaskQueue {
  id: number;
  workflow_name: string;
  entity_type: string;
  entity_id: number;
  status: "pending" | "processing" | "completed" | "failed";
  attempts: number;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface SystemHealth {
  status: string;
  ollama_connected: boolean;
  ollama_url: string;
  active_model: string;
  available_models: string[];
  offline_mode: boolean;
  pending_tasks_count: number;
  environment: string;
}

export interface SupportedModel {
  id: string;
  name: string;
  parameters: string;
  download_size_gb: number;
  min_ram_gb: number;
  license: string;
  best_for: string;
  recommended: boolean;
}

export interface HardwareProfile {
  os: string;
  os_release: string;
  cpu_model: string;
  cpu_cores: number;
  total_ram_gb: number;
  available_ram_gb: number;
  gpu_name: string;
  gpu_vram_mb?: number;
  free_disk_gb: number;
  hardware_tier: string;
  recommended_model: string;
  recommended_config: Record<string, any>;
  supported_models: SupportedModel[];
}

export type ViewType =
  | "overview"
  | "companies"
  | "products"
  | "hardware"
  | "icp"
  | "discovery"
  | "research"
  | "signals"
  | "problems"
  | "scoring"
  | "emails"
  | "replies"
  | "history"
  | "logs"
  | "settings";
