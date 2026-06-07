import React from "react";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  color: "cyan" | "emerald" | "amber" | "red";
  description?: string;
}

export default function MetricCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection,
  color,
  description,
}: MetricCardProps) {
  const colorMap = {
    cyan: {
      border: "border-cyan-500/30 hover:border-cyan-500/60",
      glow: "hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]",
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      accent: "from-cyan-500 to-transparent",
    },
    emerald: {
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      glow: "hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      accent: "from-emerald-500 to-transparent",
    },
    amber: {
      border: "border-amber-500/30 hover:border-amber-500/60",
      glow: "hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      accent: "from-amber-500 to-transparent",
    },
    red: {
      border: "border-red-500/30 hover:border-red-500/60",
      glow: "hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]",
      text: "text-red-400",
      bg: "bg-red-500/10",
      accent: "from-red-500 to-transparent",
    },
  };

  const currentStyles = colorMap[color];

  return (
    <div
      className={`glass-panel p-5 rounded-2xl border ${currentStyles.border} ${currentStyles.glow} transition-all duration-300 relative group overflow-hidden`}
    >
      {/* Decorative vertical glow strip */}
      <div className={`absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b ${currentStyles.accent}`} />

      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-400 font-mono tracking-wider uppercase">
            {title}
          </span>
          <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight my-1">
            {value}
          </span>
        </div>
        <div className={`p-3 rounded-xl ${currentStyles.bg} ${currentStyles.text}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-800/40">
        <span className="text-[11px] text-slate-500 truncate max-w-[70%]">
          {description}
        </span>
        {trend && (
          <span
            className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
              trendDirection === "down"
                ? "text-emerald-400 bg-emerald-500/10"
                : trendDirection === "up"
                ? "text-red-400 bg-red-500/10"
                : "text-slate-400 bg-slate-800"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
