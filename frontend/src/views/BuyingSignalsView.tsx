import React, { useEffect, useState } from "react";
import { Zap, Sparkles, TrendingUp, Users, Cpu, Rocket, Briefcase, ExternalLink, Calendar } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { Prospect, BuyingSignal } from "../types";

export const BuyingSignalsView: React.FC = () => {
  const { activeCompany, activeProduct, addToast } = useApp();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [signals, setSignals] = useState<BuyingSignal[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);

  useEffect(() => {
    if (activeCompany) {
      api.getProspects({ companyId: activeCompany.id }).then((data) => {
        setProspects(data);
        if (data.length > 0) setSelectedProspect(data[0]);
      });
    }
  }, [activeCompany?.id]);

  const loadSignals = async () => {
    if (!selectedProspect) return;
    setLoading(true);
    try {
      const data = await api.getProspectSignals(selectedProspect.id);
      setSignals(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSignals();
  }, [selectedProspect?.id]);

  const handleClassify = async () => {
    if (!selectedProspect) return;
    setIsClassifying(true);
    try {
      const res = await api.classifySignals(selectedProspect.id, activeProduct?.id);
      setSignals(res.signals);
      await loadSignals();
      addToast(`Classified ${res.signals_count} buying signals for ${selectedProspect.company_name}!`, "success");
    } catch (err: any) {
      addToast(`Signal classification failed: ${err.message}`, "error");
    } finally {
      setIsClassifying(false);
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "hiring":
        return <Users className="w-4 h-4 text-brand-400" />;
      case "expansion":
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case "funding":
        return <Rocket className="w-4 h-4 text-purple-400" />;
      case "tech_change":
        return <Cpu className="w-4 h-4 text-amber-400" />;
      default:
        return <Zap className="w-4 h-4 text-brand-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Buying-Signal Classification</h2>
          <p className="text-xs text-slate-400 mt-1">
            Workflow 4: Detects acute expansion, hiring, and technology triggers and explains actionable sales implications.
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
            onClick={handleClassify}
            disabled={!selectedProspect || isClassifying}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all shrink-0"
          >
            <Sparkles className={`w-4 h-4 ${isClassifying ? "animate-spin" : ""}`} />
            <span>{isClassifying ? "Analyzing Signals..." : "Classify Buying Signals"}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs">Loading detected signals...</div>
      ) : signals.length > 0 ? (
        <div className="space-y-4">
          <div className="text-xs text-slate-400 flex items-center justify-between px-1">
            <span>Detected Signals for <strong className="text-white">{selectedProspect?.company_name}</strong></span>
            <span className="font-mono text-emerald-400 font-semibold">{signals.length} Signals Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {signals.map((sig) => (
              <div
                key={sig.id}
                className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-slate-800 border border-slate-700">
                        {getSignalIcon(sig.signal_type)}
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase tracking-wider">
                        {sig.signal_type.replace(/_/g, " ")}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {Math.round(sig.confidence * 100)}% Conf
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white tracking-tight mb-1.5">{sig.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed mb-3">{sig.description}</p>

                  {sig.detected_value && (
                    <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono text-slate-200 mb-3">
                      <span className="text-slate-500 block text-[10px] uppercase">Telemetry Evidence</span>
                      {sig.detected_value}
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-900/40 text-xs">
                    <span className="text-amber-400 font-semibold block text-[10px] uppercase tracking-wider mb-1">
                      Why It Matters (Sales Rationale)
                    </span>
                    <p className="text-slate-200 leading-relaxed">{sig.sales_implication}</p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>Source: {sig.source_date || "Recent Web Scan"}</span>
                  {sig.source_url && (
                    <a
                      href={sig.source_url.startsWith("http") ? sig.source_url : `https://${sig.source_url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <span>inspect</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-500 text-xs space-y-2">
          <div>No buying signals classified yet for {selectedProspect?.company_name}.</div>
          <button onClick={handleClassify} className="text-amber-400 hover:text-amber-300 font-semibold">
            Run signal classification now
          </button>
        </div>
      )}
    </div>
  );
};
