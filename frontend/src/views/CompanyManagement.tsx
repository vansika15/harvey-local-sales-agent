import React, { useState } from "react";
import { Building2, Plus, Sparkles, Globe, Trash2, Edit3, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Modal } from "../components/Modal";
import { Company } from "../types";

export const CompanyManagement: React.FC = () => {
  const { companies, activeCompany, setActiveCompany, refreshData, addToast } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [industry, setIndustry] = useState("");
  const [size, setSize] = useState("50-200 employees");
  const [description, setDescription] = useState("");
  const [targetMarket, setTargetMarket] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await api.createCompany({
        name,
        domain,
        industry,
        size,
        description,
        target_market: targetMarket,
        raw_business_notes: notes,
      });
      await refreshData();
      setActiveCompany(created);
      setIsModalOpen(false);
      addToast(`Company '${created.name}' created successfully!`, "success");
      // Reset form
      setName("");
      setDomain("");
      setDescription("");
      setNotes("");
    } catch (err: any) {
      addToast(`Failed to create company: ${err.message}`, "error");
    }
  };

  const handleGenerateProfile = async () => {
    if (!activeCompany) return;
    setIsGenerating(true);
    try {
      const res = await api.generateBusinessProfile(activeCompany.id, activeCompany.raw_business_notes);
      await refreshData();
      addToast(`Business Profile generated via ${res.model_used}!`, "success");
    } catch (err: any) {
      addToast(`Profile generation failed: ${err.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: number, compName: string) => {
    if (!confirm(`Are you sure you want to delete ${compName} and all associated products?`)) return;
    try {
      await api.deleteCompany(id);
      await refreshData();
      addToast(`Deleted ${compName}`, "info");
    } catch (err: any) {
      addToast(`Delete failed: ${err.message}`, "error");
    }
  };

  let parsedProfile: any = null;
  if (activeCompany?.generated_profile) {
    try {
      parsedProfile = JSON.parse(activeCompany.generated_profile);
    } catch {}
  }

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Organization & Business Profiles</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage multi-tenant company intelligence. Each company maintains isolated products, ICPs, and prospects.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Organization</span>
        </button>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((c) => (
          <div
            key={c.id}
            onClick={() => setActiveCompany(c)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
              activeCompany?.id === c.id
                ? "bg-brand-950/20 border-brand-500/60 shadow-lg shadow-brand-500/5 ring-1 ring-brand-500/30"
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-800 text-brand-400 border border-slate-700">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm tracking-tight">{c.name}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Globe className="w-3 h-3" />
                      <span>{c.domain || "no domain"}</span>
                    </div>
                  </div>
                </div>
                {c.is_sample && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                    Sample
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                {c.description || "No description provided."}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono">{c.size || "Mid-market"}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.id, c.name);
                  }}
                  className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Company Detail & AI Profile Card */}
      {activeCompany && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">{activeCompany.name} Profile Dossier</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-brand-400 font-mono border border-slate-700">
                  {activeCompany.industry || "General Industry"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Generated and stored in local SQLite database.</p>
            </div>
            <button
              onClick={handleGenerateProfile}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-600 hover:from-brand-500 hover:to-emerald-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-600/20 disabled:opacity-50 transition-all self-start md:self-auto"
            >
              <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              <span>{isGenerating ? "Synthesizing with Local Model..." : "Generate AI Business Profile (Workflow 1)"}</span>
            </button>
          </div>

          {/* Profile Content */}
          {parsedProfile ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Vertical & Model</div>
                  <div className="text-sm font-medium text-white">{parsedProfile.industry_vertical}</div>
                  <div className="text-xs text-brand-400 mt-1">{parsedProfile.business_model}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Core Value Proposition</div>
                  <p className="text-sm text-slate-200 leading-relaxed">{parsedProfile.core_value_proposition}</p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Target Market Summary</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{parsedProfile.target_market}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Key Differentiators</div>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {parsedProfile.key_differentiators?.map((diff: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{diff}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Strategic Outbound Context</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{parsedProfile.sales_context}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-sm">
              No business profile generated yet. Click "Generate AI Business Profile" above to synthesize an executive profile using local open-weight AI.
            </div>
          )}
        </div>
      )}

      {/* Create Company Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Organization">
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-300 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Quantum Dynamics"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-300 mb-1">Domain</label>
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="apexquantum.io"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-300 mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Cloud Security"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Company Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this company build or offer?"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Target Market</label>
            <input
              type="text"
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              placeholder="e.g. Mid-market CTOs and VP Infrastructure"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-300 mb-1">Raw Business Notes / Context</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste founder notes, product specs, or background details for AI synthesis..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold"
            >
              Save Organization
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
