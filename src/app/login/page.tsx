"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTraffic } from "@/context/TrafficContext";
import { Activity, ShieldCheck, Key, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login, currentUser } = useTraffic();
  const router = useRouter();
  const [username, setUsername] = useState("ops_admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If already logged in, redirect
    const savedUser = localStorage.getItem("renew_user");
    if (savedUser || currentUser) {
      router.push("/");
    }
  }, [currentUser, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill in all operational access fields.");
      return;
    }

    setLoading(true);

    // Simulate database lookup latency
    setTimeout(() => {
      login(username);
      setLoading(false);
      router.push("/");
    }, 1200);
  };

  const handlePublicAccess = () => {
    setLoading(true);
    setTimeout(() => {
      login("Guest Commuter", "Public Commuter");
      setLoading(false);
      router.push("/");
    }, 800);
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center bg-[#05070f] overflow-hidden">
      {/* Abstract Glowing City Network background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-cyan-900/10 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[10%] w-[500px] h-[500px] rounded-full bg-emerald-900/10 blur-[150px]" />
        
        {/* Custom background grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.2)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      </div>

      {/* Main glass card container */}
      <div className="relative z-10 w-full max-w-md p-8 rounded-3xl glass-panel-heavy border border-slate-800/80 shadow-2xl flex flex-col gap-6 mx-4">
        {/* Header Branding */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-emerald-500 shadow-[0_0_25px_rgba(6,182,212,0.45)]">
            <Activity className="h-8 w-8 text-[#05070f]" />
          </div>
          <div className="flex flex-col mt-2">
            <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              RENEW
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase mt-1">
              Smart City Traffic Control Gateway
            </p>
          </div>
        </div>

        {/* Status notification banner */}
        <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl flex gap-3 text-xs text-cyan-300 font-mono">
          <ShieldCheck className="h-5 w-5 text-cyan-400 shrink-0" />
          <div>
            <span className="font-bold">SECURE CHANNEL ACTIVE</span>
            <p className="text-[10px] text-cyan-400/80 mt-0.5">Authorization credentials required to access system controls.</p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              Operator Username
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500/80 text-sm text-slate-100 rounded-xl focus:outline-none transition-all duration-300 font-mono"
                placeholder="Enter operator username..."
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
              Operational Keycode
            </label>
            <div className="relative flex items-center">
              <Key className="absolute left-3.5 h-4.5 w-4.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-cyan-500/80 text-sm text-slate-100 rounded-xl focus:outline-none transition-all duration-300 font-mono tracking-widest"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-xl flex gap-2 text-xs text-red-400 font-mono animate-shake">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-bold rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] hover:shadow-[0_0_35px_rgba(6,182,212,0.45)] transition-all duration-300 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Activity className="h-5 w-5 animate-spin" />
                <span className="font-mono text-xs">SYNCHRONIZING ACCESS...</span>
              </>
            ) : (
              <span>ESTABLISH CONNECTION</span>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800/80"></div></div>
          <span className="relative px-3 text-[10px] text-slate-500 font-mono bg-[#05070f]">OR</span>
        </div>

        <button
          onClick={handlePublicAccess}
          type="button"
          className="w-full py-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-slate-700 text-slate-350 hover:text-slate-100 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 font-mono text-xs shadow-md hover:shadow-lg"
        >
          <User className="h-4 w-4 text-emerald-400" />
          ACCESS PUBLIC COMMUTER PORTAL
        </button>

        {/* Credentials hints for demo */}
        <div className="border-t border-slate-800/80 pt-4 flex flex-col items-center">
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            Operator Credentials
          </span>
          <div className="flex gap-4 text-xs font-mono text-slate-400 mt-1.5">
            <span>User: <strong className="text-cyan-400">ops_admin</strong></span>
            <span>Key: <strong className="text-emerald-400">admin123</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}
