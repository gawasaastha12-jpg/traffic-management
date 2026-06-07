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
  Compass,
} from "lucide-react";

export default function EmergencyControlPage() {
  const { ambulances, junctions, triggerEmergencyRoute } = useTraffic();
  const [vehicleNo, setVehicleNo] = useState("KA-53-E-8802");
  const [source, setSource] = useState(junctions[0]?.name || "");
  const [destination, setDestination] = useState("Vydehi Hospital");
  const [formSuccess, setFormSuccess] = useState(false);

  const activeAmbulances = ambulances.filter((a) => a.status !== "Completed");
  const completedAmbulances = ambulances.filter((a) => a.status === "Completed");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleNo.trim() || !source || !destination) return;

    triggerEmergencyRoute(source, destination, vehicleNo);
    setFormSuccess(true);
    setTimeout(() => {
      setFormSuccess(false);
      setVehicleNo(`KA-53-E-${Math.floor(1000 + Math.random() * 9000)}`);
    }, 2500);
  };

  const hospitals = [
    "Vydehi Hospital",
    "Sakra World Hospital",
    "Manipal Hospital Whitefield",
    "Columbia Asia Whitefield",
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-wide uppercase">
          EMERGENCY DISPATCH & ROUTING INTERFACE
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Priority vehicle routing systems and emergency corridor allocation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Dispatch Form */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
            <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2 border-b border-slate-800/40 pb-2.5">
              <Siren className="h-5 w-5 text-red-500 animate-pulse" />
              Deploy Priority Transponder
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-400 font-mono uppercase">
                  Vehicle Transponder Code (License Plate)
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
                  Incident Start Node
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
                  Destination Emergency Terminal (Hospital)
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
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>Transponder deployed! Green Corridor engaged.</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full mt-2 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:shadow-[0_0_30px_rgba(239,68,68,0.4)] transition-all flex items-center justify-center gap-2 font-mono uppercase text-xs tracking-wider"
              >
                <Plus className="h-5 w-5" />
                INITIATE INTERACTION ROUTE
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Monitors */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active Priority Feeds */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 flex-1">
            <h2 className="text-xs font-extrabold text-slate-200 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
              <Navigation className="h-4.5 w-4.5 text-cyan-400" />
              Active Priority Transponders
            </h2>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 max-h-[260px]">
              {activeAmbulances.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 text-xs font-mono py-12">
                  <span>No active emergency transponders en-route.</span>
                </div>
              ) : (
                activeAmbulances.map((amb) => (
                  <div
                    key={amb.id}
                    className="p-4 bg-slate-950/50 border border-slate-900 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0">
                        <Siren className="h-5 w-5 animate-pulse" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-extrabold text-slate-100 font-mono">
                          {amb.vehicleNo}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                          <Route className="h-3.5 w-3.5 text-cyan-400" />
                          {amb.source} &rarr; {amb.destination}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="flex flex-col text-right font-mono">
                        <span className="text-xs font-bold text-cyan-400 flex items-center gap-1">
                          <Clock className="h-3 w-3 inline text-cyan-400" />
                          ETA: {amb.eta} mins
                        </span>
                        <span className="text-[9px] text-slate-500 uppercase">Hospital Path</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          amb.status === "Stuck"
                            ? "bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse"
                            : "bg-cyan-500/10 border border-cyan-500/20 text-cyan-400"
                        }`}
                      >
                        {amb.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Historical Log */}
          <div className="glass-panel p-5 rounded-2xl flex flex-col gap-3 min-h-[160px] overflow-hidden">
            <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2">
              Completed Transponder Logs
            </h2>
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 max-h-[120px]">
              {completedAmbulances.length === 0 ? (
                <div className="text-slate-650 text-[10px] font-mono py-4 text-center">
                  No historical transponder logs for current operational cycle.
                </div>
              ) : (
                completedAmbulances.map((amb) => (
                  <div
                    key={amb.id}
                    className="flex justify-between items-center text-[11px] font-mono p-2 rounded bg-slate-950/20 border border-slate-900"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">{amb.vehicleNo}</span>
                      <span className="text-slate-500">
                        ({amb.source} &rarr; {amb.destination})
                      </span>
                    </div>
                    <span className="text-emerald-400 flex items-center gap-1 font-bold">
                      <CheckCircle2 className="h-3 w-3 inline text-emerald-400" />
                      ARRIVED
                    </span>
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
