"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

const MapComponent = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] rounded-2xl border border-slate-800/80 bg-[#090d1a] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
      <span className="text-sm font-mono text-slate-400">LOADING MAP INFRASTRUCTURE...</span>
    </div>
  ),
});

export default function MapWrapper() {
  return <MapComponent />;
}
