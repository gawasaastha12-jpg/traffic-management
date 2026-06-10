


---

=======
RENEW — Smart Traffic Intelligence System
   Predict · Prevent · Optimize
Renew is an AI-powered smart traffic management system built for Bangalore's urban road network. It predicts congestion before it happens, automatically adjusts traffic signals in real time, and clears emergency corridors for ambulances — all from a single live operator dashboard.

How It Works
It predicts congestion before it happens, automatically adjusts traffic signals in real time, and clears emergency corridors for ambulances — all from a single live operator or commuter dashboard.

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

