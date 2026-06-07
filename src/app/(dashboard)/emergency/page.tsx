"use client";

import React, { useState } from "react";
import { useTraffic, Ambulance } from "@/context/TrafficContext";
import {
  Siren,
  Plus,
  Route,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  XCircle,
  Flame,
  Shield,
  Trash2,
  Sliders,
  History,
  TrendingDown
} from "lucide-react";

export default function EmergencyControlPage() {
  const {
    junctions,
    activeCorridor,
    corridorHistory,
    cancelCorridor,
    triggerEmergencyRoute,
    isLiveConnected
  } = useTraffic();

  const [vehicleNo, setVehicleNo] = useState("KA-53-E-8802");
  const [vehicleType, setVehicleType] = useState("ambulance");
  const [priorityLevel, setPriorityLevel] = useState(1);
  const [source, setSource] = useState(junctions[0]?.name || "");
  const [destination, setDestination] = useState("Vydehi Hospital");
  const [formSuccess, setFormSuccess] = useState(false);

  // Auto-initialize source if junctions load
  React.useEffect(() => {
    if (junctions.length > 0 && !source) {
      setSource(junctions[0].name);
    }
  }, [junctions, source]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim() || !source || !destination) return;

    triggerEmergencyRoute(source, destination, vehicleNo, vehicleType, priorityLevel);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setVehicleNo(`KA-53-${vehicleType === "ambulance" ? "AM" : vehicleType === "fire" ? "FR" : "PL"}-${Math.floor(1000 + Math.random() * 9000)}`);
    }, 2500);
  };

  const handleVehicleTypeChange = (type: string) => {
    setVehicleType(type);
    const priorityMap: Record<string, number> = { ambulance: 1, fire: 2, police: 3 };
    setPriorityLevel(priorityMap[type] || 1);
    setVehicleNo(`KA-53-${type === "ambulance" ? "AM" : type === "fire" ? "FR" : "PL"}-${Math.floor(1000 + Math.random() * 9000)}`);
  };

  const hospitals = [
    "Vydehi Hospital",
    "Sakra World Hospital",
    "Manipal Hospital Whitefield",
    "Columbia Asia Whitefield",
  ];

  // Calculate stats
  const totalCorridors = corridorHistory.length + (activeCorridor ? 1 : 0);
  
  const totalTimeSavedSeconds = corridorHistory
    .filter((c) => c.status === "COMPLETED")
    .reduce((sum, c) => sum + (c.time_saved_seconds || 0), 0);
  const timeSavedTodayMin = Math.round(totalTimeSavedSeconds / 60);

  const completedCorridors = corridorHistory.filter((c) => c.status === "COMPLETED");
  const avgReductionPercent = completedCorridors.length > 0
    ? Math.round(
        completedCorridors.reduce((sum, c) => {
          const before = c.eta_before || 1;
          const diff = (c.eta_before - c.eta_after);
          return sum + (diff / before) * 100;
        }, 0) / completedCorridors.length
      )
    : 42; // default hackathon benchmark metric

  const activeJunctionsControlled = activeCorridor ? activeCorridor.junctions?.length || activeCorridor.routeNodes?.length || 3 : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-wide uppercase flex items-center gap-2">
            <Siren className="h-7 w-7 text-red-500 animate-pulse" />
            Priority Signal Preemption Agent
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Emergency Green Corridor Controls & Dynamic Progress Telemetry
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[10px] text-slate-300 font-mono border border-slate-800 bg-slate-950/60 px-3 py-1 rounded-full uppercase tracking-wider">
            {isLiveConnected ? "Digital Twin Sync: Online" : "Simulation Mode: Offline Fallback"}
          </span>
        </div>
      </div>

      {/* Stats Dashboard Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-slate-800 bg-slate-900/30">
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
            <Clock className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-100 font-mono">{timeSavedTodayMin} m</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Time Saved Today</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-slate-800 bg-slate-900/30">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-100 font-mono">{totalCorridors}</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Corridors Created</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-slate-800 bg-slate-900/30">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-100 font-mono">{avgReductionPercent}%</span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Avg ETA Reduction</span>
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl flex items-center gap-3 border border-slate-800 bg-slate-900/30">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <Sliders className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-slate-100 font-mono">
              {activeJunctionsControlled > 0 ? activeJunctionsControlled : "0"}
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Junctions Controlled</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Dispatch Form */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border border-slate-800/80 bg-slate-950/20 shadow-xl">
            <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2 border-b border-slate-800/40 pb-2.5">
              <Siren className="h-4 w-4 text-red-500" />
              Deploy Preemption Transponder
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Vehicle Type selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                  Vehicle Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleVehicleTypeChange("ambulance")}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      vehicleType === "ambulance"
                        ? "bg-red-500/10 border-red-500/60 text-red-400"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Siren className="h-3.5 w-3.5" />
                    Ambulance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVehicleTypeChange("fire")}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      vehicleType === "fire"
                        ? "bg-amber-500/10 border-amber-500/60 text-amber-450"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    Fire Truck
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVehicleTypeChange("police")}
                    className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                      vehicleType === "police"
                        ? "bg-cyan-500/10 border-cyan-500/60 text-cyan-400"
                        : "bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Shield className="h-3.5 w-3.5" />
                    Police
                  </button>
                </div>
              </div>

              {/* Priority level display */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                  Corridor Priority Rank
                </label>
                <div className="px-4 py-2 bg-slate-900/50 border border-slate-800 text-slate-300 rounded-xl font-mono text-xs flex justify-between items-center">
                  <span>Level {priorityLevel}: {priorityLevel === 1 ? "Critical Priority" : priorityLevel === 2 ? "High Priority" : "Standard Override"}</span>
                  <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-bold">Auto-mapped</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                  Vehicle license plate
                </label>
                <input
                  type="text"
                  value={vehicleNo}
                  onChange={(e) => setVehicleNo(e.target.value)}
                  className="px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-red-500/60 text-sm text-slate-100 rounded-xl focus:outline-none transition-all font-mono"
                  placeholder="e.g. KA-53-MC-1012"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                  Preemption Origin Node
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-red-500/60 text-sm text-slate-100 rounded-xl focus:outline-none transition-all font-mono"
                >
                  {junctions.map((j) => (
                    <option key={j.id} value={j.name}>
                      {j.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                  Destination Emergency Terminal
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-red-500/60 text-sm text-slate-100 rounded-xl focus:outline-none transition-all font-mono"
                >
                  {hospitals.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {formSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex gap-2 text-xs text-emerald-400 font-mono">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 animate-bounce" />
                  <span>Green corridor preemption activated via API route!</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!!activeCorridor}
                className={`w-full mt-2 py-3 font-bold rounded-xl transition-all flex items-center justify-center gap-2 font-mono uppercase text-xs tracking-wider border ${
                  activeCorridor
                    ? "bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 border-red-500 text-white shadow-[0_0_20px_rgba(239,68,68,0.15)] hover:shadow-[0_0_30px_rgba(239,68,68,0.3)]"
                }`}
              >
                <Plus className="h-5 w-5" />
                Initiate Corridor preemption
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Active Corridor Tracker & History */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active Tracker */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border border-slate-800/80 bg-slate-950/20 shadow-xl flex-1 justify-center min-h-[300px]">
            <h2 className="text-xs font-bold text-slate-200 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
              <Navigation className="h-4.5 w-4.5 text-cyan-400 animate-spin" style={{ animationDuration: "3s" }} />
              Live Preemption Corridor Monitor
            </h2>

            {!activeCorridor ? (
              <div className="flex flex-col items-center justify-center flex-1 text-slate-500 text-xs font-mono py-12">
                <Siren className="h-10 w-10 text-slate-700 mb-2" />
                <span>No active emergency preemption loops running.</span>
                <span className="text-[10px] text-slate-650 mt-1">Deploy a transponder to override local traffic networks.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {/* Active Vehicle Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900/60 border border-slate-800/60 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg flex items-center justify-center shrink-0 ${
                      activeCorridor.vehicleType === "ambulance"
                        ? "bg-red-500/10 border border-red-500/20 text-red-400"
                        : activeCorridor.vehicleType === "fire"
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-500"
                        : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                    }`}>
                      {activeCorridor.vehicleType === "ambulance" && <Siren className="h-5 w-5 animate-pulse" />}
                      {activeCorridor.vehicleType === "fire" && <Flame className="h-5 w-5 animate-pulse" />}
                      {activeCorridor.vehicleType === "police" && <Shield className="h-5 w-5 animate-pulse" />}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-100 font-mono tracking-wider">
                        {activeCorridor.vehicleNo}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                        <Route className="h-3.5 w-3.5 text-cyan-400" />
                        {activeCorridor.source} &rarr; {activeCorridor.destination}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex flex-col text-right font-mono">
                      <span className="text-xs font-bold text-cyan-400 flex items-center justify-end gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-cyan-400" />
                        Remaining: {activeCorridor.etaRemaining}s
                      </span>
                      <span className="text-[9px] text-slate-500 uppercase tracking-wider">Estimated Transit</span>
                    </div>
                    <button
                      onClick={() => cancelCorridor(activeCorridor.id)}
                      className="p-2 bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 hover:border-red-800 text-red-400 rounded-lg transition-all"
                      title="Deactivate Preemption & Release Corridor"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar Widget */}
                <div className="flex flex-col gap-2 p-4 bg-slate-900/30 border border-slate-800/40 rounded-xl">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="text-slate-400">Transit Progress</span>
                    <span className="text-cyan-400 font-bold text-sm">{activeCorridor.progress}%</span>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="relative w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-1000 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                      style={{ width: `${activeCorridor.progress}%` }}
                    />
                  </div>

                  {/* Node Checklist Progress */}
                  <div className="flex justify-between items-center text-[9px] text-slate-500 font-mono px-1">
                    <span>DEPLOYED</span>
                    <span>25%</span>
                    <span>50%</span>
                    <span>75%</span>
                    <span>ARRIVED</span>
                  </div>
                </div>

                {/* Micro Metrics cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-900/40 border border-slate-800/40 p-3 rounded-lg flex flex-col font-mono">
                    <span className="text-[9px] text-slate-500 uppercase">Est Distance</span>
                    <span className="text-sm font-bold text-slate-200 mt-0.5">{activeCorridor.distanceKm} km</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/40 p-3 rounded-lg flex flex-col font-mono">
                    <span className="text-[9px] text-slate-500 uppercase">Junctions on path</span>
                    <span className="text-sm font-bold text-slate-200 mt-0.5">{activeJunctionsControlled} Controlled</span>
                  </div>
                  <div className="bg-slate-900/40 border border-slate-800/40 p-3 rounded-lg flex flex-col font-mono">
                    <span className="text-[9px] text-slate-500 uppercase">Preemption savings</span>
                    <span className="text-sm font-bold text-emerald-400 mt-0.5">-{Math.round(activeCorridor.timeSaved / 60)}m {activeCorridor.timeSaved % 60}s</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Historical Log */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 border border-slate-800/80 bg-slate-950/20 shadow-xl max-h-[220px]">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-1.5">
              <History className="h-4 w-4 text-slate-500" />
              Completed Transponder Logs
            </h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 max-h-[140px] pr-1">
              {corridorHistory.length === 0 ? (
                <div className="text-slate-600 text-[10px] font-mono py-8 text-center">
                  No historical priority corridor records found.
                </div>
              ) : (
                [...corridorHistory].reverse().map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] font-mono p-3 rounded-xl bg-slate-900/30 border border-slate-800/50 gap-2 hover:bg-slate-900/50 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.status === "COMPLETED" ? "bg-emerald-500" : "bg-red-500"}`} />
                      <span className="text-slate-300 font-bold">{c.vehicle_no || `CORRIDOR_${c.id.split("_")[1]}`}</span>
                      <span className="text-slate-500 uppercase text-[9px] border border-slate-800 px-1.5 py-0.2 rounded bg-slate-950">
                        {c.vehicle_type}
                      </span>
                      <span className="text-slate-450 text-[10px] hidden md:inline">
                        ({c.origin_name || "Hope Farm"} &rarr; {c.destination_name || "Vydehi"})
                      </span>
                    </div>

                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <span className="text-slate-400 text-[10px]">
                        Saved: <strong className="text-emerald-400">{Math.round(c.time_saved_seconds / 60)}m {c.time_saved_seconds % 60}s</strong>
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        c.status === "COMPLETED"
                          ? "bg-emerald-500/10 text-emerald-450 border border-emerald-900/20"
                          : "bg-red-500/10 text-red-400 border border-red-900/20"
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
