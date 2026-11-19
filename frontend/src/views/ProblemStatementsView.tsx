import React, { useEffect, useState } from "react";
import { HelpCircle, Sparkles, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Prospect, ProblemStatement } from "../types";

export const ProblemStatementsView: React.FC = () => {
  const { activeCompany, activeProduct, addToast } = useApp();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [problems, setProblems] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      api.getProspects({ companyId: activeCompany.id }).then((data) => {
        setProspects(data);
        if (data.length > 0) setSelectedProspect(data[0]);
      });
    }
  }, [activeCompany?.id]);

  const loadProblems = async () => {
    if (!selectedProspect) return;
    setLoading(true);
    try {
      const data = await api.getProspectProblems(selectedProspect.id);
      setProblems(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProblems();
  }, [selectedProspect?.id]);

  const handleGenerate = async () => {
    if (!selectedProspect || !activeProduct) return;
    setIsGenerating(true);
    try {
      const res = await api.generateProblems(selectedProspect.id, activeProduct.id);
      setProblems(res.problems);
      await loadProblems();
      addToast(`Synthesized ${res.problems_count} problem statements for ${selectedProspect.company_name}!`, "success");
    } catch (err: any) {
      addToast(`Problem generation failed: ${err.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Problem Statement Generation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Workflow 5: Maps identified prospect pain points to specific <span className="text-emerald-400 font-semibold">{activeProduct?.name}</span> capabilities with clear causal logic.
          </p>
        </div>

        {/* Prospect Selector & Action */}
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
            onClick={handleGenerate}
            disabled={!selectedProspect || !activeProduct || isGenerating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
            <span>{isGenerating ? "Synthesizing Problems..." : "Generate Problem Statements"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading problem statements...</div>
      ) : problems.length > 0 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {problems.map((prob) => (
              <div
                key={prob.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full font-bold border ${
                        prob.severity === "high"
                          ? "bg-rose-950/80 text-rose-400 border-rose-800"
                          : "bg-amber-950/80 text-amber-400 border-amber-800"
                      }`}
                    >
                      {prob.severity} Severity Bottleneck
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Product: {activeProduct?.name}</span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-tight">{prob.problem_title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1.5">{prob.problem_description}</p>

                  {/* Solution Connection Box */}
                  <div className="mt-4 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/50 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>How {activeProduct?.name} Resolves This</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{prob.connection_to_product}</p>
                  </div>

                  {/* Causal Reasoning */}
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-400">
                    <span className="text-slate-500 font-semibold uppercase text-[10px] block mb-0.5">Underlying Reasoning</span>
                    <p className="text-slate-300 leading-relaxed">{prob.reasoning}</p>
                  </div>
                </div>

                {/* Suggested Talk Track Pitch */}
                {prob.suggested_solution_pitch && (
                  <div className="pt-3 border-t border-slate-800 text-xs">
                    <span className="text-[10px] font-semibold text-brand-400 uppercase tracking-wider block mb-1">
                      Suggested Rep Talk-Track
                    </span>
                    <div className="p-2.5 rounded-lg bg-brand-950/30 border border-brand-900/40 text-brand-200 italic font-sans text-xs">
                      "{prob.suggested_solution_pitch}"
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs space-y-2">
          <div>No problem statements synthesized yet for {selectedProspect?.company_name}.</div>
          <button onClick={handleGenerate} className="text-rose-400 hover:text-rose-300 font-semibold">
            Synthesize problems now
          </button>
        </div>
      )}
    </div>
  );
};
