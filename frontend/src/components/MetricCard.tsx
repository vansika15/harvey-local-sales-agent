import React from "react";
import clsx from "clsx";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: string;
  variant?: "default" | "brand" | "emerald" | "amber";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = "default",
}) => {
  const borderStyles = {
    default: "border-slate-800 bg-slate-900/70 hover:border-slate-700",
    brand: "border-brand-900/60 bg-brand-950/20 hover:border-brand-700/80",
    emerald: "border-emerald-900/60 bg-emerald-950/20 hover:border-emerald-700/80",
    amber: "border-amber-900/60 bg-amber-950/20 hover:border-amber-700/80",
  };

  return (
    <div
      className={clsx(
        "rounded-xl p-5 border backdrop-blur transition-all duration-200 flex flex-col justify-between",
        borderStyles[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 tracking-wider uppercase">{title}</span>
        <div className="p-2 rounded-lg bg-slate-800/80 text-brand-400 border border-slate-700/50">
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold text-white tracking-tight font-mono">{value}</div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        {trend && <span className="text-[11px] text-emerald-400 font-medium mt-1 inline-block">{trend}</span>}
      </div>
    </div>
  );
};
