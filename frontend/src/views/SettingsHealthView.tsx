import React, { useEffect, useState } from "react";
import { Settings, ShieldCheck, Wifi, WifiOff, Server, Database, RotateCw, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";
import { TaskQueue } from "../types";

export const SettingsHealthView: React.FC = () => {
  const { health, hardware, toggleOffline, addToast } = useApp();
  const [queueTasks, setQueueTasks] = useState<TaskQueue[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);

  const fetchQueue = async () => {
    setLoadingQueue(true);
    try {
      const data = await api.getQueue();
      setQueueTasks(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingQueue(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">System Settings & Health Diagnostics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Monitor zero-cost local architecture compliance, manage offline task queues, and verify infrastructure health.
        </p>
      </div>

      {/* Zero Cost Compliance Banner */}
      <div className="p-6 rounded-2xl border border-emerald-800/80 bg-emerald-950/20 backdrop-blur space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Strict Zero-Cost Local AI Policy Enforced</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
          This installation of Harvey Local Sales Agent is certified zero-cost. Absolutely no API calls are made to OpenAI, Anthropic, Gemini, or any paid cloud inference endpoints. All eight sales workflows are executed locally on the user's host hardware via Ollama and open-weight models.
        </p>
        <div className="flex flex-wrap gap-2 pt-1 font-mono text-[11px]">
          <span className="px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300">
            ✓ 0 Cloud LLM API Keys
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300">
            ✓ 0 Paid Inference Endpoints
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-950 border border-emerald-800 text-emerald-300">
            ✓ Permissive Apache-2.0 / MIT Model Weights
          </span>
        </div>
      </div>

      {/* Grid: Network / Offline Settings & Ollama Connection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Offline Mode Guardrail */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              {health?.offline_mode ? (
                <WifiOff className="w-4 h-4 text-amber-400" />
              ) : (
                <Wifi className="w-4 h-4 text-emerald-400" />
              )}
              <h3 className="text-sm font-bold text-white tracking-tight">Offline Mode Toggle</h3>
            </div>
            <button
              onClick={() => toggleOffline(!health?.offline_mode)}
              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-semibold border transition-all ${
                health?.offline_mode
                  ? "bg-amber-600 text-white border-amber-500"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:text-white"
              }`}
            >
              {health?.offline_mode ? "Disable Offline" : "Enable Offline"}
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            When enabled, all outbound web requests are completely severed. Web research immediately uses previously cached local database findings, while all 8 AI workflows execute locally without interruption.
          </p>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono">
            <span className="text-slate-500 block text-[10px] uppercase">Status</span>
            <span className={health?.offline_mode ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
              {health?.offline_mode ? "Strict Disconnected Mode Active" : "Online Mode (Permitted Public Web Scrapes Allowed)"}
            </span>
          </div>
        </div>

        {/* Local Ollama Telemetry */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">Ollama Local Daemon</h3>
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                health?.ollama_connected
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                  : "bg-amber-950 text-amber-400 border-amber-800"
              }`}
            >
              {health?.ollama_connected ? "Connected" : "Offline / Task Queue"}
            </span>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Service Endpoint:</span>
              <span>{health?.ollama_url}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Default Model:</span>
              <span className="text-emerald-400 font-bold">{health?.active_model}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Fallback Strategy:</span>
              <span>Deterministic Preview & Task Queue</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Installed Models:</span>
              <span>{health?.available_models.length || 0} models detected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Task Queue Management */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Offline Task Queue ({queueTasks.length} pending)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tasks created while Ollama was unreachable are securely persisted in SQLite.
            </p>
          </div>

          <button
            onClick={fetchQueue}
            disabled={loadingQueue}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loadingQueue ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {queueTasks.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            Queue is empty. No deferred tasks waiting for local model processing.
          </div>
        ) : (
          <div className="space-y-2">
            {queueTasks.slice(0, 5).map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs font-mono flex items-center justify-between"
              >
                <div>
                  <span className="text-white font-bold">{t.workflow_name}</span>
                  <span className="text-slate-500 ml-2">({t.entity_type} #{t.entity_id})</span>
                  <div className="text-[10px] text-amber-400 mt-0.5">{t.error_message}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {t.status}
                  </span>
                  <div className="text-[10px] text-slate-500 mt-1">{new Date(t.created_at).toLocaleTimeString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
