import React, { useEffect, useState } from "react";
import { BarChart3, Sparkles, TrendingUp, CheckCircle, ShieldAlert, Award, FileText } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { StatusBadge } from "../components/StatusBadge";
import { Prospect } from "../types";

export const ProspectScoringView: React.FC = () => {
  const { activeCompany, activeProduct, addToast } = useApp();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [scoreData, setScoreData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isScoring, setIsScoring] = useState(false);

  const loadProspects = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await api.getProspects({ companyId: activeCompany.id });
      setProspects(data);
      if (data.length > 0) {
        const found = selectedProspect ? data.find((p) => p.id === selectedProspect.id) || data[0] : data[0];
        setSelectedProspect(found);
        if (found.score_breakdown && Object.keys(found.score_breakdown).length > 0) {
          setScoreData({
            overall_score: found.overall_score,
            score_category: found.score_breakdown.score_category || "high_priority",
            breakdown: found.score_breakdown,
            reasoning: found.score_reasoning,
          });
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProspects();
  }, [activeCompany?.id]);

  useEffect(() => {
    if (selectedProspect?.score_breakdown && Object.keys(selectedProspect.score_breakdown).length > 0) {
      setScoreData({
        overall_score: selectedProspect.overall_score,
        score_category: selectedProspect.score_breakdown.score_category || "high_priority",
        breakdown: selectedProspect.score_breakdown,
        reasoning: selectedProspect.score_reasoning,
      });
    } else {
      setScoreData(null);
    }
  }, [selectedProspect?.id]);

  const handleScore = async () => {
    if (!selectedProspect || !activeProduct) return;
    setIsScoring(true);
    try {
      const res = await api.scoreProspect(selectedProspect.id, activeProduct.id);
      setScoreData(res);
      await loadProspects();
      addToast(`Scored ${selectedProspect.company_name}: ${res.overall_score}/100!`, "success");
    } catch (err: any) {
      addToast(`Scoring failed: ${err.message}`, "error");
    } finally {
      setIsScoring(false);
    }
  };

  const bd = scoreData?.breakdown || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Prospect Scoring & Prioritisation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Workflow 7: Transparent qualification algorithm evaluating ICP Fit (40 pts), Signals (40 pts), and Reachability (20 pts).
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
                {p.company_name} ({p.overall_score}/100)
              </option>
            ))}
          </select>

          <button
            onClick={handleScore}
            disabled={!selectedProspect || !activeProduct || isScoring}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-brand-600 hover:from-emerald-500 hover:to-brand-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isScoring ? "animate-spin" : ""}`} />
            <span>{isScoring ? "Computing Score..." : "Calculate Score & Priority"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading score data...</div>
      ) : scoreData ? (
        <div className="space-y-6">
          {/* Main Score Banner */}
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-extrabold font-mono text-emerald-400">
                  {scoreData.overall_score}
                </span>
                <span className="text-xl font-mono text-slate-500">/ 100</span>
                <StatusBadge status={scoreData.score_category} />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {selectedProspect?.company_name} Priority Qualification
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed italic">
                "{scoreData.reasoning || "Strong commercial fit with high-confidence buying momentum."}"
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-2 shrink-0 w-full md:w-64">
              <div className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">Score Summary</div>
              <div className="flex justify-between">
                <span className="text-slate-400">ICP Fit:</span>
                <span className="text-white font-bold">{bd.fit_score || 0} / 40 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Buying Signals:</span>
                <span className="text-emerald-400 font-bold">{bd.signal_score || 0} / 40 pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reachability:</span>
                <span className="text-brand-400 font-bold">{bd.reachability_score || 0} / 20 pts</span>
              </div>
            </div>
          </div>

          {/* Detailed Criteria Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. ICP Fit Breakdown */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">1. ICP Fit Score</span>
                <span className="text-xs font-mono font-bold text-brand-400">{bd.fit_score || 0} / 40</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all"
                  style={{ width: `${((bd.fit_score || 0) / 40) * 100}%` }}
                />
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                {bd.fit_factors?.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-brand-400 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                )) || <li className="text-slate-500 italic">Baseline fit points calculated.</li>}
              </ul>
            </div>

            {/* 2. Signal Score Breakdown */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">2. Commercial Signals</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{bd.signal_score || 0} / 40</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${((bd.signal_score || 0) / 40) * 100}%` }}
                />
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                {bd.signal_factors?.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                )) || <li className="text-slate-500 italic">Signal telemetry points calculated.</li>}
              </ul>
            </div>

            {/* 3. Reachability Score Breakdown */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase tracking-wider">3. Direct Reachability</span>
                <span className="text-xs font-mono font-bold text-purple-400">{bd.reachability_score || 0} / 20</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all"
                  style={{ width: `${((bd.reachability_score || 0) / 20) * 100}%` }}
                />
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-2">
                {bd.reachability_factors?.map((f: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-purple-400 font-bold">•</span>
                    <span>{f}</span>
                  </li>
                )) || <li className="text-slate-500 italic">Contact channels verified.</li>}
              </ul>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs space-y-2">
          <div>No score computed yet for {selectedProspect?.company_name}.</div>
          <button onClick={handleScore} className="text-emerald-400 hover:text-emerald-300 font-semibold">
            Calculate qualification score now
          </button>
        </div>
      )}
    </div>
  );
};
