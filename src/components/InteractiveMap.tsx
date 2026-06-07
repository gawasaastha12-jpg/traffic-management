"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { useTraffic, Junction, Ambulance } from "@/context/TrafficContext";

// Fix Leaflet issue where images are searched in relative paths
// Using custom divIcons resolves this elegantly while providing modern glowing markers.
const getJunctionIcon = (junction: Junction) => {
  let pulseClass = "marker-glow-emerald";
  
  if (junction.greenCorridorActive) {
    pulseClass = "marker-glow-cyan";
  } else if (junction.status === "warning") {
    pulseClass = "marker-glow-amber";
  } else if (junction.status === "critical") {
    pulseClass = "marker-glow-red";
  }

  return L.divIcon({
    className: `w-5 h-5 ${pulseClass}`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
    html: `<div class="relative flex items-center justify-center w-5 h-5 rounded-full"><div class="w-2.5 h-2.5 rounded-full bg-white opacity-80"></div></div>`,
  });
};

const getAmbulanceIcon = (ambulance: Ambulance) => {
  return L.divIcon({
    className: "relative",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
    html: `
      <div class="flex items-center justify-center w-7 h-7 rounded-xl bg-red-600 border-2 border-white shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-bounce">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1 .4-1 1v7h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
          <path d="M4 12H2v-2c0-.6.4-1 1-1h1"/>
          <path d="M12 12v3"/>
          <path d="M10 13.5h4"/>
        </svg>
      </div>
    `,
  });
};

export default function InteractiveMap() {
  const { junctions, ambulances, toggleGreenCorridor, overrideSignalMode } = useTraffic();

  // Whitefield area central coordinates
  const position: [number, number] = [12.972, 77.735];

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-slate-800/80">
      <MapContainer
        center={position}
        zoom={13.5}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        {/* CartoDB Dark Matter tile layer for an elegant, glowing dark mode map */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Heatmap overlay (simulated with transparent circles around congested nodes) */}
        {junctions.map((junction) => {
          if (junction.congestionLevel > 50 && !junction.greenCorridorActive) {
            const color = junction.congestionLevel > 80 ? "#ef4444" : "#fbbf24";
            const radius = junction.congestionLevel * 5; // higher congestion = larger radius
            return (
              <Circle
                key={`heat-${junction.id}`}
                center={[junction.lat, junction.lng]}
                radius={radius}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.18,
                  stroke: false,
                }}
              />
            );
          }
          return null;
        })}

        {/* Junction Markers */}
        {junctions.map((junction) => (
          <Marker
            key={junction.id}
            position={[junction.lat, junction.lng]}
            icon={getJunctionIcon(junction)}
          >
            <Popup className="custom-popup">
              <div className="p-3 bg-slate-950 text-slate-100 rounded-lg min-w-[200px] border border-slate-800 shadow-xl font-sans text-xs">
                <div className="flex justify-between items-start mb-2 pb-1.5 border-b border-slate-800">
                  <h4 className="font-bold text-sm text-slate-200">{junction.name}</h4>
                </div>

                <div className="flex flex-col gap-1.5 mb-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Congestion:</span>
                    <span
                      className={`font-semibold ${
                        junction.congestionLevel > 80
                          ? "text-red-400"
                          : junction.congestionLevel > 50
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {junction.congestionLevel}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Queue Length:</span>
                    <span className="font-semibold text-slate-200">{junction.queueLength}m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Avg Wait Time:</span>
                    <span className="font-semibold text-slate-200">{junction.averageWaitTime}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Signal Mode:</span>
                    <span className="font-semibold text-cyan-400">{junction.signalMode}</span>
                  </div>
                  {junction.greenCorridorActive && (
                    <div className="mt-1 text-center py-0.5 px-1 bg-cyan-950/60 border border-cyan-800/80 text-cyan-400 font-bold rounded text-[10px] animate-pulse">
                      GREEN CORRIDOR ACTIVE
                    </div>
                  )}
                </div>

                {/* Control Panel Actions */}
                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    onClick={() => toggleGreenCorridor(junction.id)}
                    className={`w-full py-1.5 rounded font-bold text-center transition-all ${
                      junction.greenCorridorActive
                        ? "bg-red-500/15 border border-red-500/35 text-red-400 hover:bg-red-500/25"
                        : "bg-cyan-500/15 border border-cyan-500/35 text-cyan-400 hover:bg-cyan-500/25"
                    }`}
                  >
                    {junction.greenCorridorActive ? "Deactivate Corridor" : "Trigger Green Corridor"}
                  </button>

                  <div className="flex gap-1 justify-between">
                    <button
                      onClick={() => overrideSignalMode(junction.id, "Adaptive AI")}
                      className={`flex-1 text-[9px] py-1 rounded border text-center transition-all ${
                        junction.signalMode === "Adaptive AI"
                          ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      AI Adaptive
                    </button>
                    <button
                      onClick={() => overrideSignalMode(junction.id, "Manual Override")}
                      className={`flex-1 text-[9px] py-1 rounded border text-center transition-all ${
                        junction.signalMode === "Manual Override"
                          ? "bg-amber-500/10 border-amber-500 text-amber-400 font-bold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      Manual
                    </button>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Emergency Vehicle Markers */}
        {ambulances
          .filter((a) => a.status !== "Completed")
          .map((amb) => (
            <Marker
              key={amb.id}
              position={[amb.lat, amb.lng]}
              icon={getAmbulanceIcon(amb)}
            >
              <Popup>
                <div className="p-3 bg-slate-950 text-slate-100 rounded-lg min-w-[200px] border border-slate-800 shadow-xl font-sans text-xs">
                  <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-red-900/40">
                    <span className="font-bold text-red-400 font-mono">{amb.vehicleNo}</span>
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-bold animate-pulse">
                      {amb.status}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mb-2">
                    <div>
                      <span className="text-slate-400">Route:</span>{" "}
                      <span className="font-semibold text-slate-200">
                        {amb.source} &rarr; {amb.destination}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Hospital ETA:</span>{" "}
                      <span className="font-semibold text-cyan-400 font-mono">{amb.eta} mins</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Corridor Signal:</span>{" "}
                      <span
                        className={`font-semibold ${
                          amb.greenCorridorRequested ? "text-cyan-400" : "text-amber-400"
                        }`}
                      >
                        {amb.greenCorridorRequested ? "Engaged (Green)" : "Not Engaged"}
                      </span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel p-3 rounded-xl flex flex-col gap-1.5 font-mono text-[10px] text-slate-300">
        <span className="font-bold text-xs text-slate-200 border-b border-slate-800 pb-1 mb-1">MAP LEGEND</span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>Junction Normal (Flow &lt; 50%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span>Junction Warning (Flow 50%-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span>Junction Critical (Flow &gt; 80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
          <span>Green Corridor Priority Active</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="w-4 h-4 rounded bg-red-600 border border-white flex items-center justify-center text-[8px] font-bold text-white shadow-md">🚑</span>
          <span>Active Ambulance Transponder</span>
        </div>
      </div>
    </div>
  );
}
