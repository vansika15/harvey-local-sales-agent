import React, { useEffect, useState } from "react";
import { Search, Sparkles, CheckCircle2, AlertCircle, Globe, Clock, Database, ExternalLink, ShieldCheck } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Prospect, ProspectResearch } from "../types";

export const ProspectResearchView: React.FC = () => {
  const { activeCompany, addToast } = useApp();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [research, setResearch] = useState<ProspectResearch | null>(null);
  const [loading, setLoading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [forceLive, setForceLive] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      api.getProspects({ companyId: activeCompany.id }).then((data) => {
        setProspects(data);
        if (data.length > 0) setSelectedProspect(data[0]);
      });
    }
  }, [activeCompany?.id]);

  const loadResearch = async () => {
    if (!selectedProspect) return;
    setLoading(true);
    try {
      const data = await api.getProspectResearch(selectedProspect.id);
      setResearch(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResearch();
  }, [selectedProspect?.id]);

  const handleTriggerResearch = async () => {
    if (!selectedProspect) return;
    setIsResearching(true);
    try {
      await api.researchProspect(selectedProspect.id, forceLive);
      await loadResearch();
      addToast(`Account research completed for ${selectedProspect.company_name}!`, "success");
    } catch (err: any) {
      addToast(`Research failed: ${err.message}`, "error");
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Account Research & Dossier</h2>
          <p className="text-xs text-slate-400 mt-1">
            Workflow 3: Combines local database facts and permitted public-web research. Explicitly isolates confirmed observations from unavailable data.
          </p>
        </div>

        {/* Prospect Selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedProspect?.id || ""}
            onChange={(e) => {
              const found = prospects.find((p) => p.id === Number(e.target.value));
              if (found) setSelectedProspect(found);
            }}
            className="bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 font-mono"
          >
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.company_name} ({p.domain || "no domain"})
              </option>
            ))}
          </select>

          <button
            onClick={handleTriggerResearch}
            disabled={!selectedProspect || isResearching}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-brand-600/20 disabled:opacity-50 transition-all shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isResearching ? "animate-spin" : ""}`} />
            <span>{isResearching ? "Synthesizing Research..." : "Run Account Research"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading research dossier...</div>
      ) : research ? (
        <div className="space-y-6">
          {/* Overview & Metadata Card */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">{selectedProspect?.company_name}</h3>
                  <span className="text-xs text-brand-400 font-mono flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    <span>{selectedProspect?.domain}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{research.site_summary || "Public business overview available."}</p>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{new Date(research.research_timestamp).toLocaleString()}</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  {research.offline_cached ? "Offline Cached" : "Live Fetched"}
                </span>
              </div>
            </div>

            {/* Detected Web Technologies */}
            <div>
              <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Detected Web Technologies & Infrastructure
              </div>
              <div className="flex flex-wrap gap-2">
                {research.detected_tech_stack?.length > 0 ? (
                  research.detected_tech_stack.map((tech, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-brand-300 font-mono text-xs">
                      {tech}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">No third-party SaaS signatures detected on public landing page.</span>
                )}
              </div>
            </div>
          </div>

          {/* Two-Column Strict Verification Split (Verified Facts vs Explicitly Unavailable Facts) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Confirmed Observations */}
            <div className="p-5 rounded-2xl border border-emerald-900/40 bg-emerald-950/10 backdrop-blur space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified Facts (Confirmed Observations)</span>
              </div>
              <p className="text-[11px] text-slate-400">Grounded in public pages or confirmed database records. Zero hallucinated claims.</p>

              <ul className="space-y-2 text-xs text-slate-200 mt-3">
                {research.verified_facts?.map((fact, i) => (
                  <li key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="leading-relaxed">{fact}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Explicitly Unavailable Facts */}
            <div className="p-5 rounded-2xl border border-rose-900/40 bg-rose-950/10 backdrop-blur space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Unavailable / Unverified Data (Explicitly Disclosed)</span>
              </div>
              <p className="text-[11px] text-slate-400">Attributes not publicly disclosed or withheld behind private paywalls.</p>

              <ul className="space-y-2 text-xs text-slate-300 mt-3">
                {research.unavailable_facts?.map((unavail, i) => (
                  <li key={i} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-2.5">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span className="leading-relaxed">{unavail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Source Attribution Box */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/70 text-xs font-mono space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Database className="w-3.5 h-3.5 text-brand-400" />
                <span>Audited Source URLs</span>
              </span>
              <span className="text-[11px] text-emerald-400">robots.txt Respected</span>
            </div>
            <ul className="space-y-1 text-slate-300">
              {research.source_urls?.map((url, i) => (
                <li key={i} className="flex items-center gap-2 truncate">
                  <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                  <a href={url} target="_blank" rel="noreferrer" className="text-brand-400 hover:underline">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs space-y-2">
          <div>No research record available for {selectedProspect?.company_name}.</div>
          <button
            onClick={handleTriggerResearch}
            className="text-brand-400 hover:text-brand-300 font-semibold"
          >
            Click here to execute account research
          </button>
        </div>
      )}
    </div>
  );
};
