# RENEW - Smart Traffic Intelligence (Phase 2: Live Digital Twin)

RENEW is a real-time Traffic Intelligence Digital Twin and Micro-Simulation Portal representing Bengaluru (Whitefield) traffic. Phase 2 features live integration frameworks for TomTom (live flow & incidents), OpenWeatherMap (precipitations & visibility risks), OpenRouteService Routing (dynamic ETA matrices), and local NetworkX/SUMO micro-simulations.

---

## 🏗️ Project Architecture

* **Frontend**: Next.js 16 + TypeScript + Tailwind CSS + Leaflet maps (dynamic client-only rendering)
* **Backend**: FastAPI + SQLite (local database telemetry) + OSMnx/NetworkX (file-based GraphML road grids)
* **WebSockets**: In-memory WebSocket ConnectionManager for real-time live map broadcasts

---

## 🚀 Get Started

Follow these steps to run both the frontend and backend entirely on your Windows laptop.

### Prerequisite
Ensure **Node.js (v20+)** and **Python (v3.10+)** are installed on your Windows machine and available in your shell's PATH.

---

### Step 1: Set Up Python Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a local Python virtual environment:
   ```bash
   python -m venv .venv
   ```

3. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```

4. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
   *(Note: This installs `osmnx` and its dependencies. If you are using Python 3.14 on Windows, pip will automatically fetch pre-release compatible wheels).*

5. Configure your API keys in the `backend/.env` file:
   ```env
   TOMTOM_API_KEY=YOUR_TOMTOM_API_KEY
   OPENWEATHER_API_KEY=YOUR_OPENWEATHER_API_KEY
   ORS_API_KEY=YOUR_OPENROUTE_SERVICE_API_KEY
   ```
   *If keys are omitted, the backend automatically runs local simulations and generates mock telemetry updates, allowing you to test the entire interface offline!*

---

### Step 2: Set Up Next.js Frontend & Start

1. From the **project root directory** (`traffic management`), install frontend dependencies:
   ```bash
   npm install
   ```

2. Start the application. You can either run both services concurrently, or start them in separate terminals:

   * **Option A: Run everything concurrently (Recommended)**
     ```bash
     npm run dev:all
     ```
     This starts both the FastAPI backend (on port 8000) and the Next.js frontend (on port 3000) in a single terminal. Hitting `Ctrl + C` stops both servers.

   * **Option B: Run in separate terminals**
     * Terminal 1 (Backend):
       ```bash
       npm run dev:backend
       ```
     * Terminal 2 (Frontend):
       ```bash
       npm run dev
       ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚦 Live Interface Control Features

Once both servers are running:
1. **Live Network Map**: Next.js automatically connects via WebSockets (`ws://127.0.0.1:8000/api/ws/traffic`) to receive live vehicle density updates.
2. **CCTV Feed & Override**: Click on any junction marker on the map or select a terminal on the **Junctions** page to view live camera simulations and toggle green corridors.
3. **Emergency Routing**: Deploy a priority ambulance on the **Emergency Control** page. The backend will calculate dynamic ETAs utilizing the **OpenRouteService directions API** (or fallback local NetworkX Dijkstra paths).
4. **Rain Overlay**: If the weather API (or simulator) reports active precipitation, a subtle blue rain wash overlay dynamically appears on the Leaflet map, accompanied by warning risk metrics.
5. **Simulation Engine (SUMO)**: 
   * If you have SUMO installed on your Windows machine, launch the SUMO server listening on port `8813`. The backend's `SumoAdapter` will automatically interface with it.
   * If SUMO is not found, the server silently falls back to a lightweight, built-in NetworkX routing flow simulator.
