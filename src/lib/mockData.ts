export interface Junction {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "normal" | "warning" | "critical"; // normal=emerald, warning=amber, critical=red
  congestionLevel: number; // percentage (0 - 100)
  queueLength: number; // in meters
  activeLanes: number;
  signalMode: "Adaptive AI" | "Manual Override" | "Fixed Timing";
  greenCorridorActive: boolean;
  averageWaitTime: number; // in seconds
  dataSource?: "live" | "simulated";
}

export interface EmergencyAlert {
  id: string;
  title: string;
  message: string;
  time: string;
  severity: "critical" | "warning" | "info";
  junctionId?: string;
  resolved: boolean;
}

export interface Ambulance {
  id: string;
  vehicleNo: string;
  source: string;
  destination: string;
  status: "En-Route" | "Stuck" | "Completed";
  eta: number; // in minutes
  lat: number;
  lng: number;
  greenCorridorRequested: boolean;
}

export const INITIAL_JUNCTIONS: Junction[] = [
  {
    id: "WF_J_001",
    name: "Hope Farm Junction",
    lat: 12.9841,
    lng: 77.7523,
    status: "critical",
    congestionLevel: 82,
    queueLength: 350,
    activeLanes: 4,
    signalMode: "Adaptive AI",
    greenCorridorActive: false,
    averageWaitTime: 145,
  },
  {
    id: "WF_J_002",
    name: "Vydehi Hospital Junction",
    lat: 12.9772,
    lng: 77.7297,
    status: "warning",
    congestionLevel: 61,
    queueLength: 180,
    activeLanes: 4,
    signalMode: "Adaptive AI",
    greenCorridorActive: false,
    averageWaitTime: 88,
  },
  {
    id: "WF_J_003",
    name: "Graphite India Junction",
    lat: 12.9739,
    lng: 77.7126,
    status: "critical",
    congestionLevel: 94,
    queueLength: 420,
    activeLanes: 3,
    signalMode: "Manual Override",
    greenCorridorActive: false,
    averageWaitTime: 210,
  },
  {
    id: "WF_J_004",
    name: "Kundalahalli Gate Junction",
    lat: 12.9667,
    lng: 77.7188,
    status: "normal",
    congestionLevel: 28,
    queueLength: 40,
    activeLanes: 4,
    signalMode: "Adaptive AI",
    greenCorridorActive: false,
    averageWaitTime: 35,
  },
  {
    id: "WF_J_005",
    name: "Hoodi Junction",
    lat: 12.9918,
    lng: 77.7161,
    status: "normal",
    congestionLevel: 32,
    queueLength: 60,
    activeLanes: 4,
    signalMode: "Fixed Timing",
    greenCorridorActive: false,
    averageWaitTime: 42,
  },
  {
    id: "WF_J_006",
    name: "Varthur Kodi Junction",
    lat: 12.9575,
    lng: 77.7442,
    status: "warning",
    congestionLevel: 55,
    queueLength: 150,
    activeLanes: 3,
    signalMode: "Adaptive AI",
    greenCorridorActive: true,
    averageWaitTime: 75,
  },
  {
    id: "WF_J_007",
    name: "Kadugodi Bridge Junction",
    lat: 12.9976,
    lng: 77.7602,
    status: "normal",
    congestionLevel: 19,
    queueLength: 25,
    activeLanes: 4,
    signalMode: "Adaptive AI",
    greenCorridorActive: false,
    averageWaitTime: 18,
  },
];

export const INITIAL_ALERTS: EmergencyAlert[] = [
  {
    id: "a-1",
    title: "Green Corridor Active",
    message: "Emergency ambulance AMB-204 dispatched from Varthur Kodi. Priority routing active on ITPL Road.",
    time: "2 mins ago",
    severity: "critical",
    junctionId: "WF_J_006",
    resolved: false,
  },
  {
    id: "a-2",
    title: "Manual Override Engaged",
    message: "Traffic warden engaged manual override at Graphite India Junction due to minor collision blocking Lane C.",
    time: "10 mins ago",
    severity: "warning",
    junctionId: "WF_J_003",
    resolved: false,
  },
  {
    id: "a-3",
    title: "Peak Congestion Warning",
    message: "Hope Farm Junction currently exceeding critical capacity. AI routing suggestions pushed to navigation systems.",
    time: "15 mins ago",
    severity: "warning",
    junctionId: "WF_J_001",
    resolved: false,
  },
  {
    id: "a-4",
    title: "Sensor Offline",
    message: "Induction loop sensor in Lane A at Hoodi Junction reporting calibration warning.",
    time: "45 mins ago",
    severity: "info",
    junctionId: "WF_J_005",
    resolved: true,
  },
];

export const INITIAL_AMBULANCES: Ambulance[] = [
  {
    id: "amb-1",
    vehicleNo: "KA-53-MC-1012",
    source: "Varthur Kodi",
    destination: "Vydehi Hospital",
    status: "En-Route",
    eta: 6,
    lat: 12.9680,
    lng: 77.7380,
    greenCorridorRequested: true,
  },
  {
    id: "amb-2",
    vehicleNo: "KA-03-FA-9921",
    source: "Hope Farm",
    destination: "Sakra World Hospital",
    status: "Stuck",
    eta: 18,
    lat: 12.9800,
    lng: 77.7500,
    greenCorridorRequested: false,
  },
  {
    id: "amb-3",
    vehicleNo: "KA-51-E-4422",
    source: "Hoodi Junction",
    destination: "Vydehi Hospital",
    status: "Completed",
    eta: 0,
    lat: 12.9772,
    lng: 77.7297,
    greenCorridorRequested: false,
  },
];

// Recharts trends data
export const DENSITY_TRENDS = [
  { time: "06:00", active: 20, average: 25, peak: 30 },
  { time: "08:00", active: 45, average: 58, peak: 70 },
  { time: "10:00", active: 75, average: 84, peak: 95 },
  { time: "12:00", active: 55, average: 62, peak: 75 },
  { time: "14:00", active: 50, average: 55, peak: 65 },
  { time: "16:00", active: 65, average: 70, peak: 82 },
  { time: "18:00", active: 85, average: 92, peak: 98 },
  { time: "20:00", active: 60, average: 68, peak: 80 },
  { time: "22:00", active: 30, average: 40, peak: 50 },
  { time: "00:00", active: 15, average: 20, peak: 25 },
];

export const VEHICLE_COUNTS = [
  { name: "Two-Wheelers", count: 24500, color: "#06b6d4" },
  { name: "Four-Wheelers", count: 18200, color: "#10b981" },
  { name: "Auto-Rickshaws", count: 9800, color: "#fbbf24" },
  { name: "Public Buses", count: 1800, color: "#8b5cf6" },
  { name: "Commercial Trucks", count: 2200, color: "#f43f5e" },
];

export const WAIT_TIME_BY_JUNCTION = [
  { name: "Hope Farm", current: 145, historicalAvg: 110, target: 60 },
  { name: "Vydehi", current: 88, historicalAvg: 95, target: 50 },
  { name: "Graphite", current: 210, historicalAvg: 155, target: 70 },
  { name: "Kundalahalli", current: 35, historicalAvg: 55, target: 40 },
  { name: "Hoodi", current: 42, historicalAvg: 45, target: 45 },
  { name: "Varthur Kodi", current: 75, historicalAvg: 80, target: 50 },
  { name: "Kadugodi", current: 18, historicalAvg: 30, target: 30 },
];

export const CONGESTION_PREDICTIONS = [
  { time: "+1 Hour", Graphite: 88, HopeFarm: 85, Vydehi: 70, Hoodi: 45 },
  { time: "+2 Hours", Graphite: 72, HopeFarm: 68, Vydehi: 58, Hoodi: 35 },
  { time: "+3 Hours", Graphite: 55, HopeFarm: 52, Vydehi: 45, Hoodi: 30 },
  { time: "+4 Hours", Graphite: 78, HopeFarm: 74, Vydehi: 65, Hoodi: 55 },
  { time: "+5 Hours", Graphite: 95, HopeFarm: 92, Vydehi: 82, Hoodi: 78 },
  { time: "+6 Hours", Graphite: 85, HopeFarm: 80, Vydehi: 75, Hoodi: 60 },
];
