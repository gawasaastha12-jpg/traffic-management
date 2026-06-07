"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTraffic } from "@/context/TrafficContext";
import {
  LayoutDashboard,
  Map,
  ShieldAlert,
  TrendingUp,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  Bell,
  Clock,
  User,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, logout, alerts } = useTraffic();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState("");

  // Redirect to login if user not logged in
  useEffect(() => {
    // Check localStorage in case context hasn't loaded yet
    const savedUser = localStorage.getItem("renew_user");
    if (!savedUser && !currentUser) {
      router.push("/login");
    }
  }, [currentUser, router]);

  // Live system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Junctions", href: "/junctions", icon: Activity },
    { name: "Emergency Control", href: "/emergency", icon: ShieldAlert },
    { name: "Predictions", href: "/predictions", icon: TrendingUp },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const unreadAlertsCount = alerts.filter((a) => !a.resolved).length;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#060814] text-cyan-400 font-mono">
        <div className="flex flex-col items-center gap-3">
          <Activity className="h-10 w-10 animate-spin" />
          <span>INITIALIZING RENEW CONTROL SYSTEM...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#060814] text-slate-100">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-[#090d1a] border-r border-slate-800/80 p-5 shrink-0 justify-between">
        <div className="flex flex-col gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Activity className="h-6 w-6 text-[#060814]" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                RENEW
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-widest">
                SMART TRAFFIC CONTROL
              </span>
            </div>
          </div>

          {/* System Status Panel */}
          <div className="glass-panel p-3.5 rounded-xl flex flex-col gap-2 font-mono text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">SYS STATUS:</span>
              <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                ONLINE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">SECTOR:</span>
              <span className="text-cyan-400 font-semibold">BLR-WHITEFIELD</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">TIME:</span>
              <span className="text-slate-300 font-semibold flex items-center gap-1">
                <Clock className="h-3 w-3 text-cyan-400 inline" />
                {time || "00:00:00"}
              </span>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 group ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-400 font-semibold shadow-[inset_0_0_12px_rgba(6,182,212,0.08)]"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon
                      className={`h-5 w-5 transition-transform duration-300 group-hover:scale-105 ${
                        isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                    <span className="text-sm tracking-wide">{item.name}</span>
                  </div>
                  {item.name === "Emergency Control" && unreadAlertsCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-500/20 text-red-400 border border-red-500/35 rounded-full animate-pulse">
                      {unreadAlertsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-4 border-t border-slate-800/80 pt-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <User className="h-5 w-5 text-cyan-400" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate text-slate-200">
                {currentUser.username}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                {currentUser.role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/5 transition-colors text-sm font-medium w-full text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#090d1a] border-b border-slate-800/80 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-cyan-400" />
          <span className="text-lg font-bold tracking-wider text-cyan-400 font-mono">
            RENEW
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400 font-mono">{time.split(":")[0]}:{time.split(":")[1]}</span>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:text-cyan-400"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-[#060814]/95 backdrop-blur-md z-40 flex flex-col p-6 justify-between border-t border-slate-800">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3.5 rounded-xl ${
                    isActive
                      ? "bg-cyan-500/10 text-cyan-400 border-l-4 border-cyan-400 font-semibold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </div>
                  {item.name === "Emergency Control" && unreadAlertsCount > 0 && (
                    <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/35 px-2 py-0.5 rounded-full">
                      {unreadAlertsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
          <div className="flex flex-col gap-4 border-t border-slate-800 pt-6">
            <div className="flex items-center gap-3">
              <User className="h-8 w-8 text-cyan-400" />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{currentUser.username}</span>
                <span className="text-xs text-slate-500">{currentUser.role}</span>
              </div>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleLogout();
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/5 transition-colors text-sm font-medium w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0 overflow-y-auto h-screen">
        {/* Top Header */}
        <header className="hidden md:flex h-16 border-b border-slate-800/40 items-center justify-between px-8 bg-[#070b16]/40 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 font-mono">SECTOR RADAR STATUS:</span>
            <span className="text-[11px] font-bold text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 font-mono tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
              7/7 JUNCTIONS OPERATIONAL
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer group">
              <Bell className="h-5 w-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 border border-[#060814] text-[9px] font-bold text-white rounded-full flex items-center justify-center animate-bounce">
                  {unreadAlertsCount}
                </span>
              )}
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Welcome,</span>
              <span className="text-xs font-semibold text-cyan-400 font-mono">{currentUser.username}</span>
            </div>
          </div>
        </header>

        {/* Content Render */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto bg-gradient-to-b from-[#060814] via-[#080c1d] to-[#050711]">
          {children}
        </div>
      </main>
    </div>
  );
}
