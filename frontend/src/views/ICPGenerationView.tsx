import React, { useEffect, useState } from "react";
import { Target, Sparkles, Building2, Users, MapPin, AlertCircle, Zap, ShieldAlert, Quote } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { ICPProfile } from "../types";

export const ICPGenerationView: React.FC = () => {
  const { activeProduct, activeCompany, addToast } = useApp();
  const [icp, setIcp] = useState<ICPProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [guidelines, setGuidelines] = useState("");

  const loadICP = async () => {
    if (!activeProduct) return;
    setLoading(true);
    try {
      const data = await api.getProductICP(activeProduct.id);
      setIcp(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadICP();
  }, [activeProduct?.id]);

  const handleGenerate = async () => {
    if (!activeProduct) return;
    setIsGenerating(true);
    try {
      const res = await api.generateProductICP(activeProduct.id, guidelines);
      setIcp(res.icp);
      await loadICP();
      addToast(`Generated Product ICP for ${activeProduct.name}!`, "success");
    } catch (err: any) {
      addToast(`ICP Generation failed: ${err.message}`, "error");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">Product-Specific ICP Engine</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono border border-emerald-800">
              {activeProduct?.name || "No Product"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Workflow 2: Generates separate, tailored Ideal Customer Profiles for each product under {activeCompany?.name}.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!activeProduct || isGenerating}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all self-start sm:self-auto"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
          <span>{isGenerating ? "Synthesizing with Local Model..." : "Generate ICP Profile (Workflow 2)"}</span>
        </button>
      </div>

      {/* Strategic Guidelines Input */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50 backdrop-blur">
        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
          Custom Strategic Guidance (Optional)
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={guidelines}
            onChange={(e) => setGuidelines(e.target.value)}
            placeholder="e.g. Focus on Series B+ fintech startups with dedicated SRE teams in Western Europe..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading ICP details...</div>
      ) : icp ? (
        <div className="space-y-6">
          {/* Pitch Angle Banner */}
          {icp.pitch_angle && (
            <div className="p-4 rounded-xl border border-brand-800/80 bg-brand-950/20 text-xs flex items-start gap-3">
              <Quote className="w-5 h-5 text-brand-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-brand-300 uppercase tracking-wider text-[10px] block mb-0.5">
                  Recommended Sales Pitch Angle
                </span>
                <p className="text-slate-100 italic leading-relaxed text-sm">{icp.pitch_angle}</p>
              </div>
            </div>
          )}

          {/* ICP Matrix Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Target Industries */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-brand-400" />
                <span>Target Industries</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {icp.target_industries?.map((ind, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                    <span>{ind}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Decision Makers */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Decision-Maker Roles</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {icp.decision_maker_roles?.map((role, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{role}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Sizes & Geographies */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                  <MapPin className="w-4 h-4 text-amber-400" />
                  <span>Target Geographies</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {icp.target_geographies?.map((geo, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                      {geo}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Company Sizes</div>
                <div className="flex flex-wrap gap-1.5">
                  {icp.company_sizes?.map((sz, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono">
                      {sz}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Core Pain Points */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-3 md:col-span-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 text-rose-400" />
                <span>Acute Pain Points Solved</span>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                {icp.core_pain_points?.map((pain, i) => (
                  <li key={i} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                    <span className="text-rose-400 font-bold">•</span>
                    <span className="leading-snug">{pain}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Buying Triggers & Disqualifiers */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Urgent Buying Triggers</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {icp.buying_triggers?.map((trig, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">•</span>
                      <span>{trig}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider mb-2">
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                  <span>Disqualifiers</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {icp.disqualifiers?.map((dis, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-slate-500 font-bold">✕</span>
                      <span>{dis}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs">
          No ICP profile has been generated yet for {activeProduct?.name}. Click "Generate ICP Profile" above to synthesize one.
        </div>
      )}
    </div>
  );
};
