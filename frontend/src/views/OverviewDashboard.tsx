import React, { useEffect, useState } from "react";
import {
  Users,
  Target,
  Mail,
  Zap,
  TrendingUp,
  Cpu,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { MetricCard } from "../components/MetricCard";
import { StatusBadge } from "../components/StatusBadge";
import { Prospect, ModelExecutionLog } from "../types";

export const OverviewDashboard: React.FC = () => {
  const { activeCompany, activeProduct, setActiveView, health, hardware } = useApp();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [recentLogs, setRecentLogs] = useState<ModelExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeCompany) {
      setLoading(true);
      Promise.all([
        api.getProspects({ companyId: activeCompany.id }),
        api.getLogs(6),
      ])
        .then(([pList, logs]) => {
          setProspects(pList);
          setRecentLogs(logs);
        })
        .finally(() => setLoading(false));
    }
  }, [activeCompany?.id]);

  const highPriorityCount = prospects.filter((p) => p.overall_score >= 80).length;
  const qualifiedCount = prospects.filter((p) => ["qualified", "contacted", "replied"].includes(p.status)).length;
  const avgScore = prospects.length > 0
    ? Math.round(prospects.reduce((acc, p) => acc + p.overall_score, 0) / prospects.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-900/40 bg-gradient-to-r from-brand-950/40 via-slate-900/80 to-slate-900/90 p-6 backdrop-blur">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/40 border border-brand-700/50 text-brand-300 text-xs font-mono mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Multi-Product Local AI Sales Agent</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {activeCompany ? activeCompany.name : "Select an Organization"}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {activeCompany?.description || "Autonomous zero-cost outbound pipeline running entirely on local open-weight AI inference."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView("discovery")}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 flex items-center gap-2 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>Manage Prospects</span>
            </button>
            <button
              onClick={() => setActiveView("icp")}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all"
            >
              <Target className="w-4 h-4" />
              <span>Product ICP</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Target Prospects"
          value={prospects.length}
          subtitle={`Under ${activeCompany?.name || "active company"}`}
          icon={<Users className="w-5 h-5 text-brand-400" />}
          variant="brand"
        />
        <MetricCard
          title="High-Priority Accounts"
          value={highPriorityCount}
          subtitle="Score >= 80/100"
          icon={<Zap className="w-5 h-5 text-emerald-400" />}
          variant="emerald"
        />
        <MetricCard
          title="Qualified & Active"
          value={qualifiedCount}
          subtitle="Researched & ready for outreach"
          icon={<CheckCircle className="w-5 h-5 text-brand-400" />}
        />
        <MetricCard
          title="Average Account Fit"
          value={`${avgScore}/100`}
          subtitle="ICP & signal alignment"
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          variant="amber"
        />
      </div>

      {/* Two Column Layout: Top Ranked Prospects & Model Audit Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Top Scored Prospects */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white tracking-tight">Prioritized Accounts</h3>
                <p className="text-xs text-slate-400 mt-0.5">Top-ranked accounts evaluated against {activeProduct?.name || "current product"}</p>
              </div>
              <button
                onClick={() => setActiveView("scoring")}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
              >
                <span>View All Scoring</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500 text-xs">Loading accounts...</div>
            ) : prospects.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">No prospects found for this company.</div>
            ) : (
              <div className="divide-y divide-slate-800/80">
                {prospects.slice(0, 5).map((p) => (
                  <div key={p.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-lg transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-100">{p.company_name}</span>
                        {p.is_sample && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 font-mono">
                            Sample
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>{p.industry || "B2B"}</span>
                        <span>•</span>
                        <span>{p.contact_name || "Decision Maker"} ({p.contact_role || "Executive"})</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono text-emerald-400">{p.overall_score}/100</div>
                        <div className="text-[10px] text-slate-500 font-mono">Priority</div>
                      </div>
                      <StatusBadge status={p.status} size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Local AI Audit & Hardware Summary */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white tracking-tight">Local AI Engine</h3>
              <button
                onClick={() => setActiveView("logs")}
                className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium"
              >
                <span>Full Logs</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Local Model Status Box */}
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 mb-4 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Inference Host:</span>
                <span className="text-slate-200">{health?.ollama_url || "127.0.0.1:11434"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Active Model:</span>
                <span className="text-emerald-400 font-bold">{health?.active_model}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Hardware Tier:</span>
                <span className="text-brand-300">{hardware?.hardware_tier || "Standard Laptop"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">API Cost / Request:</span>
                <span className="text-emerald-400 font-bold">$0.00 (Zero Cost)</span>
              </div>
            </div>

            {/* Recent Executions */}
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Recent Local Inferences</div>
            <div className="space-y-2">
              {recentLogs.slice(0, 4).map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-800/40 border border-slate-800 text-xs">
                  <div className="flex items-center justify-between font-mono">
                    <span className="font-semibold text-slate-300">{log.workflow_name.replace(/_/g, " ")}</span>
                    <span className="text-emerald-400 text-[11px]">{log.execution_time_ms}ms</span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-1">{log.prompt_preview || "Deterministic local inference"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
