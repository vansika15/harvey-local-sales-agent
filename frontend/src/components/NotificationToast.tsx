import React from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { useApp } from "../context/AppContext";

export const NotificationToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let icon = <Info className="w-5 h-5 text-blue-400 shrink-0" />;
        let border = "border-blue-800/80 bg-slate-900/95";

        if (toast.type === "success") {
          icon = <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
          border = "border-emerald-800/80 bg-slate-900/95";
        } else if (toast.type === "error") {
          icon = <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />;
          border = "border-rose-800/80 bg-slate-900/95";
        } else if (toast.type === "warning") {
          icon = <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
          border = "border-amber-800/80 bg-slate-900/95";
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-2 ${border}`}
          >
            {icon}
            <div className="flex-1 text-sm text-slate-200 leading-snug">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
