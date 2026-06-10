"use client";

import React from "react";
import { useTraffic } from "@/context/TrafficContext";
import MetricCard from "@/components/MetricCard";
import MapWrapper from "@/components/MapWrapper";
import {
  Activity,
  ShieldAlert,
  Flame,
  Siren,
  Clock,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Brain,
  Navigation,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { DENSITY_TRENDS } from "@/lib/mockData";

export default function Dashboard() {
  const { junctions, alerts, ambulances, resolveAlert, currentUser, activeCorridor } = useTraffic();
  const isOperator = currentUser?.role === "Traffic Operations Manager";

  // Compute live statistics
  const totalJunctions = junctions.length;
  const operationalJunctions = junctions.filter(j => j.status !== "critical").length;
  const avgCongestion = Math.round(
    junctions.reduce((sum, j) => sum + j.congestionLevel, 0) / (totalJunctions || 1)
  );
  const activeAmbulances = ambulances.filter(a => a.status === "En-Route" || a.status === "Stuck").length;
  const activeCorridors = junctions.filter(j => j.greenCorridorActive).length;

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);

  // Dynamic charts mapping
  const waitTimeData = junctions.map((j) => {
    const displayName = j.name.replace(" Junction", "").replace(" Hospital", "");
    return {
      name: displayName,
      current: j.averageWaitTime,
      target: 45,
    };
  });

  const vehicleSplitData = [
    { name: "Cars", count: Math.round(avgCongestion * 50 + 1200), color: "#10b981" },
    { name: "Two-Wheelers", count: Math.round(avgCongestion * 25 + 600), color: "#a855f7" },
    { name: "Auto-Rickshaws", count: Math.round(avgCongestion * 18 + 400), color: "#f59e0b" },
    { name: "Buses / Trucks", count: Math.round(avgCongestion * 10 + 200), color: "#06b6d4" },
    { name: "Emergency", count: activeAmbulances, color: "#f43f5e" }
  ];

  const densityTrendsData = [
    ...DENSITY_TRENDS.slice(0, DENSITY_TRENDS.length - 1),
    { time: "NOW", average: avgCongestion, peak: Math.min(100, Math.round(avgCongestion * 1.25)) }
  ];

  // AI Alternate route suggestions
  const alternateRouteSuggestions = (() => {
    const congested = junctions.filter((j) => j.congestionLevel > 50);
    if (congested.length === 0) {
      return [
        {
          id: "sug-clear",
          junctionName: "All Sectors Clear",
          recommendation: "Traffic flow is optimal. No active rerouting required.",
          savings: "0 min",
        },
      ];
    }
    return congested.map((j) => {
      let altRoute = "ITPL Bypass";
      let savingsMin = Math.round(j.congestionLevel * 0.15 + 2);

      if (j.id === "WF_J_001") {
        altRoute = "Channasandra Main Road / Kadugodi Link";
      } else if (j.id === "WF_J_002") {
        altRoute = "Hoodi Main Road via ECC Road";
      } else if (j.id === "WF_J_003") {
        altRoute = "Kundalahalli Lake Bypass Road";
      } else if (j.id === "WF_J_004") {
        altRoute = "HAL Airport Road via Marathahalli";
      } else if (j.id === "WF_J_005") {
        altRoute = "Whitefield Road via Pattandur Agrahara";
      } else if (j.id === "WF_J_006") {
        altRoute = "Varthur Bypass / Gunjur Road";
      }
      return {
        id: `sug-${j.id}`,
        junctionName: j.name,
        recommendation: `Divert transit flow via ${altRoute} to bypass bottleneck.`,
        savings: `${savingsMin} min`,
      };
    });
  })();

  return (
    <div className="flex flex-col gap-6">
      {/* Top Welcome Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-wide uppercase">
            {isOperator ? "WHITEFIELD OPERATIONS COMMAND" : "WHITEFIELD PUBLIC COMMUTER PORTAL"}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {isOperator ? "Real-time telemetry and adaptive traffic optimization feed." : "Real-time traffic conditions, transit tracking, and safety alerts."}
          </p>
        </div>
        {isOperator && (
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 text-xs transition-colors font-mono font-semibold">
              <FileSpreadsheet className="h-4 w-4" />
              EXPORT TELEMETRY
            </button>
          </div>
        )}
      </div>

      {/* Top Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active / Total Junctions"
          value={`${operationalJunctions} / ${totalJunctions}`}
          icon={Activity}
          description="Operational camera & loop nodes"
          trend="Grid safe"
          trendDirection="down"
          color="emerald"
        />
        <MetricCard
          title="Avg Grid Congestion"
          value={`${avgCongestion}%`}
          icon={Flame}
          description="Average congestion index"
          trend="-3.2% vs hr"
          trendDirection="down"
          color={avgCongestion > 70 ? "red" : avgCongestion > 50 ? "amber" : "cyan"}
        />
        <MetricCard
          title="Ambulances Active"
          value={activeAmbulances}
          icon={Siren}
          description="Transponders currently en-route"
          trend={activeAmbulances > 0 ? "High priority" : "Clear"}
          trendDirection={activeAmbulances > 0 ? "up" : "neutral"}
          color={activeAmbulances > 0 ? "red" : "cyan"}
        />
        <MetricCard
          title="Active Green Corridors"
          value={activeCorridors}
          icon={Clock}
          description="Signal priority paths engaged"
          trend="Override active"
          trendDirection={activeCorridors > 0 ? "up" : "neutral"}
          color="cyan"
        />
      </div>

      {/* Middle Grid - Map and Sidebar Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Map Area */}
        <div className="lg:col-span-8 flex flex-col h-[520px] bg-[#090d1a]/40 rounded-2xl">
          <div className="flex justify-between items-center px-5 py-3 border-b border-slate-800/40">
            <span className="text-xs font-bold font-mono text-slate-400 tracking-wider">
              LIVE WHITEFIELD RADAR GRID
            </span>
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              LIVE TELEMETRY STREAM
            </span>
          </div>
          <div className="flex-1 p-2 bg-slate-950/20">
            <MapWrapper />
          </div>
        </div>

        {/* Right Side Console Panel */}
        <div className="lg:col-span-4 flex flex-col gap-5 h-[520px] overflow-y-auto">
          {/* Emergency Alerts */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 min-h-[220px] overflow-hidden">
            <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
              <h3 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2">
                <ShieldAlert className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                Emergency Dispatch Console
              </h3>
              {unresolvedAlerts.length > 0 && (
                <span className="text-[9px] px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-bold">
                  {unresolvedAlerts.length} NEW
                </span>
              )}
            </div>

            {/* Real-time preemption corridor tracker */}
            {activeCorridor && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-2 font-mono text-[11px] mb-1.5 animate-pulse">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-red-400 flex items-center gap-1">
                    <Siren className="h-3.5 w-3.5 text-red-450 animate-bounce" />
                    PREEMPTION ACTIVE
                  </span>
                  <span className="text-slate-400">{activeCorridor.progress}%</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span className="font-bold">{activeCorridor.vehicleNo}</span>
                  <span className="text-cyan-400">{activeCorridor.etaRemaining}s remaining</span>
                </div>
                <div className="text-[9px] text-slate-500 truncate">
                  {activeCorridor.source} &rarr; {activeCorridor.destination}
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-slate-900">
                  <div
                    className="h-full bg-gradient-to-r from-red-500 to-amber-500 transition-all duration-1000"
                    style={{ width: `${activeCorridor.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 max-h-[160px]">
              {unresolvedAlerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs font-mono py-8">
                  <span>No active emergency alarms.</span>
                </div>
              ) : (
                unresolvedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                      alert.severity === "critical"
                        ? "bg-red-500/5 border-red-500/20 text-red-300"
                        : alert.severity === "warning"
                        ? "bg-amber-500/5 border-amber-500/20 text-amber-300"
                        : "bg-slate-900/60 border-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs uppercase font-mono tracking-wide">
                        {alert.title}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">{alert.time}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
                      {alert.message}
                    </p>
                    {isOperator && (
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="self-end text-[10px] text-cyan-400 hover:text-cyan-300 font-mono font-bold mt-1.5 uppercase hover:underline"
                      >
                        Acknowledge &rarr;
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Traffic Warnings (High Congestion Junction list) */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 min-h-[220px] overflow-hidden">
            <h3 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2 border-b border-slate-800/40 pb-2">
              <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
              Congestion Warnings
            </h3>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[160px]">
              {junctions
                .filter((j) => j.congestionLevel > 50)
                .sort((a, b) => b.congestionLevel - a.congestionLevel)
                .map((junction) => (
                  <div
                    key={junction.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-colors"
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-slate-300">{junction.name}</span>
                        <span className={`text-[8px] font-mono font-bold px-1 rounded-sm flex items-center gap-0.5 ${
                          junction.dataSource === "live"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {junction.dataSource === "live" ? "LIVE" : "SIM"}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Queue: {junction.queueLength}m | Wait: {junction.averageWaitTime}s
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                          junction.congestionLevel > 80
                            ? "text-red-400 bg-red-500/10"
                            : "text-amber-400 bg-amber-500/10"
                        }`}
                      >
                        {junction.congestionLevel}%
                      </span>
                      {junction.greenCorridorActive && (
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* AI Alternate Route Suggestions */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 min-h-[225px] overflow-hidden">
            <h3 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2 border-b border-slate-800/40 pb-2">
              <Brain className="h-4.5 w-4.5 text-cyan-400" />
              AI Route Recommendations
            </h3>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 max-h-[160px]">
              {alternateRouteSuggestions.map((sug) => {
                const isClear = sug.id === "sug-clear";
                return (
                  <div
                    key={sug.id}
                    className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all ${
                      isClear
                        ? "bg-slate-900/40 border-slate-800 text-slate-500"
                        : "bg-cyan-500/5 border-cyan-500/20 text-cyan-300"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-[10px] uppercase font-mono tracking-wide truncate max-w-[185px]">
                        {sug.junctionName}
                      </span>
                      {!isClear && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded font-bold font-mono">
                          Saved: {sug.savings}
                        </span>
                      )}
                    </div>
                    <div className="flex items-start gap-1.5">
                      {!isClear && <Navigation className="h-3.5 w-3.5 text-cyan-400 rotate-45 shrink-0 mt-0.5" />}
                      <p className="text-[10px] leading-normal text-slate-400 font-mono">
                        {sug.recommendation}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Traffic Density Trends */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-cyan-400" />
              Traffic Density Trends
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">24H CYCLE</span>
          </div>
          <div className="h-56 w-full font-mono text-[10px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={densityTrendsData}>
                <XAxis dataKey="time" stroke="#475569" />
                <YAxis stroke="#475569" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b" }}
                  itemStyle={{ color: "#f1f5f9" }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line type="monotone" dataKey="average" stroke="#06b6d4" strokeWidth={2.5} dot={false} name="Avg Flow" />
                <Line type="monotone" dataKey="peak" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Peak Limit" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Vehicle Distribution */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono flex items-center gap-2">
              <Activity className="h-4.5 w-4.5 text-emerald-400" />
              Vehicle Split
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">TODAY</span>
          </div>
          <div className="h-56 w-full flex items-center justify-between">
            <div className="h-full w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleSplitData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {vehicleSplitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2 w-1/2 justify-center pl-2">
              {vehicleSplitData.map((entry) => (
                <div key={entry.name} className="flex flex-col">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="truncate text-[10px]">{entry.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-500 font-mono pl-4">
                    {entry.count.toLocaleString()} vehicles
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chart 3: Wait Time Distribution */}
        <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-800/40 pb-2">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" />
              Junction Wait Times
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">SECONDS</span>
          </div>
          <div className="h-56 w-full font-mono text-[9px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waitTimeData}>
                <XAxis dataKey="name" stroke="#475569" tickFormatter={(v) => v.split(" ")[0]} />
                <YAxis stroke="#475569" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0b0f19", borderColor: "#1e293b" }}
                  itemStyle={{ color: "#f1f5f9" }}
                />
                <Bar dataKey="current" fill="#f59e0b" name="Current Wait">
                  {waitTimeData.map((entry, index) => {
                    const matchedJunction = junctions.find((j) => j.name.startsWith(entry.name));
                    const isCorridor = matchedJunction?.greenCorridorActive;
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={isCorridor ? "#06b6d4" : entry.current > 100 ? "#ef4444" : "#f59e0b"}
                      />
                    );
                  })}
                </Bar>
                <Bar dataKey="target" fill="#10b981" fillOpacity={0.3} name="Target Limit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
