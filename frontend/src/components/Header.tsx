import React, { useState } from "react";
import {
  Building2,
  Package,
  Cpu,
  Wifi,
  WifiOff,
  RotateCw,
  Sparkles,
  Database,
  ChevronDown,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { api } from "../api/client";

export const Header: React.FC = () => {
  const {
    companies,
    activeCompany,
    setActiveCompany,
    products,
    activeProduct,
    setActiveProduct,
    health,
    hardware,
    toggleOffline,
    refreshData,
    addToast,
  } = useApp();

  const [isResetting, setIsResetting] = useState(false);

  const handleResetData = async () => {
    if (!confirm("Reset database and reload fresh demonstration companies, products, and prospects?")) return;
    setIsResetting(true);
    try {
      await api.loadSampleData(true);
      await refreshData();
      addToast("Sample demonstration dataset refreshed successfully!", "success");
    } catch (e: any) {
      addToast(`Reset failed: ${e.message}`, "error");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between z-10 sticky top-0">
      {/* Left: Active Company and Product Selectors */}
      <div className="flex items-center gap-4">
        {/* Company Dropdown */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-brand-950 border border-brand-800 text-brand-400">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="relative">
            <select
              value={activeCompany?.id || ""}
              onChange={(e) => {
                const found = companies.find((c) => c.id === Number(e.target.value));
                if (found) setActiveCompany(found);
              }}
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-100 text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.is_sample ? "(Sample)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <span className="text-slate-600">/</span>

        {/* Product Dropdown */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950 border border-emerald-800 text-emerald-400">
            <Package className="w-4 h-4" />
          </div>
          <div className="relative">
            <select
              value={activeProduct?.id || ""}
              onChange={(e) => {
                const found = products.find((p) => p.id === Number(e.target.value));
                if (found) setActiveProduct(found);
              }}
              disabled={products.length === 0}
              className="bg-slate-800/90 hover:bg-slate-800 text-slate-100 text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 border border-slate-700/80 focus:outline-none focus:ring-1 focus:ring-emerald-500 appearance-none cursor-pointer disabled:opacity-50"
            >
              {products.length === 0 ? (
                <option value="">No products registered</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right: Hardware Telemetry, Ollama Indicator & Actions */}
      <div className="flex items-center gap-3">
        {/* Hardware Specs Pill */}
        {hardware && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-mono text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-brand-400" />
            <span>{hardware.cpu_cores}C</span>
            <span className="text-slate-500">•</span>
            <span>{hardware.total_ram_gb}GB RAM</span>
            <span className="text-slate-500">•</span>
            <span className="text-emerald-400 font-semibold">{hardware.recommended_model}</span>
          </div>
        )}

        {/* Ollama Status Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
            health?.ollama_connected
              ? "bg-emerald-950/60 border-emerald-800 text-emerald-400"
              : "bg-amber-950/60 border-amber-800 text-amber-400"
          }`}
          title={health?.ollama_connected ? "Ollama local inference active" : "Ollama daemon offline. Requests queued in SQLite."}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              health?.ollama_connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          <span>{health?.ollama_connected ? "Ollama Online" : "Ollama Offline (Queued)"}</span>
        </div>

        {/* Offline Mode Toggle Button */}
        <button
          onClick={() => toggleOffline(!health?.offline_mode)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
            health?.offline_mode
              ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
              : "bg-slate-800/80 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700"
          }`}
          title="Toggle network isolation to verify 100% offline workflow execution"
        >
          {health?.offline_mode ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Enforced</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-slate-400" />
              <span>Online Mode</span>
            </>
          )}
        </button>

        {/* Sample Reset Button */}
        <button
          onClick={handleResetData}
          disabled={isResetting}
          className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50"
          title="Reset database to realistic sample data"
        >
          <RotateCw className={`w-4 h-4 ${isResetting ? "animate-spin" : ""}`} />
        </button>
      </div>
    </header>
  );
};
