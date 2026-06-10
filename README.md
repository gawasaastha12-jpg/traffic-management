<<<<<<< HEAD
# RENEW - Smart Traffic Intelligence (Phase 2: Live Digital Twin)

RENEW is a real-time Traffic Intelligence Digital Twin and Micro-Simulation Portal representing Bengaluru (Whitefield) traffic. Phase 2 features live integration frameworks for TomTom (live flow & incidents), OpenWeatherMap (precipitations & visibility risks), OpenRouteService Routing (dynamic ETA matrices), and local NetworkX/SUMO micro-simulations.

It predicts congestion before it happens, automatically adjusts traffic signals in real time, and clears emergency corridors for ambulances — all from a single live operator or commuter dashboard.

---

## 🏗️ Project Architecture

* **Frontend**: Next.js 16 + TypeScript + Tailwind CSS + Leaflet maps (dynamic client-only rendering)
* **Backend**: FastAPI + SQLite/PostgreSQL (SQLAlchemy ORM) + OSMnx/NetworkX (file-based GraphML road grids)
* **WebSockets**: In-memory WebSocket ConnectionManager for real-time live map broadcasts

---

## 🚀 Get Started Locally

Follow these steps to run both the frontend and backend entirely on your machine.

### Prerequisite
Ensure **Node.js (v20+)** and **Python (v3.10+)** are installed on your machine and available in your shell's PATH.

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

5. Configure your API keys in the `backend/.env` file (copy from `.env.example`):
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

2. Start the application:

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

---

## ☁️ Deploying on Render

To deploy RENEW in the cloud, you can deploy both the frontend (Next.js) and the backend (FastAPI) as services on [Render](https://render.com).

### 1. Deploying the FastAPI Backend (Web Service via Docker)
Since the backend uses spatial analysis packages (`osmnx`, `shapely`, `pyproj`), it requires underlying system libraries like `libgeos-dev` and `libproj-dev`. Therefore, it must be deployed on Render using the provided **Dockerfile**.

1. Go to the Render Dashboard and click **New +** -> **Web Service**.
2. Connect your Git repository.
3. Configure the following settings:
   * **Name**: `renew-backend`
   * **Language**: `Docker`
   * **Root Directory**: `backend` *(This points Render to compile from the subfolder)*
   * **Dockerfile Path**: `Dockerfile`
   * **Docker Build Context**: `.` *(relative to the Root Directory)*
   * **Instance Type**: `Free`
4. Add the following **Environment Variables** in the Service Settings:
   * `PORT` = `8000`
   * `TOMTOM_API_KEY` = `(Your Key)` *(Optional)*
   * `OPENWEATHER_API_KEY` = `(Your Key)` *(Optional)*
   * `ORS_API_KEY` = `(Your Key)` *(Optional)*
   * `DATABASE_URL` = *(See Database Persistence section below)*

---

### 💾 Handling Database Persistence on Render's Free Plan
On Render's Free tier, **persistent disks (volumes) are not available**. If you use a local SQLite database (`sqlite:///./data/renew.db`), the database file is ephemeral and will be reset every time the container restarts or redeploys. 

To solve this, choose one of the following two options:

#### Option A: Ephemeral SQLite (Zero Setup - Perfect for Demos)
* Do not set `DATABASE_URL` or keep it as `sqlite:///./data/renew.db`.
* **Behavior**: The backend automatically builds tables and seeds the junctions list on startup. The app will work perfectly during runtime. However, custom overrides, simulation history logs, or weather updates will clear whenever Render restarts the container (at least once per day or upon scaling).

#### Option B: Persistent PostgreSQL Database (Recommended, Free)
Render offers a free fully managed PostgreSQL database that you can connect to:
1. On the Render Dashboard, click **New +** -> **PostgreSQL**.
2. Name the database (e.g. `renew-db`) and choose the **Free** tier.
3. Once the database is created, find the **Internal Database URL** (which looks like `postgresql://user:password@host/db`).
4. Go back to your `renew-backend` Web Service -> **Environment** tab.
5. Set `DATABASE_URL` = `(Your Internal Database URL)`.
6. **Behavior**: The SQLAlchemy configuration in the backend will automatically detect the PostgreSQL connection, construct all tables, seed default values on startup if missing, and store all configurations, overrides, and logs permanently!

---

### 2. Deploying the Next.js Frontend (Web Service via Node)
The frontend runs as a Next.js server that communicates with your backend.

1. Go to the Render Dashboard and click **New +** -> **Web Service**.
2. Connect the same Git repository.
3. Configure the following settings:
   * **Name**: `renew-frontend`
   * **Language**: `Node`
   * **Root Directory**: `.` *(Leave blank or set to root directory)*
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
   * **Instance Type**: `Free`
4. Add the following **Environment Variables**:
   * **IMPORTANT**: Next.js injects public variables during compilation, so these environment variables must be defined **before** the build completes.
   * `NEXT_PUBLIC_API_URL` = `https://renew-backend.onrender.com` *(Replace with your deployed backend URL)*
   * `NEXT_PUBLIC_WS_URL` = `wss://renew-backend.onrender.com` *(Replace with your deployed backend WebSocket URL)*

Now, access your frontend URL, and you're good to go!
=======
RENEW — Smart Traffic Intelligence System
   Predict · Prevent · Optimize
Renew is an AI-powered smart traffic management system built for Bangalore's urban road network. It predicts congestion before it happens, automatically adjusts traffic signals in real time, and clears emergency corridors for ambulances — all from a single live operator dashboard.

How It Works
Predict — AI models analyze live junction data and forecast congestion up to 30 minutes ahead for each junction in the sector.
Prevent — A swarm of signal agents coordinate with each other to redistribute green phases and prevent gridlock before it forms.
Optimize — When an emergency vehicle is dispatched, the system computes the fastest route and turns every signal along that path green automatically.
The dashboard streams live telemetry from all junctions via WebSocket, showing real-time congestion levels, active ambulances, and alert notifications for operators.

Tech Stack
Backend - FastAPI (Python)
Road Graph - OSMnx + NetworkX (OpenStreetMap)
Traffic Data - TomTom API (with local simulation fallback)
Weather Data - OpenWeatherMap API
AI / ML - PyTorch, scikit-learn (LSTM + GNN models)
Simulation - NetworkX local sim (50 vehicles)
Frontend	- Next.js + React
Map - Leaflet.js
Real-time - WebSocket
Styling  - Tailwind CSS

App runs at https://renew-f83p.onrender.com/
>>>>>>> bd6dc7b26fdc29de4f8249be40159dad499dd1d6
