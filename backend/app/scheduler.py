import asyncio
import time
from app.db import SessionLocal
from app.services.websocket_manager import websocket_manager
from app.services.traffic_service import traffic_service
from app.services.weather_service import weather_service

active_tasks = []

async def traffic_polling_task():
    """
    Asynchronous task that polls TomTom, OpenWeather, and simulates bus telemetry,
    broadcasting the unified traffic state to WebSockets every 30 seconds.
    """
    print("[Scheduler] Traffic polling background task started.")
    while True:
        try:
            db = SessionLocal()
            try:
                # Keep old state records for Reinforcement Learning updates
                from app.models import JunctionModel
                from app.services.ai_service import rl_signal_agent
                
                junctions_before = db.query(JunctionModel).all()
                old_congestion = {j.id: j.congestion_level for j in junctions_before}

                # 1. Ingest traffic flows and incidents
                traffic_service.fetch_live_flow_telemetry(db)
                incidents_data = traffic_service.fetch_live_incidents(db)
                
                # 2. Run Q-learning optimizations on Adaptive AI signals
                junctions_after = db.query(JunctionModel).all()
                for j in junctions_after:
                    if j.signal_mode == "Adaptive AI" and not j.green_corridor_active:
                        old_c = old_congestion.get(j.id, 50)
                        action = rl_signal_agent.select_action(j.id, old_c)
                        new_c = j.congestion_level
                        rl_signal_agent.learn_update(j.id, old_c, action, new_c)
                        
                        split_seconds = rl_signal_agent.action_labels[action]
                        j.average_wait_time = int(split_seconds * (new_c / 100.0))
                        db.add(j)
                db.commit()
                
                # Rebuild flow data containing RL-modified wait times
                flow_data = [{
                    "id": j.id,
                    "name": j.name,
                    "lat": j.latitude,
                    "lng": j.longitude,
                    "congestion_level": j.congestion_level,
                    "signal_mode": j.signal_mode,
                    "green_corridor_active": j.green_corridor_active,
                    "average_wait_time": j.average_wait_time,
                    "data_source": j.data_source
                } for j in junctions_after]
                
                # 2. Ingest weather details
                weather_data = weather_service.fetch_live_weather(db)
                
                # 3. Simulate BMTC bus movement along routes
                buses_data = _simulate_bus_movement()

                # 4. Broadcast unified state payload to WebSockets
                payload = {
                    "type": "telemetry_update",
                    "junctions": flow_data,
                    "incidents": incidents_data,
                    "weather": weather_data,
                    "active_buses": buses_data
                }
                await websocket_manager.broadcast(payload)
            finally:
                db.close()
        except asyncio.CancelledError:
            print("[Scheduler] Traffic polling background task stopped.")
            break
        except Exception as e:
            print(f"[Scheduler] Error in traffic polling loop: {e}")
            
        await asyncio.sleep(30)

def _simulate_bus_movement():
    """
    Simulates BMTC buses along main Whitefield routes.
    """
    routes = [
        [[12.9841, 77.7523], [12.9800, 77.7400], [12.9772, 77.7297]], # Route 1
        [[12.9739, 77.7126], [12.9700, 77.7150], [12.9667, 77.7188]], # Route 2
        [[12.9575, 77.7442], [12.9700, 77.7500], [12.9841, 77.7523]], # Route 3
    ]
    simulated_buses = []
    t = time.time()
    
    for idx, path in enumerate(routes):
        seg_idx = int(t / 10) % (len(path) - 1)
        start = path[seg_idx]
        end = path[seg_idx + 1]
        
        ratio = (t % 10) / 10.0
        lat = start[0] + (end[0] - start[0]) * ratio
        lng = start[1] + (end[1] - start[1]) * ratio
        
        simulated_buses.append({
            "id": f"bus-{idx+1}",
            "route_no": f"500-D/W-{idx+1}",
            "lat": lat,
            "lng": lng,
            "status": "On-Time"
        })
    return simulated_buses

async def start_scheduler():
    """
    Launches all background schedulers.
    """
    loop_task = asyncio.create_task(traffic_polling_task())
    active_tasks.append(loop_task)
    print("[Scheduler] All background schedulers launched.")

async def stop_scheduler():
    """
    Cancels and cleans up all active schedulers.
    """
    for task in active_tasks:
        task.cancel()
    active_tasks.clear()
    print("[Scheduler] All active schedulers stopped.")
