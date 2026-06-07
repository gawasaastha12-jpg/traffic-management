"use client";

import React, { useState } from "react";
import { useTraffic } from "@/context/TrafficContext";
import {
  Settings,
  Bell,
  Cpu,
  ShieldCheck,
  Save,
  Key,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const { settings, updateSettings } = useTraffic();
  const [critical, setCritical] = useState(settings.criticalThreshold);
  const [warning, setWarning] = useState(settings.warningThreshold);
  const [interval, setIntervalVal] = useState(settings.aiOptimizationInterval);
  const [alertsEnabled, setAlertsEnabled] = useState(settings.alertsEnabled);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      criticalThreshold: critical,
      warningThreshold: warning,
      aiOptimizationInterval: interval,
      alertsEnabled,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 font-mono tracking-wide uppercase">
          SYSTEM PREFERENCES & GATEWAYS
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-0.5">
          Configure adaptive signal AI triggers, latency variables, and notification nodes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Panel: Primary Configuration */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5">
            <h2 className="text-sm font-extrabold text-slate-200 tracking-wider uppercase font-mono flex items-center gap-2 border-b border-slate-800/40 pb-2.5">
              <Settings className="h-5 w-5 text-cyan-400" />
              Threshold Parameters
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-5">
              {/* Critical Congestion Index Slider */}
              <div className="flex flex-col gap-2 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Critical Congestion Alert (Red)</span>
                  <span className="text-red-400 font-bold">{critical}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="95"
                  value={critical}
                  onChange={(e) => setCritical(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">
                  Defines when a junction triggers a priority red flash alarm.
                </span>
              </div>

              {/* Warning Congestion Index Slider */}
              <div className="flex flex-col gap-2 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">Warning Congestion Index (Amber)</span>
                  <span className="text-amber-400 font-bold">{warning}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="59"
                  value={warning}
                  onChange={(e) => setWarning(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">
                  Defines when a junction flags caution delay thresholds.
                </span>
              </div>

              {/* AI Sequencing Duration Slider */}
              <div className="flex flex-col gap-2 font-mono">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">AI Optimization Re-routing Interval</span>
                  <span className="text-cyan-400 font-bold">{interval} sec</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  value={interval}
                  onChange={(e) => setIntervalVal(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
                />
                <span className="text-[10px] text-slate-500">
                  Frequency of AI sensor calculations for adaptive phase matching.
                </span>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-3.5 border-t border-slate-800/40 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-slate-300">Push Emergency Notifications</span>
                    <span className="text-[10px] text-slate-500">
                      Instantly issue alert prompts on siren activations.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alertsEnabled}
                      onChange={(e) => setAlertsEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500 peer-checked:after:bg-slate-950 peer-checked:after:border-transparent"></div>
                  </label>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl flex gap-2 text-xs text-emerald-400 font-mono">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>System parameters committed and synchronized.</span>
                </div>
              )}

              <button
                type="submit"
                className="mt-2 py-3 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 font-mono uppercase text-xs tracking-wider"
              >
                <Save className="h-5 w-5" />
                Commit Grid Parameters
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Metadata & Security Keys */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Security Keys */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-amber-500" />
              API Gateway Keys
            </h2>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase">Map Telemetry Key (CartoDB)</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value="carto_dark_all_token_88ab23fde11"
                    readOnly
                    className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-400 focus:outline-none select-all"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-500 uppercase">ML Model Endpoint</span>
                <input
                  type="text"
                  value="https://ai.renew.blr/predict/v4"
                  readOnly
                  className="w-full px-3 py-2 bg-slate-950/60 border border-slate-900 rounded-lg text-slate-400 focus:outline-none select-all"
                />
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono border-b border-slate-800/40 pb-2 flex items-center gap-2">
              <Info className="h-4.5 w-4.5 text-cyan-400" />
              System Specs
            </h2>
            <div className="flex flex-col gap-2 font-mono text-xs text-slate-400">
              <div className="flex justify-between">
                <span>RENEW core release:</span>
                <span className="text-slate-200">v4.1.0-alpha</span>
              </div>
              <div className="flex justify-between">
                <span>Telemetry engine:</span>
                <span className="text-slate-200">Next.js + Leaflet</span>
              </div>
              <div className="flex justify-between">
                <span>Node interface:</span>
                <span className="text-slate-200">Windows Server Node 24</span>
              </div>
              <div className="flex justify-between">
                <span>Sector cluster ID:</span>
                <span className="text-slate-200">BLR-WFD-18012</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
