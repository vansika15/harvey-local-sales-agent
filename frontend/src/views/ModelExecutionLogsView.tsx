import React, { useEffect, useState } from "react";
import { Terminal, Clock, ShieldCheck, RotateCw, Filter, AlertCircle, CheckCircle2 } from "lucide-react";
import { api } from "../api/client";
import { ModelExecutionLog } from "../types";

export const ModelExecutionLogsView: React.FC = () => {
  const [logs, setLogs] = useState<ModelExecutionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ModelExecutionLog | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs(100);
      setLogs(data);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Model Execution Logs & Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete telemetry of local model executions, inference latencies, prompt previews, and offline failover states.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={loading}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition-all self-start sm:self-auto font-mono"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Audit Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs">Loading execution logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">No model executions logged yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="py-3 px-4 font-semibold">Workflow</th>
                  <th className="py-3 px-4 font-semibold">Local Model</th>
                  <th className="py-3 px-4 font-semibold">Latency</th>
                  <th className="py-3 px-4 font-semibold">Tokens</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Execution Mode</th>
                  <th className="py-3 px-4 font-semibold text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 font-bold text-slate-200">
                      {log.workflow_name.replace(/_/g, " ")}
                    </td>

                    <td className="py-3 px-4 text-emerald-400 font-semibold truncate max-w-xs">
                      {log.model_name}
                    </td>

                    <td className="py-3 px-4 text-slate-300">
                      {log.execution_time_ms} ms
                    </td>

                    <td className="py-3 px-4 text-slate-400">
                      {log.token_estimate} tokens
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          log.status === "success"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : log.status === "queued"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {log.status === "success" && <CheckCircle2 className="w-3 h-3" />}
                        {log.status === "queued" && <Clock className="w-3 h-3" />}
                        {log.status === "error" && <AlertCircle className="w-3 h-3" />}
                        <span>{log.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {log.is_offline ? (
                        <span className="text-amber-400 font-medium">Offline / Queue</span>
                      ) : (
                        <span className="text-slate-400">Local Inference</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Selected Log Inspector */}
      {selectedLog && (
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white tracking-tight">
              Log Inspector: {selectedLog.workflow_name} (ID #{selectedLog.id})
            </h3>
            <button
              onClick={() => setSelectedLog(null)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                Prompt Sent
              </span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedLog.prompt_preview || "N/A"}
              </pre>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-1">
                Response Received / Fallback Output
              </span>
              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-emerald-300 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedLog.response_preview || selectedLog.error_message || "N/A"}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
