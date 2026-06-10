"use client";

import React, { useState, useEffect } from "react";
import { CONGESTION_PREDICTIONS } from "@/lib/mockData";
import {
  TrendingUp,
  Brain,
  Cpu,
  AlertTriangle,
  Clock,
  Gauge,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

export default function PredictionsPage() {
  const [selectedHourIndex, setSelectedHourIndex] = useState(0); // 0 corresponds to +1 Hour, 5 corresponds to +6 Hours
  const [predictionsData, setPredictionsData] = useState<any[]>(CONGESTION_PREDICTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        const res = await fetch(`${apiBase}/api/traffic/predictions`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setPredictionsData(data);
          }
        }
      } catch (e) {
        console.error("Failed to fetch GCN predictions:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPredictions();
  }, []);

  const currentHourData = predictionsData[selectedHourIndex] || predictionsData[0];

  // Junction mapping based on current selected hours
  const predictedJunctions = [
    { name: "Graphite India Junction", val: currentHourData.Graphite ?? currentHourData.GraphiteIndia ?? 40, trend: "up" },
    { name: "Hope Farm Junction", val: currentHourData.HopeFarm ?? 40, trend: "up" },
    { name: "Vydehi Hospital Junction", val: currentHourData.Vydehi ?? 40, trend: "down" },
    { name: "Hoodi Junction", val: currentHourData.Hoodi ?? 40, trend: "neutral" },
  ];

  const getStatusColor = (val: number) => {
    if (val > 80) return "text-red-400";
    if (val > 50) return "text-amber-400";
    return "text-emerald-400";
  };

  const getBgColor = (val: number) => {
    if (val > 80) return "bg-red-500/10 border-red-500/25";
    if (val > 50) return "bg-amber-500/10 border-amber-500/25";
    return "bg-emerald-500/10 border-emerald-500/25";
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-wide uppercase">
            AI BOTTLENECK PREDICTION SYSTEM
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Predictive machine learning analytics and flow forecasting.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-950/20 border border-cyan-800/30 rounded-lg text-cyan-400 font-mono text-[10px] font-bold">
          <Brain className="h-4 w-4 text-cyan-400 animate-pulse" />
          MODEL: NEURAL-GRID-V4
        </div>
      </div>

      {/* Model Spec Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-slate-800">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-500 uppercase text-[9px]">AI Prediction Accuracy</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5">94.2%</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-slate-800">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Gauge className="h-5 w-5" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-500 uppercase text-[9px]">Training Status</span>
            <span className="text-sm font-bold text-emerald-400 mt-0.5">OPTIMIZED</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-slate-800">
          <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-500 uppercase text-[9px]">Sensors Evaluated</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5">142 nodes/min</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-4 border border-slate-800">
          <div className="p-2.5 rounded-lg bg-slate-500/10 text-slate-400">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-500 uppercase text-[9px]">Last Update Epoch</span>
            <span className="text-sm font-bold text-slate-200 mt-0.5">3 mins ago</span>
          </div>
        </div>
      </div>

      {/* Interactive Slider Panel */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800/40 pb-4">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-300 font-mono tracking-wide uppercase">
              Time-Travel Bottleneck Forecast
            </span>
            <p className="text-[11px] text-slate-500">
              Drag the timeline to preview predicted traffic density spikes.
            </p>
          </div>
          <span className="text-lg font-extrabold text-cyan-400 font-mono px-4 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-xl animate-pulse">
            PREDICTION WINDOW: {currentHourData.time}
          </span>
        </div>

        {/* The Slider */}
        <div className="flex flex-col gap-3 font-mono">
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={selectedHourIndex}
            onChange={(e) => setSelectedHourIndex(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
          <div className="flex justify-between text-[10px] text-slate-500 px-1.5">
            {predictionsData.map((p, idx) => (
              <button
                key={p.time}
                onClick={() => setSelectedHourIndex(idx)}
                className={`transition-colors ${
                  selectedHourIndex === idx ? "text-cyan-400 font-bold" : "hover:text-slate-300"
                }`}
              >
                {p.time}
              </button>
            ))}
          </div>
        </div>

        {/* Junction Future Capacity Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          {predictedJunctions.map((j) => {
            const statusColor = getStatusColor(j.val);
            const bgColor = getBgColor(j.val);

            return (
              <div
                key={j.name}
                className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${bgColor}`}
              >
                <span className="text-xs font-bold text-slate-300 truncate">{j.name}</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500 font-mono">Load Capacity:</span>
                  <span className={`text-2xl font-extrabold font-mono ${statusColor}`}>{j.val}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      j.val > 80 ? "bg-red-500" : j.val > 50 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${j.val}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Future Area Curve */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
        <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono flex items-center gap-2 border-b border-slate-800/40 pb-2">
          <TrendingUp className="h-4.5 w-4.5 text-cyan-400" />
          Multi-Junction Capacity Projections (+6 Hours)
        </h3>
        <div className="h-60 w-full font-mono text-[9px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={predictionsData}>
              <XAxis dataKey="time" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip
                contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b" }}
                itemStyle={{ color: "#f1f5f9" }}
              />
              <Area type="monotone" dataKey="Graphite" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} name="Graphite India" />
              <Area type="monotone" dataKey="HopeFarm" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} name="Hope Farm" />
              <Area type="monotone" dataKey="Vydehi" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.08} name="Vydehi Hospital" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
