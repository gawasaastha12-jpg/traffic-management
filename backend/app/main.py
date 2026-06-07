import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db import engine, Base, SessionLocal
from app.routers import graph, traffic, weather, routing, simulation, emergency
from app.services.websocket_manager import websocket_manager
from app.services.graph_service import graph_service
from app.services.traffic_service import traffic_service
from app.scheduler import start_scheduler, stop_scheduler

# Create SQLite database tables on startup
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    print("[Startup] Initializing system nodes...")
    # Load and cache OSMnx graph
    graph_service.load_or_download_graph()
    
    # Initialize mock junctions in SQLite
    db = SessionLocal()
    try:
        traffic_service._initialize_default_junctions(db)
    finally:
        db.close()
        
    # Start polling loops via centralized scheduler
    await start_scheduler()
    
    yield
    
    # Shutdown tasks
    print("[Shutdown] Cleaning active tasks...")
    await stop_scheduler()


app = FastAPI(
    title="Renew Smart Traffic Intelligence API",
    description="Digital Twin and micro-simulation api endpoints.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration to allow local Next.js calls
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API endpoints
app.include_router(graph.router)
app.include_router(traffic.router)
app.include_router(weather.router)
app.include_router(routing.router)
app.include_router(simulation.router)
app.include_router(emergency.router)

@app.websocket("/api/ws/traffic")
async def websocket_traffic_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time traffic broadcasts.
    """
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep socket alive and listen to any messages sent by client
            data = await websocket.receive_text()
            # Respond to ping/echoes
            await websocket.send_json({"type": "pong", "payload": data})
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        print(f"[WebSocket] Exception on session loop: {e}")
        websocket_manager.disconnect(websocket)

@app.get("/")
def read_root():
    return {"status": "online", "system": "RENEW Traffic Digital Twin"}
