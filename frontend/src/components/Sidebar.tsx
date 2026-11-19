import React from "react";
import {
  LayoutDashboard,
  Building2,
  Package,
  Cpu,
  Target,
  Users,
  Search,
  Zap,
  HelpCircle,
  BarChart3,
  Mail,
  MessageSquare,
  History,
  Terminal,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { ViewType } from "../types";

interface NavItem {
  id: ViewType;
  label: string;
  icon: React.ReactNode;
  category?: string;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, health } = useApp();

  const navItems: NavItem[] = [
    { category: "Command Center", id: "overview", label: "Overview Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    
    { category: "Business & Products", id: "companies", label: "Company Profiles", icon: <Building2 className="w-4 h-4" /> },
    { id: "products", label: "Product Portfolio", icon: <Package className="w-4 h-4" /> },
    { id: "icp", label: "Product ICP Engine", icon: <Target className="w-4 h-4" /> },

    { category: "Prospect Intelligence", id: "discovery", label: "Prospects & Import", icon: <Users className="w-4 h-4" /> },
    { id: "research", label: "Account Research", icon: <Search className="w-4 h-4" /> },
    { id: "signals", label: "Buying Signals", icon: <Zap className="w-4 h-4" /> },
    { id: "problems", label: "Problem Statements", icon: <HelpCircle className="w-4 h-4" /> },
    { id: "scoring", label: "Prospect Scoring", icon: <BarChart3 className="w-4 h-4" /> },

    { category: "Sales Outreach & Inbox", id: "emails", label: "Personalised Emails", icon: <Mail className="w-4 h-4" /> },
    { id: "replies", label: "Reply Classifier", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "history", label: "Conversation History", icon: <History className="w-4 h-4" /> },

    { category: "Local AI & Platform", id: "hardware", label: "Hardware & Models", icon: <Cpu className="w-4 h-4" /> },
    { id: "logs", label: "Model Audit Logs", icon: <Terminal className="w-4 h-4" /> },
    { id: "settings", label: "Settings & System", icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/80 backdrop-blur flex flex-col justify-between shrink-0 select-none">
      {/* Brand Header */}
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold text-lg font-mono">
            H
          </div>
          <div>
            <div className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>HARVEY AI</span>
              <span className="text-[10px] bg-brand-900/80 text-brand-300 px-1.5 py-0.2 rounded font-mono font-medium border border-brand-700/50">
                LOCAL
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">Zero-Cost Sales Agent</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-0.5 overflow-y-auto max-h-[calc(100vh-8rem)]">
          {navItems.map((item, idx) => (
            <React.Fragment key={item.id}>
              {item.category && (
                <div className={`px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider ${idx > 0 ? "pt-4 pb-1" : "pb-1"}`}>
                  {item.category}
                </div>
              )}
              <button
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeView === item.id
                    ? "bg-brand-600/15 text-brand-400 border border-brand-500/30 font-semibold shadow-sm"
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={activeView === item.id ? "text-brand-400" : "text-slate-400"}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Footer / Zero-Cost Compliance Badge */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-[11px] text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="leading-tight">
            <div className="font-semibold">Zero-Cost Compliant</div>
            <div className="text-[10px] text-emerald-400/80">100% Local Inference</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
