"use client";

import React from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline } from "react-leaflet";
import L from "leaflet";
import { useTraffic, Junction, Ambulance } from "@/context/TrafficContext";

// Glowing pulse animations for junctions
const getJunctionIcon = (junction: Junction) => {
  let pulseClass = "marker-glow-emerald";
  
  if (junction.greenCorridorActive) {
    pulseClass = "marker-glow-green-corridor";
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

// SVG Icon for Ambulances
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

// SVG Icon for BMTC Buses
const getBusIcon = (bus: any) => {
  return L.divIcon({
    className: "relative",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
    html: `
      <div class="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-600 border border-slate-300 shadow-[0_0_8px_rgba(99,102,241,0.5)]">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-white">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 8h8"/>
          <path d="M8 12h8"/>
          <path d="M12 16h.01"/>
        </svg>
      </div>
    `,
  });
};

// Warning alerts icon mapping (TomTom incidents)
const getIncidentIcon = (severity: string) => {
  const color = severity === "critical" ? "bg-red-500/20 border-red-500 text-red-500" : "bg-amber-500/20 border-amber-500 text-amber-500";
  return L.divIcon({
    className: "relative",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
    html: `
      <div class="flex items-center justify-center w-6 h-6 rounded-full border ${color} shadow-[0_0_10px_rgba(239,68,68,0.2)] animate-pulse">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>
    `,
  });
};

export default function InteractiveMap() {
  const { junctions, ambulances, activeBuses, alerts, toggleGreenCorridor, overrideSignalMode, weather, activeCorridor } = useTraffic();

  // Whitefield area central coordinates
  const position: [number, number] = [12.9698, 77.7500];

  return (
    <div className="w-full h-full relative overflow-hidden rounded-2xl border border-slate-800/80">
      <MapContainer
        center={position}
        zoom={13.5}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Rain overlay - if weather records precipitation, render a subtle blue wash over the map */}
        {weather.rainfall > 0.0 && (
          <Circle
            center={position}
            radius={4000}
            pathOptions={{
              fillColor: "#0284c7",
              fillOpacity: Math.min(0.12, weather.rainfall * 0.02),
              stroke: false
            }}
          />
        )}

        {/* Heatmap overlay (transparent circles around congested nodes) */}
        {junctions.map((junction) => {
          if (junction.congestionLevel > 50 && !junction.greenCorridorActive) {
            const color = junction.congestionLevel > 80 ? "#ef4444" : "#fbbf24";
            const radius = junction.congestionLevel * 5;
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

        {/* Active Emergency Corridor Polyline Overlay */}
        {activeCorridor && activeCorridor.routeCoordinates && activeCorridor.routeCoordinates.length > 0 && (
          <>
            {/* Glowing outer polyline */}
            <Polyline
              positions={activeCorridor.routeCoordinates}
              pathOptions={{
                color: "#10b981",
                weight: 8,
                opacity: 0.35,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
            {/* Bright inner polyline */}
            <Polyline
              positions={activeCorridor.routeCoordinates}
              pathOptions={{
                color: "#059669",
                weight: 4,
                opacity: 0.9,
                lineCap: "round",
                lineJoin: "round"
              }}
            />
          </>
        )}

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
                </div>

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
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full font-bold">
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
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Live BMTC Bus Layer */}
        {activeBuses.map((bus) => (
          <Marker
            key={bus.id}
            position={[bus.lat, bus.lng]}
            icon={getBusIcon(bus)}
          >
            <Popup>
              <div className="p-3 bg-slate-950 text-slate-100 rounded-lg min-w-[160px] border border-slate-800 shadow-xl font-sans text-xs">
                <div className="flex justify-between items-center mb-2 pb-1 border-b border-indigo-900/40">
                  <span className="font-bold text-indigo-400 font-mono">{bus.route_no}</span>
                  <span className="text-[9px] px-1.5 bg-indigo-500/10 text-indigo-400 rounded border border-indigo-500/20">BMTC BUS</span>
                </div>
                <div>
                  <span className="text-slate-400">Status:</span>{" "}
                  <span className="font-semibold text-emerald-400 font-mono">{bus.status}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Live Incident Markers (TomTom Ingestion) */}
        {alerts
          .filter((a) => !a.resolved && a.id.startsWith("inc-"))
          .map((alert: any) => {
            // Find coordinate points from alert model if attached
            // Using default offsets to prevent map crash if missing coords
            const lat = alert.lat || 12.9739 + (Math.random() - 0.5) * 0.02;
            const lng = alert.lng || 77.7126 + (Math.random() - 0.5) * 0.02;
            return (
              <Marker
                key={alert.id}
                position={[lat, lng]}
                icon={getIncidentIcon(alert.severity)}
              >
                <Popup>
                  <div className="p-3 bg-slate-950 text-slate-100 rounded-lg min-w-[180px] border border-slate-800 shadow-xl font-sans text-xs">
                    <h4 className="font-bold text-red-400 mb-1 flex items-center gap-1.5">
                      ⚠️ {alert.title}
                    </h4>
                    <p className="text-slate-300 leading-relaxed">{alert.message}</p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 left-4 z-20 glass-panel p-3 rounded-xl flex flex-col gap-1.5 font-mono text-[9px] text-slate-300">
        <span className="font-bold text-xs text-slate-200 border-b border-slate-800 pb-1 mb-1">LIVE DIGITAL TWIN LAYERS</span>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span>Junction Normal (&lt; 50% delay)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span>Junction Warning (50%-80% delay)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
          <span>Junction Critical (&gt; 80% delay)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
          <span>Live BMTC Bus Transponder</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-white" />
          <span>Active Ambulance Transponder</span>
        </div>
        {weather.rainfall > 0.0 && (
          <div className="text-cyan-400 font-bold mt-1 uppercase text-[8px] animate-pulse">
            🌧️ RAIN OVERLAY ACTIVE ({weather.rainfall} mm/h)
          </div>
        )}
      </div>
    </div>
  );
}
