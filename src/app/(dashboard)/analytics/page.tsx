"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Download,
  Calendar,
  Sparkles,
  Leaf,
  Clock,
  Gauge,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { WAIT_TIME_BY_JUNCTION } from "@/lib/mockData";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const handleDownload = (id: string, name: string) => {
    setDownloadingReportId(id);
    setDownloadSuccess(null);

    // Simulate PDF report compile latency
    setTimeout(() => {
      setDownloadingReportId(null);
      setDownloadSuccess(name);
      setTimeout(() => setDownloadSuccess(null), 3000);
    }, 2000);
  };

  const reports = [
    { id: "rep-1", name: "Weekly Transit Volume Report", date: "May 31 - Jun 06, 2026", size: "2.4 MB" },
    { id: "rep-2", name: "Green Corridor Response Telemetry", date: "May 01 - May 31, 2026", size: "1.8 MB" },
    { id: "rep-3", name: "Carbon Emission Offset Audit", date: "Q2 2026 Forecast", size: "4.1 MB" },
    { id: "rep-4", name: "Junction Congestion Bottleneck Log", date: "June 07, 2026", size: "850 KB" },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-wide uppercase">
            HISTORICAL ANALYTICS & REPORTS
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Carbon emission reduction indexing and audit log exports.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Leaf className="h-6 w-6" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-500 uppercase text-[9px]">Carbon Offset Savings</span>
            <span className="text-lg font-bold text-slate-100 mt-0.5">2.4 Metric Tons</span>
            <span className="text-[10px] text-emerald-400 mt-0.5">-14.2% vs last month</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.05)] flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Clock className="h-6 w-6" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-500 uppercase text-[9px]">Transit Wait Drop</span>
            <span className="text-lg font-bold text-slate-100 mt-0.5">-34.5 seconds</span>
            <span className="text-[10px] text-cyan-400 mt-0.5">AI adaptive active</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-indigo-500/20 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-500 uppercase text-[9px]">Adaptive AI Efficacy</span>
            <span className="text-lg font-bold text-slate-100 mt-0.5">88.4%</span>
            <span className="text-[10px] text-indigo-400 mt-0.5">Optimized signals</span>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <Gauge className="h-6 w-6" />
          </div>
          <div className="flex flex-col font-mono text-xs">
            <span className="text-slate-500 uppercase text-[9px]">Emergency Response</span>
            <span className="text-lg font-bold text-slate-100 mt-0.5">-12% time-delay</span>
            <span className="text-[10px] text-amber-400 mt-0.5">Priority routing gains</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart and Reports List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Comparison Chart */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
            <BarChart3 className="h-4.5 w-4.5 text-cyan-400" />
            Adaptive AI vs. Historical Baseline (Wait Delay)
          </h2>
          <div className="h-72 w-full font-mono text-[9px] mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WAIT_TIME_BY_JUNCTION}>
                <XAxis dataKey="name" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b" }}
                  itemStyle={{ color: "#f1f5f9" }}
                />
                <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                <Bar dataKey="historicalAvg" fill="#475569" fillOpacity={0.6} name="Legacy Fixed Time" />
                <Bar dataKey="current" fill="#06b6d4" name="Adaptive AI (Active)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reports Downloader */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2.5">
            Operational Document Downloads
          </h2>

          <div className="flex-1 flex flex-col gap-3 justify-center">
            {downloadSuccess && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs font-mono rounded-xl flex items-center gap-2.5 animate-fadeIn">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                <span>Successfully exported and downloaded: {downloadSuccess}</span>
              </div>
            )}

            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950/50 border border-slate-900 rounded-xl hover:border-slate-800 transition-colors"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-200">{report.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {report.date} | {report.size}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDownload(report.id, report.name)}
                    disabled={downloadingReportId !== null}
                    className="p-2 bg-slate-900 hover:bg-slate-850 hover:text-cyan-400 border border-slate-800 text-slate-400 rounded-lg transition-all disabled:opacity-50"
                  >
                    {downloadingReportId === report.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
