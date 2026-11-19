import {
  Company, Product, ICPProfile, Prospect, ProspectResearch,
  BuyingSignal, ProblemStatement, ProspectScore, GeneratedEmail,
  ConversationReply, ModelExecutionLog, TaskQueue, SystemHealth,
  HardwareProfile
} from "../types";

const API_BASE = "/api";

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let errorDetail = "API request failed";
    try {
      const errorJson = await res.json();
      errorDetail = errorJson.detail || errorJson.error || errorDetail;
    } catch {
      errorDetail = `HTTP ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorDetail);
  }

  if (res.status === 204) {
    return {} as T;
  }

  return res.json();
}

export const api = {
  // System
  getHealth: () => request<SystemHealth>("/system/health"),
  getHardware: () => request<HardwareProfile>("/system/hardware"),
  getLogs: (limit = 50) => request<ModelExecutionLog[]>(`/system/logs?limit=${limit}`),
  getQueue: () => request<TaskQueue[]>("/system/queue"),
  toggleOffline: (enabled: boolean) =>
    request<{ offline_mode: boolean; message: string }>(`/system/toggle-offline?enabled=${enabled}`, {
      method: "POST",
    }),

  // Companies
  getCompanies: () => request<Company[]>("/companies"),
  getCompany: (id: number) => request<Company>(`/companies/${id}`),
  createCompany: (data: Partial<Company>) =>
    request<Company>("/companies", { method: "POST", body: JSON.stringify(data) }),
  updateCompany: (id: number, data: Partial<Company>) =>
    request<Company>(`/companies/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCompany: (id: number) => request<void>(`/companies/${id}`, { method: "DELETE" }),
  generateBusinessProfile: (companyId: number, businessNotes?: string, modelOverride?: string) =>
    request<{ company_id: number; profile: any; model_used: string; is_deterministic_preview: boolean }>(
      `/companies/${companyId}/generate-profile`,
      {
        method: "POST",
        body: JSON.stringify({ business_notes: businessNotes, model_override: modelOverride }),
      }
    ),

  // Products & ICP
  getProducts: (companyId?: number) =>
    request<Product[]>(companyId ? `/products?company_id=${companyId}` : "/products"),
  getProduct: (id: number) => request<Product>(`/products/${id}`),
  createProduct: (data: Partial<Product>) =>
    request<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: number, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteProduct: (id: number) => request<void>(`/products/${id}`, { method: "DELETE" }),
  getProductICP: (productId: number) => request<ICPProfile | null>(`/products/${productId}/icp`),
  generateProductICP: (productId: number, additionalGuidelines?: string, modelOverride?: string) =>
    request<{ product_id: number; icp: any; model_used: string; is_deterministic_preview: boolean }>(
      `/products/${productId}/generate-icp`,
      {
        method: "POST",
        body: JSON.stringify({ additional_guidelines: additionalGuidelines, model_override: modelOverride }),
      }
    ),

  // Prospects & Sales Workflows
  getProspects: (params?: { companyId?: number; productId?: number; status?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.companyId) q.append("company_id", params.companyId.toString());
    if (params?.productId) q.append("product_id", params.productId.toString());
    if (params?.status) q.append("status_filter", params.status);
    if (params?.search) q.append("search", params.search);
    return request<Prospect[]>(`/prospects?${q.toString()}`);
  },
  getProspect: (id: number) => request<Prospect>(`/prospects/${id}`),
  createProspect: (data: Partial<Prospect>) =>
    request<Prospect>("/prospects", { method: "POST", body: JSON.stringify(data) }),
  deleteProspect: (id: number) => request<void>(`/prospects/${id}`, { method: "DELETE" }),

  importCSV: async (companyId: number, file: File) => {
    const formData = new FormData();
    formData.append("company_id", companyId.toString());
    formData.append("file", file);

    const res = await fetch(`${API_BASE}/prospects/import-csv`, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) throw new Error("CSV Upload failed");
    return res.json();
  },

  // Workflow 3: Prospect Research
  researchProspect: (prospectId: number, forceLiveScrape = false, modelOverride?: string) =>
    request<{
      prospect_id: number;
      site_summary: string;
      verified_facts: string[];
      unavailable_facts: string[];
      model_used: string;
      is_deterministic_preview: boolean;
    }>(`/prospects/${prospectId}/research`, {
      method: "POST",
      body: JSON.stringify({ force_live_scrape: forceLiveScrape, model_override: modelOverride }),
    }),
  getProspectResearch: (prospectId: number) =>
    request<ProspectResearch | null>(`/prospects/${prospectId}/research`),

  // Workflow 4: Buying Signals
  classifySignals: (prospectId: number, productId?: number, modelOverride?: string) =>
    request<{
      prospect_id: number;
      signals_count: number;
      signals: BuyingSignal[];
      model_used: string;
      is_deterministic_preview: boolean;
    }>(`/prospects/${prospectId}/classify-signals`, {
      method: "POST",
      body: JSON.stringify({ model_override: modelOverride }),
    }),
  getProspectSignals: (prospectId: number) =>
    request<BuyingSignal[]>(`/prospects/${prospectId}/signals`),

  // Workflow 5: Problem Statements
  generateProblems: (prospectId: number, productId: number, modelOverride?: string) =>
    request<{
      prospect_id: number;
      problems_count: number;
      problems: ProblemStatement[];
      model_used: string;
      is_deterministic_preview: boolean;
    }>(`/prospects/${prospectId}/generate-problems`, {
      method: "POST",
      body: JSON.stringify({ product_id: productId, model_override: modelOverride }),
    }),
  getProspectProblems: (prospectId: number) =>
    request<ProblemStatement[]>(`/prospects/${prospectId}/problems`),

  // Workflow 6: Email Generation
  generateEmail: (prospectId: number, productId: number, sequenceStep = 1, tone?: string, modelOverride?: string) =>
    request<{
      email_id: number;
      subject_line: string;
      email_body: string;
      hook_opening: string;
      value_proposition: string;
      call_to_action: string;
      model_used: string;
      is_deterministic_preview: boolean;
    }>(`/prospects/${prospectId}/generate-email`, {
      method: "POST",
      body: JSON.stringify({ product_id: productId, sequence_step: sequenceStep, tone, model_override: modelOverride }),
    }),
  getProspectEmails: (prospectId: number) =>
    request<GeneratedEmail[]>(`/prospects/${prospectId}/emails`),

  // Workflow 7: Prospect Scoring
  scoreProspect: (prospectId: number, productId: number, modelOverride?: string) =>
    request<{
      prospect_id: number;
      overall_score: number;
      score_category: string;
      fit_score: number;
      signal_score: number;
      reachability_score: number;
      breakdown: any;
      reasoning: string;
      model_used: string;
      is_deterministic_preview: boolean;
    }>(`/prospects/${prospectId}/score`, {
      method: "POST",
      body: JSON.stringify({ product_id: productId, model_override: modelOverride }),
    }),

  // Workflow 8: Reply Classification
  classifyReply: (inboundMessage: string, prospectId: number, productId: number, modelOverride?: string) =>
    request<{
      reply_id: number;
      classification: string;
      confidence: number;
      detected_sentiment: string;
      detected_objections: string[];
      explanation: string;
      suggested_response?: string;
      model_used: string;
      is_deterministic_preview: boolean;
    }>("/replies/classify", {
      method: "POST",
      body: JSON.stringify({
        inbound_message: inboundMessage,
        prospect_id: prospectId,
        product_id: productId,
        model_override: modelOverride,
      }),
    }),
  getReplies: (companyId?: number, productId?: number, prospectId?: number) => {
    const q = new URLSearchParams();
    if (companyId) q.append("company_id", companyId.toString());
    if (productId) q.append("product_id", productId.toString());
    if (prospectId) q.append("prospect_id", prospectId.toString());
    return request<ConversationReply[]>(`/replies?${q.toString()}`);
  },

  // Seed / Reset
  loadSampleData: (forceReset = false) =>
    request<{ status: string; message: string }>(`/seed/load-sample-data?force_reset=${forceReset}`, {
      method: "POST",
    }),
};
