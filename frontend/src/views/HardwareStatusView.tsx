import React from "react";
import { Cpu, HardDrive, MemoryStick as Memory, Server, CheckCircle2, Shield, Info, Download, AlertTriangle } from "lucide-react";
import { useApp } from "../context/AppContext";

export const HardwareStatusView: React.FC = () => {
  const { hardware, health } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Hardware Awareness & Model Selection</h2>
        <p className="text-xs text-slate-400 mt-1">
          Detects system specifications, profiles available compute resources, and recommends optimal open-weight models.
        </p>
      </div>

      {/* Hardware Telemetry Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        {/* CPU */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Processor (CPU)</span>
            <Cpu className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">{hardware?.cpu_cores} Cores</div>
          <div className="text-[11px] text-slate-400 mt-1 truncate" title={hardware?.cpu_model}>
            {hardware?.cpu_model || "Host CPU"}
          </div>
        </div>

        {/* RAM */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total System RAM</span>
            <Memory className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">{hardware?.total_ram_gb} GB</div>
          <div className="text-[11px] text-emerald-400 mt-1">
            {hardware?.available_ram_gb} GB Currently Available
          </div>
        </div>

        {/* GPU */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Graphics / Accelerator</span>
            <Server className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {hardware?.gpu_vram_mb ? `${hardware.gpu_vram_mb} MB VRAM` : "DirectX / iGPU"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate" title={hardware?.gpu_name}>
            {hardware?.gpu_name || "Host Graphics"}
          </div>
        </div>

        {/* Free Disk */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Available Disk Space</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white mt-2">{hardware?.free_disk_gb} GB</div>
          <div className="text-[11px] text-slate-400 mt-1">Sufficient for local models</div>
        </div>
      </div>

      {/* Hardware Tier Recommendation Banner */}
      <div className="p-5 rounded-2xl border border-brand-800/80 bg-brand-950/30 backdrop-blur flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-900/80 text-brand-300 font-mono font-medium border border-brand-700">
              {hardware?.hardware_tier || "Standard Laptop"}
            </span>
            <span className="text-xs text-slate-400">• Detected OS: {hardware?.os} {hardware?.os_release}</span>
          </div>
          <h3 className="text-base font-bold text-white mt-2">
            Recommended Model: <span className="text-emerald-400 font-mono">{hardware?.recommended_model}</span>
          </h3>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {hardware?.recommended_config?.tier_description || "Balanced for responsive CPU/iGPU local inference with zero token costs."}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono shrink-0 space-y-1">
          <div className="text-slate-400">Context Window: <span className="text-white">4,096 tokens</span></div>
          <div className="text-slate-400">Num Threads: <span className="text-white">{hardware?.recommended_config?.ollama_num_threads || 8}</span></div>
          <div className="text-slate-400">Inference Temperature: <span className="text-white">0.3</span></div>
        </div>
      </div>

      {/* Model Catalog Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur">
        <h3 className="text-base font-bold text-white tracking-tight mb-1">Supported Open-Weight Models</h3>
        <p className="text-xs text-slate-400 mb-4">
          All models are permissive open-source or open-weight licenses. No paid APIs or subscriptions required.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 pb-2">
                <th className="pb-3 font-semibold">Model Name</th>
                <th className="pb-3 font-semibold">Parameters</th>
                <th className="pb-3 font-semibold">Download Size</th>
                <th className="pb-3 font-semibold">Min RAM</th>
                <th className="pb-3 font-semibold">License</th>
                <th className="pb-3 font-semibold">Optimal For</th>
                <th className="pb-3 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {hardware?.supported_models.map((m) => {
                const isInstalled = health?.available_models.some((am) => am.includes(m.id));
                const isRecommended = m.recommended;

                return (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pr-3 font-bold text-white flex items-center gap-1.5">
                      <span>{m.name}</span>
                      {isRecommended && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Recommended
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-3 text-slate-300">{m.parameters}</td>
                    <td className="py-3 pr-3 text-slate-300">{m.download_size_gb} GB</td>
                    <td className="py-3 pr-3 text-slate-300">{m.min_ram_gb} GB</td>
                    <td className="py-3 pr-3 text-brand-400 font-semibold">{m.license}</td>
                    <td className="py-3 pr-3 text-slate-400 max-w-xs">{m.best_for}</td>
                    <td className="py-3 text-right">
                      {isInstalled ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Installed</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">Available</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ollama Setup Instructions */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 backdrop-blur text-xs space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Info className="w-4 h-4 text-brand-400" />
          <span>Local Model Installation & Execution Guide</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          Harvey Local Sales Agent communicates directly with Ollama running on <code className="bg-slate-950 px-1.5 py-0.5 rounded text-brand-300">http://127.0.0.1:11434</code>.
          When Ollama is offline, Harvey gracefully falls back to deterministic rule-based analysis and queues tasks in SQLite without cloud leaks.
        </p>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
          <div className="text-slate-500"># 1. Install Ollama on Windows (via Windows Package Manager)</div>
          <div className="text-emerald-400 font-bold">winget install Ollama.Ollama</div>
          <div className="text-slate-500 pt-2"># 2. Pull the recommended local model (zero cost, ~1.9 GB download)</div>
          <div className="text-emerald-400 font-bold">ollama pull {hardware?.recommended_model || "qwen2.5:3b"}</div>
          <div className="text-slate-500 pt-2"># 3. Start local daemon (if not already running in background)</div>
          <div className="text-emerald-400 font-bold">ollama serve</div>
        </div>
      </div>
    </div>
  );
};
