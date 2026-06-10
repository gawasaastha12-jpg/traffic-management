"use client";

import React, { useState, useEffect } from "react";
import { useTraffic, Junction } from "@/context/TrafficContext";
import {
  Activity,
  Sliders,
  Play,
  RotateCcw,
  Video,
  VideoOff,
  Eye,
  AlertOctagon,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function JunctionsPage() {
  const { junctions, toggleGreenCorridor, overrideSignalMode, currentUser } = useTraffic();
  const isOperator = currentUser?.role === "Traffic Operations Manager";
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>(junctions[0]?.id || "");
  const [cameraFeedActive, setCameraFeedActive] = useState(true);
  const [yoloResult, setYoloResult] = useState<any>(null);

  const selectedJunction = junctions.find((j) => j.id === selectedJunctionId);

  useEffect(() => {
    if (!selectedJunctionId || !cameraFeedActive) return;

    const fetchCameraTelemetry = async () => {
      try {
        const apiBase = (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL !== "undefined")
          ? process.env.NEXT_PUBLIC_API_URL
          : "http://127.0.0.1:8000";
        console.log("FETCHING camera URL:", `${apiBase}/api/grid/camera/${selectedJunctionId}`);
        const res = await fetch(`${apiBase}/api/grid/camera/${selectedJunctionId}`);
        if (res.ok) {
          const data = await res.json();
          setYoloResult(data);
        }
      } catch (e) {
        console.error("Failed to fetch camera YOLO telemetry:", e);
      }
    };

    fetchCameraTelemetry();
    const interval = setInterval(fetchCameraTelemetry, 3000); // Poll every 3 seconds for active camera feeds
    return () => clearInterval(interval);
  }, [selectedJunctionId, cameraFeedActive]);

  // Status visual maps
  const statusColorMap = {
    normal: { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/35" },
    warning: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/35" },
    critical: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/35" },
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-wide uppercase">
          JUNCTION CAMERA FEED & MONITORING
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          AI Adaptive signal sequencing override and video telemetrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Junction Selector List */}
        <div className="lg:col-span-4 flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-semibold">
            Select Node Terminal
          </span>
          {junctions.map((junction) => {
            const colors = statusColorMap[junction.status];
            const isSelected = selectedJunctionId === junction.id;

            return (
              <button
                key={junction.id}
                onClick={() => setSelectedJunctionId(junction.id)}
                className={`glass-panel p-4 rounded-2xl border text-left flex justify-between items-center transition-all ${
                  isSelected
                    ? "bg-slate-900 border-cyan-500/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                    : "border-slate-800 hover:border-slate-700 hover:bg-slate-900/40"
                }`}
              >
                <div className="flex flex-col gap-1 min-w-0">
                  <span className={`text-xs font-bold ${isSelected ? "text-cyan-400" : "text-slate-200"} truncate`}>
                    {junction.name}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-slate-500">
                      Mode: {junction.signalMode}
                    </span>
                    <span className={`text-[8px] font-mono font-bold px-1 rounded-sm flex items-center gap-0.5 ${
                      junction.dataSource === "live" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${junction.dataSource === "live" ? "bg-emerald-400 animate-pulse" : "bg-blue-400"}`} />
                      {junction.dataSource === "live" ? "LIVE" : "SIMULATED"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border}`}
                  >
                    {junction.congestionLevel}%
                  </span>
                  {junction.greenCorridorActive && (
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Selected Junction Control Center */}
        {selectedJunction ? (
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Live feed simulator */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 flex flex-col h-[380px] relative">
              {/* CCTV Header info */}
              <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center text-xs font-mono bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 backdrop-blur">
                <div className="flex items-center gap-2">
                  <Video className="h-4.5 w-4.5 text-red-500 animate-pulse" />
                  <span className="font-bold text-slate-300">LIVE FEED: FEED_{selectedJunction.id.toUpperCase()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                    selectedJunction.dataSource === "live"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${selectedJunction.dataSource === "live" ? "bg-emerald-400 animate-pulse" : "bg-blue-400"}`} />
                    {selectedJunction.dataSource === "live" ? "LIVE DATA" : "SIMULATED DATA"}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    fps: 30.0
                  </span>
                  <span className="text-slate-400">LAT: {selectedJunction.lat.toFixed(4)}</span>
                  <span className="text-slate-400">LNG: {selectedJunction.lng.toFixed(4)}</span>
                </div>
              </div>

              {/* Feed Screen */}
              {cameraFeedActive ? (
                <div className="w-full h-full bg-slate-950 flex items-center justify-center relative select-none">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.03)_1px,transparent_1px)] bg-[size:24px_24px]" />
                  
                  {/* Camera Scanning bar */}
                  <div className="absolute left-0 w-full h-[2px] bg-cyan-500/30 shadow-[0_0_15px_#06b6d4] animate-bounce z-10" style={{ animationDuration: "6s" }} />

                  {/* Real YOLOv8 scanning bounding boxes */}
                  {yoloResult?.detections?.map((det: any) => (
                    <div
                      key={det.id}
                      className="absolute border-2 p-1 flex flex-col gap-0.5 font-mono text-[8px] font-bold animate-pulse"
                      style={{
                        borderColor: det.color,
                        color: det.color,
                        left: `${(det.box[0] / 640) * 100}%`,
                        top: `${(det.box[1] / 360) * 100}%`,
                        width: `${((det.box[2] - det.box[0]) / 640) * 100}%`,
                        height: `${((det.box[3] - det.box[1]) / 360) * 100}%`,
                        boxShadow: `0 0 8px ${det.color}40`,
                      }}
                    >
                      <span className="truncate bg-slate-950/80 px-1 rounded">{det.label}</span>
                      <span className="bg-slate-950/80 px-1 rounded">POS: {det.queue_position}</span>
                    </div>
                  ))}

                  <div className="text-center flex flex-col items-center gap-2">
                    <span className="text-slate-500 font-mono text-xs tracking-wider">
                      [ DIGITAL CCTV MATRIX ACTIVE ]
                    </span>
                    <span className="text-[10px] text-cyan-500/60 font-mono animate-pulse">
                      VEHICLE RECOGNITION ALGORITHM DETECTING {yoloResult?.vehicle_count ?? Math.round(selectedJunction.queueLength / 12)} UNITS
                    </span>
                  </div>

                  {/* Emergency Warning overlays */}
                  {selectedJunction.greenCorridorActive && (
                    <div className="absolute inset-0 bg-cyan-500/5 border-4 border-cyan-500/40 animate-pulse flex items-center justify-center pointer-events-none">
                      <div className="bg-cyan-950/90 border border-cyan-500/60 px-5 py-2.5 rounded-xl flex items-center gap-3 text-cyan-400 font-mono font-bold tracking-widest text-xs shadow-2xl">
                        <Zap className="h-5 w-5 text-cyan-400 animate-spin" />
                        EMERGENCY GREEN CORRIDOR OVERRIDE
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full bg-slate-950 flex flex-col items-center justify-center gap-3">
                  <VideoOff className="h-12 w-12 text-slate-700" />
                  <span className="text-xs text-slate-500 font-mono">CAMERA TELEMETRY LINK DISCONNECTED</span>
                </div>
              )}

              {/* Feed Controls Footer */}
              <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center z-20">
                <button
                  onClick={() => setCameraFeedActive(!cameraFeedActive)}
                  className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-mono transition-colors"
                >
                  {cameraFeedActive ? "DISABLE FEED" : "ENABLE FEED"}
                </button>
                <div className="text-slate-500 text-[10px] font-mono uppercase">
                  Telemetry ID: {selectedJunction.id}
                </div>
              </div>
            </div>

            {/* Junction Control Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Telemetry Stats */}
              <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3.5">
                <h3 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-cyan-400" />
                  Telemetry Dashboard
                </h3>
                <div className="grid grid-cols-2 gap-3.5 text-xs font-mono">
                  <div className="bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-xl flex flex-col">
                    <span className="text-slate-500 text-[9px] uppercase">Congestion Index</span>
                    <span className={`text-lg font-bold mt-1 ${selectedJunction.congestionLevel > 80 ? "text-red-400" : selectedJunction.congestionLevel > 50 ? "text-amber-400" : "text-emerald-400"}`}>
                      {selectedJunction.congestionLevel}%
                    </span>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-xl flex flex-col">
                    <span className="text-slate-500 text-[9px] uppercase">Active Lanes</span>
                    <span className="text-lg font-bold text-slate-200 mt-1">
                      {selectedJunction.activeLanes} / 4 Lanes
                    </span>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-xl flex flex-col">
                    <span className="text-slate-500 text-[9px] uppercase">Queue Backlog</span>
                    <span className="text-lg font-bold text-slate-200 mt-1">
                      {selectedJunction.queueLength} meters
                    </span>
                  </div>
                  <div className="bg-slate-950/40 border border-slate-900/60 p-2.5 rounded-xl flex flex-col">
                    <span className="text-slate-500 text-[9px] uppercase">Avg Crossing Wait</span>
                    <span className="text-lg font-bold text-slate-200 mt-1">
                      {selectedJunction.averageWaitTime} sec
                    </span>
                  </div>
                </div>
              </div>

              {/* Manual Override Controls */}
              {isOperator ? (
                <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3.5">
                  <h3 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
                    <Sliders className="h-4.5 w-4.5 text-amber-500" />
                    Override Operations
                  </h3>

                  <div className="flex flex-col gap-3">
                    {/* Select Mode */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[9px] text-slate-500 font-mono uppercase">System Sequencing Mode</label>
                      <div className="grid grid-cols-3 gap-1">
                        {["Adaptive AI", "Manual Override", "Fixed Timing"].map((mode) => (
                          <button
                            key={mode}
                            onClick={() => overrideSignalMode(selectedJunction.id, mode as any)}
                            className={`text-[9px] font-mono py-2 rounded-lg border text-center transition-all ${
                              selectedJunction.signalMode === mode
                                ? "bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold"
                                : "bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Manual Controls actions */}
                    <div className="flex flex-col gap-2 mt-1">
                      <button
                        onClick={() => toggleGreenCorridor(selectedJunction.id)}
                        className={`w-full py-2.5 rounded-xl font-bold text-center text-xs transition-all uppercase flex items-center justify-center gap-2 ${
                          selectedJunction.greenCorridorActive
                            ? "bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400"
                            : "bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                        }`}
                      >
                        {selectedJunction.greenCorridorActive ? (
                          <>
                            <AlertOctagon className="h-4.5 w-4.5 animate-pulse" />
                            <span>TERMINATE CORRIDOR PATH</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="h-4.5 w-4.5" />
                            <span>ENGAGE EMERGENCY GREEN PATH</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3.5 bg-slate-900/10 border-slate-800/40 text-slate-400 font-mono text-xs">
                  <h3 className="text-xs font-extrabold text-slate-300 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
                    <ShieldCheck className="h-4.5 w-4.5 text-cyan-450" />
                    Commuter Services
                  </h3>
                  <div className="flex flex-col gap-2 mt-1">
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      Adaptive traffic signals are currently being managed automatically by the Central AI Agent. 
                    </p>
                    <div className="p-3.5 bg-cyan-950/20 border border-cyan-900/30 rounded-xl text-cyan-400 text-[10px] leading-relaxed">
                      <strong>COMMUTER NOTICE:</strong> In case of an emergency vehicle approach, the signal will automatically prioritize their corridor. Please yield immediately.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 glass-panel rounded-2xl flex items-center justify-center py-20 text-slate-500 text-sm font-mono">
            Please select an operational junction terminal to view camera feeds and override controls.
          </div>
        )}
      </div>
    </div>
  );
}
