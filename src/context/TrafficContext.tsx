"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  INITIAL_JUNCTIONS,
  INITIAL_ALERTS,
  INITIAL_AMBULANCES,
} from "@/lib/mockData";
import type { Junction, EmergencyAlert, Ambulance } from "@/lib/mockData";
export type { Junction, EmergencyAlert, Ambulance };


interface TrafficContextType {
  junctions: Junction[];
  alerts: EmergencyAlert[];
  ambulances: Ambulance[];
  currentUser: { username: string; role: string } | null;
  settings: {
    criticalThreshold: number;
    warningThreshold: number;
    aiOptimizationInterval: number;
    alertsEnabled: boolean;
  };
  login: (username: string) => boolean;
  logout: () => void;
  toggleGreenCorridor: (junctionId: string) => void;
  overrideSignalMode: (junctionId: string, mode: Junction["signalMode"]) => void;
  triggerEmergencyRoute: (source: string, destination: string, vehicleNo: string) => void;
  resolveAlert: (alertId: string) => void;
  updateSettings: (newSettings: any) => void;
}

const TrafficContext = createContext<TrafficContextType | undefined>(undefined);

export function TrafficProvider({ children }: { children: React.ReactNode }) {
  const [junctions, setJunctions] = useState<Junction[]>(INITIAL_JUNCTIONS);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(INITIAL_AMBULANCES);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  
  const [settings, setSettings] = useState({
    criticalThreshold: 80,
    warningThreshold: 50,
    aiOptimizationInterval: 30,
    alertsEnabled: true,
  });

  // Load session from localStorage if client-side
  useEffect(() => {
    const savedUser = localStorage.getItem("renew_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string) => {
    const user = { username, role: "Traffic Operations Manager" };
    setCurrentUser(user);
    localStorage.setItem("renew_user", JSON.stringify(user));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("renew_user");
  };

  const toggleGreenCorridor = (junctionId: string) => {
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id === junctionId) {
          const newStatus = !j.greenCorridorActive;
          return {
            ...j,
            greenCorridorActive: newStatus,
            // If green corridor becomes active, congestion drops, wait time drops, status becomes normal
            congestionLevel: newStatus ? Math.max(10, j.congestionLevel - 40) : j.congestionLevel,
            queueLength: newStatus ? Math.max(10, j.queueLength - 100) : j.queueLength,
            status: newStatus ? "normal" : j.congestionLevel > settings.criticalThreshold ? "critical" : j.congestionLevel > settings.warningThreshold ? "warning" : "normal",
            averageWaitTime: newStatus ? 15 : j.averageWaitTime,
          };
        }
        return j;
      })
    );

    // Create an alert
    const targetJunction = junctions.find((j) => j.id === junctionId);
    if (targetJunction) {
      const active = !targetJunction.greenCorridorActive;
      const newAlert: EmergencyAlert = {
        id: `a-${Date.now()}`,
        title: active ? "Green Corridor Activated" : "Green Corridor Terminated",
        message: active 
          ? `Priority emergency corridor has been established at ${targetJunction.name}. Signals adjusted.`
          : `Priority routing has ended at ${targetJunction.name}. Signal control reverted to Adaptive AI.`,
        time: "Just now",
        severity: active ? "critical" : "info",
        junctionId,
        resolved: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const overrideSignalMode = (junctionId: string, mode: Junction["signalMode"]) => {
    setJunctions((prev) =>
      prev.map((j) => (j.id === junctionId ? { ...j, signalMode: mode } : j))
    );

    const targetJunction = junctions.find((j) => j.id === junctionId);
    if (targetJunction) {
      const newAlert: EmergencyAlert = {
        id: `a-${Date.now()}`,
        title: `Signal Override: ${mode}`,
        message: `Control mode for ${targetJunction.name} changed to ${mode}.`,
        time: "Just now",
        severity: mode === "Manual Override" ? "warning" : "info",
        junctionId,
        resolved: false,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const triggerEmergencyRoute = (source: string, destination: string, vehicleNo: string) => {
    // Add ambulance
    const newAmbulance: Ambulance = {
      id: `amb-${Date.now()}`,
      vehicleNo,
      source,
      destination,
      status: "En-Route",
      eta: 8,
      lat: 12.972, // Midpoint between junctions
      lng: 77.735,
      greenCorridorRequested: true,
    };
    setAmbulances((prev) => [newAmbulance, ...prev]);

    // Set junctions along path to green corridor
    // Let's pretend Vydehi (j-2) and Hope Farm (j-1) are on the path
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id === "j-1" || j.id === "j-2") {
          return {
            ...j,
            greenCorridorActive: true,
            congestionLevel: Math.max(15, Math.round(j.congestionLevel / 3)),
            queueLength: Math.max(10, Math.round(j.queueLength / 3)),
            averageWaitTime: 10,
            status: "normal",
          };
        }
        return j;
      })
    );

    const newAlert: EmergencyAlert = {
      id: `a-${Date.now()}`,
      title: "Emergency Corridor Deployed",
      message: `Ambulance ${vehicleNo} dispatched. Automatic signals green-lighted from ${source} to ${destination}.`,
      time: "Just now",
      severity: "critical",
      resolved: false,
    };
    setAlerts((prev) => [newAlert, ...prev]);
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  };

  const updateSettings = (newSettings: any) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Simulate traffic changes over time
  useEffect(() => {
    const interval = setInterval(() => {
      setJunctions((prev) =>
        prev.map((j) => {
          // If green corridor is active, don't increase congestion
          if (j.greenCorridorActive) return j;

          // Add a random walk to traffic
          const change = Math.round((Math.random() - 0.5) * 8);
          const newCongestion = Math.max(10, Math.min(100, j.congestionLevel + change));
          
          let newStatus: Junction["status"] = "normal";
          if (newCongestion >= settings.criticalThreshold) {
            newStatus = "critical";
          } else if (newCongestion >= settings.warningThreshold) {
            newStatus = "warning";
          }

          const queueChange = Math.round((change > 0 ? 1 : -1) * Math.random() * 25);
          const newQueue = Math.max(5, j.queueLength + queueChange);

          const waitChange = Math.round((change > 0 ? 1 : -1) * Math.random() * 8);
          const newWait = Math.max(5, j.averageWaitTime + waitChange);

          return {
            ...j,
            congestionLevel: newCongestion,
            status: newStatus,
            queueLength: newQueue,
            averageWaitTime: newWait,
          };
        })
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [settings]);

  return (
    <TrafficContext.Provider
      value={{
        junctions,
        alerts,
        ambulances,
        currentUser,
        settings,
        login,
        logout,
        toggleGreenCorridor,
        overrideSignalMode,
        triggerEmergencyRoute,
        resolveAlert,
        updateSettings,
      }}
    >
      {children}
    </TrafficContext.Provider>
  );
}

export function useTraffic() {
  const context = useContext(TrafficContext);
  if (!context) {
    throw new Error("useTraffic must be used within a TrafficProvider");
  }
  return context;
}
