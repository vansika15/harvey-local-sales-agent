import React from "react";
import clsx from "clsx";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = "md" }) => {
  const norm = status.toLowerCase().replace(/_/g, " ");

  let style = "bg-slate-800 text-slate-300 border-slate-700";

  if (norm.includes("high") || norm.includes("meeting")) {
    style = "bg-emerald-950/80 text-emerald-400 border-emerald-800/80";
  } else if (norm.includes("interested") || norm.includes("qualified") || norm.includes("approved")) {
    style = "bg-brand-950/80 text-brand-400 border-brand-800/80";
  } else if (norm.includes("medium") || norm.includes("follow up") || norm.includes("researched")) {
    style = "bg-amber-950/80 text-amber-400 border-amber-800/80";
  } else if (norm.includes("objection") || norm.includes("low") || norm.includes("unqualified")) {
    style = "bg-orange-950/80 text-orange-400 border-orange-800/80";
  } else if (norm.includes("not interested") || norm.includes("rejected") || norm.includes("error")) {
    style = "bg-rose-950/80 text-rose-400 border-rose-800/80";
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded-full border tracking-wide uppercase font-mono",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        style
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {norm}
    </span>
  );
};
