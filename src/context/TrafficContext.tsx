"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Junction,
  EmergencyAlert,
  Ambulance,
  INITIAL_JUNCTIONS,
  INITIAL_ALERTS,
  INITIAL_AMBULANCES,
} from "@/lib/mockData";

interface WeatherState {
  rainfall: number;
  visibility: number;
  humidity: number;
  condition: string;
  timestamp?: string;
}

interface BusState {
  id: string;
  route_no: string;
  lat: number;
  lng: number;
  status: string;
}

interface TrafficContextType {
  junctions: Junction[];
  alerts: EmergencyAlert[];
  ambulances: Ambulance[];
  weather: WeatherState;
  activeBuses: BusState[];
  currentUser: { username: string; role: string } | null;
  settings: {
    criticalThreshold: number;
    warningThreshold: number;
    aiOptimizationInterval: number;
    alertsEnabled: boolean;
  };
  login: (username: string, role?: string) => boolean;
  logout: () => void;
  toggleGreenCorridor: (junctionId: string) => void;
  overrideSignalMode: (junctionId: string, mode: Junction["signalMode"]) => void;
  triggerEmergencyRoute: (source: string, destination: string, vehicleNo: string, vehicleType?: string, priorityLevel?: number) => void;
  resolveAlert: (alertId: string) => void;
  updateSettings: (newSettings: any) => void;
  isLiveConnected: boolean;
  activeCorridor: any;
  activeCorridorsList: any[];
  corridorHistory: any[];
  cancelCorridor: (corridorId: string) => Promise<void>;
  triggerReplay: (corridor: any) => void;
}

const TrafficContext = createContext<TrafficContextType | undefined>(undefined);

export function TrafficProvider({ children }: { children: React.ReactNode }) {
  const [junctions, setJunctions] = useState<Junction[]>(INITIAL_JUNCTIONS);
  const [alerts, setAlerts] = useState<EmergencyAlert[]>(INITIAL_ALERTS);
  const [ambulances, setAmbulances] = useState<Ambulance[]>(INITIAL_AMBULANCES);
  const [weather, setWeather] = useState<WeatherState>({
    rainfall: 0.0,
    visibility: 10000.0,
    humidity: 60.0,
    condition: "Clear"
  });
  const [activeBuses, setActiveBuses] = useState<BusState[]>([]);
  const [currentUser, setCurrentUser] = useState<{ username: string; role: string } | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [activeCorridor, setActiveCorridor] = useState<any>(null);
  const [activeCorridorsList, setActiveCorridorsList] = useState<any[]>([]);
  const [corridorHistory, setCorridorHistory] = useState<any[]>([]);

  const [settings, setSettings] = useState({
    criticalThreshold: 80,
    warningThreshold: 50,
    aiOptimizationInterval: 30,
    alertsEnabled: true,
  });

  // Fetch active corridors and history from the API
  const fetchCorridors = async () => {
    try {
      const resActive = await fetch("http://127.0.0.1:8000/api/emergency/active");
      if (resActive.ok) {
        const data = await resActive.json();
        setActiveCorridorsList(data);
        if (data.length > 0) {
          const current = data[0];
          const parsedNodes = JSON.parse(current.route_nodes || "[]");
          const fallbackCoords = parsedNodes
            .map((nodeId: string) => {
              const j = junctions.find((junc) => junc.id === nodeId);
              return j ? [j.lat, j.lng] : null;
            })
            .filter((c: any) => c !== null);

          setActiveCorridor({
            id: current.id,
            vehicleNo: current.vehicle_no || "EMERGENCY",
            vehicleType: current.vehicle_type,
            priorityLevel: current.priority_level,
            routeNodes: parsedNodes,
            routeCoordinates: fallbackCoords,
            progress: current.vehicle_progress_percentage,
            etaRemaining: current.eta_after,
            junctions: [],
            distanceKm: current.distance_km,
            timeSaved: current.time_saved_seconds,
            source: current.origin_name || "Emergency Start",
            destination: current.destination_name || "Hospital"
          });
        } else {
          setActiveCorridor(null);
        }
      }
      const resHistory = await fetch("http://127.0.0.1:8000/api/emergency/history");
      if (resHistory.ok) {
        const data = await resHistory.json();
        setCorridorHistory(data);
      }
    } catch (e) {
      console.warn("[API] Failed to fetch corridors list/history:", e);
    }
  };

  useEffect(() => {
    if (isLiveConnected) {
      fetchCorridors();
    }
  }, [isLiveConnected]);

  // Load session from localStorage if client-side
  useEffect(() => {
    const savedUser = localStorage.getItem("renew_user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  // Live WebSocket Integration
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWS = () => {
      try {
        console.log("[WS] Connecting to FastAPI traffic broadcast...");
        socket = new WebSocket("ws://127.0.0.1:8000/api/ws/traffic");

        socket.onopen = () => {
          console.log("[WS] Connected to live Digital Twin backend!");
          setIsLiveConnected(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            // Check for emergency events first
            if (data.event === "EMERGENCY_CREATED" || data.event === "GREEN_CORRIDOR_ACTIVATED") {
              const vehicleNo = data.vehicle_no || "EMERGENCY";
              const source = data.origin_name || "Emergency Start";
              const destination = data.destination_name || "Vydehi Hospital";
              
              setActiveCorridor({
                id: data.corridor_id,
                vehicleNo: vehicleNo,
                vehicleType: data.vehicle_type,
                priorityLevel: data.priority,
                routeNodes: data.route_nodes || [],
                routeCoordinates: data.route_coordinates || [],
                progress: 0,
                etaRemaining: data.eta_after || 300,
                junctions: data.junctions || [],
                distanceKm: data.distance_km || 1.5,
                timeSaved: data.time_saved || 120,
                source: source,
                destination: destination
              });

              setAmbulances((prev) => {
                const filtered = prev.filter(a => a.id !== data.corridor_id && a.vehicleNo !== vehicleNo);
                const newAmb: Ambulance = {
                  id: data.corridor_id,
                  vehicleNo: vehicleNo,
                  source: source,
                  destination: destination,
                  status: "En-Route",
                  eta: Math.round((data.eta_after || 300) / 60.0),
                  lat: data.route_coordinates?.[0]?.[0] || 12.9698,
                  lng: data.route_coordinates?.[0]?.[1] || 77.7500,
                  greenCorridorRequested: true,
                };
                return [newAmb, ...filtered];
              });

              if (data.junctions) {
                setJunctions((prev) =>
                  prev.map((j) =>
                    data.junctions.includes(j.id) ? { ...j, greenCorridorActive: true } : j
                  )
                );
              }
              fetchCorridors();
            } else if (data.event === "EMERGENCY_UPDATED") {
              setActiveCorridor((prev: any) => {
                if (!prev || prev.id !== data.corridor_id) return prev;
                return {
                  ...prev,
                  progress: data.progress,
                  etaRemaining: data.eta_remaining
                };
              });

              setAmbulances((prev) =>
                prev.map((a) => {
                  if (a.id === data.corridor_id || a.vehicleNo === data.vehicle_no) {
                    return {
                      ...a,
                      eta: Math.round(data.eta_remaining / 60.0),
                      lat: data.current_vehicle_coords?.lat || a.lat,
                      lng: data.current_vehicle_coords?.lng || a.lng,
                      status: data.progress === 100 ? "Completed" : a.status
                    };
                  }
                  return a;
                })
              );

              if (data.released_junctions && data.released_junctions.length > 0) {
                setJunctions((prev) =>
                  prev.map((j) =>
                    data.released_junctions.includes(j.id) ? { ...j, greenCorridorActive: false } : j
                  )
                );
              }
            } else if (data.event === "GREEN_CORRIDOR_COMPLETED") {
              setActiveCorridor(null);
              setAmbulances((prev) =>
                prev.map((a) => {
                  if (a.id === data.corridor_id || a.vehicleNo === data.vehicle_no) {
                    return { ...a, status: "Completed", eta: 0 };
                  }
                  return a;
                })
              );
              setJunctions((prev) =>
                prev.map((j) => ({ ...j, greenCorridorActive: false }))
              );
              fetchCorridors();
            }

            if (data.type === "telemetry_update") {
              // Map incoming backend states to React state models
              if (data.junctions) {
                const mappedJunctions = data.junctions.map((j: any) => {
                  let status: Junction["status"] = "normal";
                  if (j.congestion_level >= settings.criticalThreshold) {
                    status = "critical";
                  } else if (j.congestion_level >= settings.warningThreshold) {
                    status = "warning";
                  }

                  return {
                    id: j.id,
                    name: j.name,
                    lat: j.lat,
                    lng: j.lng,
                    status,
                    congestionLevel: j.congestion_level,
                    queueLength: Math.round(j.congestion_level * 4.2),
                    activeLanes: j.green_corridor_active ? 4 : 3,
                    signalMode: j.signal_mode,
                    greenCorridorActive: j.green_corridor_active,
                    averageWaitTime: j.average_wait_time
                  };
                });
                setJunctions(mappedJunctions);
              }

              if (data.incidents) {
                const mappedAlerts = data.incidents.map((inc: any) => ({
                  id: inc.id,
                  title: inc.title,
                  message: inc.message,
                  time: "Just now",
                  severity: inc.severity,
                  resolved: false
                }));
                // Merge with existing manual alerts
                setAlerts((prev) => {
                  const manualAlerts = prev.filter(a => a.id.startsWith("a-"));
                  return [...mappedAlerts, ...manualAlerts];
                });
              }

              if (data.weather) {
                setWeather(data.weather);
              }

              if (data.active_buses) {
                setActiveBuses(data.active_buses);
              }
            }
          } catch (err) {
            console.error("[WS] Error parsing WebSocket message:", err);
          }
        };

        socket.onclose = () => {
          console.log("[WS] Connection lost. Reconnecting in 5s...");
          setIsLiveConnected(false);
          reconnectTimeout = setTimeout(connectWS, 5000);
        };

        socket.onerror = () => {
          setIsLiveConnected(false);
        };
      } catch (err) {
        console.error("[WS] WebSocket setup error:", err);
        setIsLiveConnected(false);
      }
    };

    connectWS();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [settings]);

  // REST API hooks for override controls
  const toggleGreenCorridor = async (junctionId: string) => {
    // Optimistic UI update locally
    setJunctions((prev) =>
      prev.map((j) => {
        if (j.id === junctionId) {
          const newStatus = !j.greenCorridorActive;
          return {
            ...j,
            greenCorridorActive: newStatus,
            congestionLevel: newStatus ? Math.max(10, j.congestionLevel - 40) : j.congestionLevel,
            status: newStatus ? "normal" : j.congestionLevel > settings.criticalThreshold ? "critical" : "normal",
          };
        }
        return j;
      })
    );

    // If backend is active, send override post
    if (isLiveConnected) {
      try {
        await fetch(`http://127.0.0.1:8000/api/traffic/corridor/${junctionId}`, {
          method: "POST"
        });
      } catch (e) {
        console.warn("[API] Failed to post corridor toggle to server, fallback local active.");
      }
    }
  };

  const overrideSignalMode = async (junctionId: string, mode: Junction["signalMode"]) => {
    setJunctions((prev) =>
      prev.map((j) => (j.id === junctionId ? { ...j, signalMode: mode } : j))
    );

    if (isLiveConnected) {
      try {
        await fetch(`http://127.0.0.1:8000/api/traffic/mode/${junctionId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode })
        });
      } catch (e) {
        console.warn("[API] Failed to post signal override to server.");
      }
    }
  };

  const cancelCorridor = async (corridorId: string) => {
    if (isLiveConnected) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/emergency/cancel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ corridor_id: corridorId })
        });
        if (response.ok) {
          console.log("[API] Corridor cancelled successfully");
          setActiveCorridor(null);
          fetchCorridors();
        }
      } catch (e) {
        console.warn("[API] Failed to cancel corridor:", e);
      }
    } else {
      setActiveCorridor(null);
      setAmbulances((prev) =>
        prev.map(a => a.id === corridorId ? { ...a, status: "Completed" } : a)
      );
    }
  };

  const triggerEmergencyRoute = async (
    source: string,
    destination: string,
    vehicleNo: string,
    vehicleType: string = "ambulance",
    priorityLevel: number = 1
  ) => {
    // 1. Resolve coordinates
    const srcJunction = junctions.find(j => j.name === source || j.id === source);
    const originCoords = srcJunction ? { lat: srcJunction.lat, lon: srcJunction.lng } : { lat: 12.9841, lon: 77.7523 };
    
    let destCoords = { lat: 12.9772, lon: 77.7297 }; // Default Vydehi
    if (destination.includes("Sakra")) {
      destCoords = { lat: 12.9667, lon: 77.7188 };
    } else if (destination.includes("Manipal")) {
      destCoords = { lat: 12.9739, lon: 77.7126 };
    } else if (destination.includes("Columbia") || destination.includes("Varthur")) {
      destCoords = { lat: 12.9575, lon: 77.7442 };
    } else {
      const destJunction = junctions.find(j => j.name === destination || j.id === destination);
      if (destJunction) {
        destCoords = { lat: destJunction.lat, lon: destJunction.lng };
      }
    }

    const localId = `amb-${Date.now()}`;
    const newAmbulance: Ambulance = {
      id: localId,
      vehicleNo,
      source,
      destination,
      status: "En-Route",
      eta: 8,
      lat: originCoords.lat,
      lng: originCoords.lon,
      greenCorridorRequested: true,
    };
    
    // Offline/Error Local Simulation Loop
    const startLocalSimulation = () => {
      const pathNodes: string[] = [];
      const srcJ = junctions.find(j => j.name === source || j.id === source);
      if (srcJ) pathNodes.push(srcJ.id);
      
      // Intermediate junctions
      if (srcJ && srcJ.id !== "WF_J_003") pathNodes.push("WF_J_003");
      if (srcJ && srcJ.id !== "WF_J_002") pathNodes.push("WF_J_002");
      
      const destJ = junctions.find(j => j.name === destination || j.id === destination || destination.includes(j.name) || j.name.includes(destination));
      if (destJ && !pathNodes.includes(destJ.id)) {
        pathNodes.push(destJ.id);
      } else if (!destJ) {
        const defaultDest = junctions.find(j => j.id === "WF_J_002") || junctions[1];
        if (defaultDest && !pathNodes.includes(defaultDest.id)) {
          pathNodes.push(defaultDest.id);
        }
      }

      const pathCoords = pathNodes
        .map((nodeId) => {
          const j = junctions.find((junc) => junc.id === nodeId);
          return j ? [j.lat, j.lng] : null;
        })
        .filter((c: any) => c !== null);

      if (pathCoords.length === 0) {
        pathCoords.push([originCoords.lat, originCoords.lon]);
        pathCoords.push([destCoords.lat, destCoords.lon]);
      }

      setActiveCorridor({
        id: localId,
        vehicleNo: vehicleNo,
        vehicleType: vehicleType,
        priorityLevel: priorityLevel,
        routeNodes: pathNodes,
        routeCoordinates: pathCoords,
        progress: 0,
        etaRemaining: 180,
        distanceKm: 2.1,
        timeSaved: 75,
        source: source,
        destination: destination,
        isReplay: false
      });

      // Force junctions green
      setJunctions((prev) =>
        prev.map((j) =>
          pathNodes.includes(j.id) ? { ...j, greenCorridorActive: true } : j
        )
      );

      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += 25;
        if (currentProgress > 100) {
          clearInterval(interval);
          setActiveCorridor(null);
          setAmbulances((prev) =>
            prev.map(a => a.id === localId ? { ...a, status: "Completed", eta: 0 } : a)
          );
          setJunctions((prev) =>
            prev.map((j) => ({ ...j, greenCorridorActive: false }))
          );
          
          // Add to local history log
          const newHistoryRecord = {
            id: localId,
            vehicle_no: vehicleNo,
            vehicle_type: vehicleType,
            origin_name: source,
            destination_name: destination,
            time_saved_seconds: 75,
            eta_before: 255,
            eta_after: 180,
            status: "COMPLETED",
            route_nodes: JSON.stringify(pathNodes)
          };
          setCorridorHistory((prev) => [...prev, newHistoryRecord]);
        } else {
          setActiveCorridor((prev: any) => {
            if (!prev || prev.id !== localId) {
              clearInterval(interval);
              return prev;
            }
            return {
              ...prev,
              progress: currentProgress,
              etaRemaining: Math.round(180 * (1 - currentProgress / 100))
            };
          });

          setAmbulances((prev) =>
            prev.map((a) => {
              if (a.id === localId) {
                const cutoff = Math.min(pathCoords.length - 1, Math.floor((pathCoords.length - 1) * (currentProgress / 100.0)));
                const currentCoords = pathCoords[cutoff] || pathCoords[0];
                
                // Release junctions behind
                const crossedNodes = pathNodes.slice(0, Math.floor(pathNodes.length * (currentProgress / 100.0)));
                setJunctions((juncs) =>
                  juncs.map((j) =>
                    crossedNodes.includes(j.id) ? { ...j, greenCorridorActive: false } : j
                  )
                );

                return {
                  ...a,
                  lat: currentCoords?.[0] || a.lat,
                  lng: currentCoords?.[1] || a.lng,
                  status: currentProgress === 100 ? "Completed" : a.status
                };
              }
              return a;
            })
          );
        }
      }, 2000);
    };

    setAmbulances((prev) => [newAmbulance, ...prev]);

    if (isLiveConnected) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/emergency/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle_type: vehicleType.toLowerCase(),
            priority_level: priorityLevel,
            origin: originCoords,
            destination: destCoords,
            vehicle_no: vehicleNo,
            origin_name: source,
            destination_name: destination
          })
        });
        if (response.ok) {
          console.log("[API] Emergency corridor created successfully!");
          fetchCorridors();
        } else {
          console.error("[API] Failed to create emergency corridor", await response.text());
          startLocalSimulation();
        }
      } catch (e) {
        console.warn("[API] Failed to post emergency corridor creation to server, starting local fallback simulation.");
        startLocalSimulation();
      }
    } else {
      startLocalSimulation();
    }
  };

  const triggerReplay = (corridor: any) => {
    const parsedNodes = typeof corridor.route_nodes === "string" 
      ? JSON.parse(corridor.route_nodes) 
      : corridor.route_nodes;

    const fallbackCoords = parsedNodes
      .map((nodeId: string) => {
        const j = junctions.find((junc) => junc.id === nodeId);
        return j ? [j.lat, j.lng] : null;
      })
      .filter((c: any) => c !== null);

    const vehicleType = corridor.vehicle_type || "ambulance";
    const vehicleNo = corridor.vehicle_no || `KA-53-${vehicleType === "ambulance" ? "AM" : vehicleType === "fire" ? "FR" : "PL"}-${corridor.id.split("_")[1]?.slice(-4) || "8802"}`;

    setActiveCorridor({
      id: corridor.id,
      vehicleNo: vehicleNo,
      vehicleType: vehicleType,
      priorityLevel: corridor.priority_level || 1,
      routeNodes: parsedNodes,
      routeCoordinates: fallbackCoords,
      progress: 0,
      etaRemaining: corridor.eta_after || 0,
      distanceKm: corridor.distance_km || 0,
      timeSaved: corridor.time_saved_seconds || 0,
      source: corridor.origin_name || "Emergency Start",
      destination: corridor.destination_name || "Hospital",
      isReplay: true
    });

    setAmbulances((prev) => {
      const filtered = prev.filter(a => a.id !== corridor.id);
      const newAmb: Ambulance = {
        id: corridor.id,
        vehicleNo: vehicleNo,
        source: corridor.origin_name || "Emergency Start",
        destination: corridor.destination_name || "Hospital",
        status: "En-Route",
        eta: Math.round(corridor.eta_after / 60.0) || 5,
        lat: fallbackCoords[0]?.[0] || 12.9698,
        lng: fallbackCoords[0]?.[1] || 77.7500,
        greenCorridorRequested: true,
      };
      return [newAmb, ...filtered];
    });

    // Set junctions active
    setJunctions((prev) =>
      prev.map((j) =>
        parsedNodes.includes(j.id) ? { ...j, greenCorridorActive: true } : j
      )
    );

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 25;
      if (currentProgress > 100) {
        clearInterval(interval);
        setActiveCorridor(null);
        setAmbulances((prev) =>
          prev.map(a => a.id === corridor.id ? { ...a, status: "Completed", eta: 0 } : a)
        );
        setJunctions((prev) =>
          prev.map((j) => ({ ...j, greenCorridorActive: false }))
        );
      } else {
        setActiveCorridor((prev: any) => {
          if (!prev || prev.id !== corridor.id) {
            clearInterval(interval);
            return prev;
          }
          return {
            ...prev,
            progress: currentProgress
          };
        });
        
        setAmbulances((prev) =>
          prev.map((a) => {
            if (a.id === corridor.id) {
              const cutoff = Math.min(fallbackCoords.length - 1, Math.floor((fallbackCoords.length - 1) * (currentProgress / 100.0)));
              const currentCoords = fallbackCoords[cutoff] || fallbackCoords[0];
              
              // Release junctions behind
              const crossedNodes = parsedNodes.slice(0, Math.floor(parsedNodes.length * (currentProgress / 100.0)));
              setJunctions((juncs) =>
                juncs.map((j) =>
                  crossedNodes.includes(j.id) ? { ...j, greenCorridorActive: false } : j
                )
              );

              return {
                ...a,
                lat: currentCoords?.[0] || a.lat,
                lng: currentCoords?.[1] || a.lng,
                status: currentProgress === 100 ? "Completed" : a.status
              };
            }
            return a;
          })
        );
      }
    }, 1000);
  };

  const login = (username: string, role: string = "Traffic Operations Manager") => {
    const user = { username, role };
    setCurrentUser(user);
    localStorage.setItem("renew_user", JSON.stringify(user));
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("renew_user");
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, resolved: true } : a))
    );
  };

  const updateSettings = (newSettings: any) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Telemetry drift loop (runs locally ONLY if WebSocket is offline)
  useEffect(() => {
    if (isLiveConnected) return;

    const interval = setInterval(() => {
      setJunctions((prev) =>
        prev.map((j) => {
          if (j.greenCorridorActive) return j;
          const change = Math.round((Math.random() - 0.5) * 8);
          const newCongestion = Math.max(10, Math.min(100, j.congestionLevel + change));
          
          let status: Junction["status"] = "normal";
          if (newCongestion >= settings.criticalThreshold) {
            status = "critical";
          } else if (newCongestion >= settings.warningThreshold) {
            status = "warning";
          }

          return {
            ...j,
            congestionLevel: newCongestion,
            status,
            queueLength: Math.max(5, j.queueLength + Math.round(change * 4)),
            averageWaitTime: Math.max(5, j.averageWaitTime + change)
          };
        })
      );
    }, 8000);

    return () => clearInterval(interval);
  }, [settings, isLiveConnected]);

  return (
    <TrafficContext.Provider
      value={{
        junctions,
        alerts,
        ambulances,
        weather,
        activeBuses,
        currentUser,
        settings,
        login,
        logout,
        toggleGreenCorridor,
        overrideSignalMode,
        triggerEmergencyRoute,
        resolveAlert,
        updateSettings,
        isLiveConnected,
        activeCorridor,
        activeCorridorsList,
        corridorHistory,
        cancelCorridor,
        triggerReplay
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
export type { Junction, EmergencyAlert, Ambulance };
