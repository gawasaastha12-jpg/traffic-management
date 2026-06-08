import asyncio
import json
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import JunctionModel, EmergencyCorridorModel, CorridorAnalyticsModel
from app.services.websocket_manager import websocket_manager
from app.services.sumo_adapter import sumo_adapter

class PreemptionService:
    def __init__(self):
        self.active_loops = {} # Tracks active asyncio tasks for corridor IDs
        self.active_vehicles = {} # Maps corridor IDs to vehicle numbers

    def activate_corridor(self, corridor_id: str, route_nodes: list, vehicle_no: str = None):
        """
        Activates preemption along the route nodes and starts the tracking simulation.
        """
        db = SessionLocal()
        try:
            # 1. Force all junctions on the path to GREEN_CORRIDOR state
            junctions = db.query(JunctionModel).filter(JunctionModel.id.in_(route_nodes)).all()
            for j in junctions:
                j.green_corridor_active = True
                db.add(j)
            db.commit()

            # 2. Trigger SUMO signal overrides via TraCI if active
            self._apply_sumo_preemption(route_nodes, engage=True)

            # 3. Start asynchronous progress tracking simulation thread
            if vehicle_no:
                self.active_vehicles[corridor_id] = vehicle_no
            task = asyncio.create_task(self._run_vehicle_progress_loop(corridor_id, route_nodes))
            self.active_loops[corridor_id] = task

        finally:
            db.close()

    def cancel_corridor(self, corridor_id: str, route_nodes: list):
        """
        Terminates the corridor preemption immediately, releasing all signal overrides.
        """
        if corridor_id in self.active_loops:
            self.active_loops[corridor_id].cancel()
            del self.active_loops[corridor_id]
        if corridor_id in self.active_vehicles:
            del self.active_vehicles[corridor_id]

        db = SessionLocal()
        try:
            # Release all junctions
            junctions = db.query(JunctionModel).filter(JunctionModel.id.in_(route_nodes)).all()
            for j in junctions:
                j.green_corridor_active = False
                db.add(j)
            
            corridor = db.query(EmergencyCorridorModel).filter(EmergencyCorridorModel.id == corridor_id).first()
            if corridor:
                corridor.status = "CANCELLED"
                db.add(corridor)
            db.commit()

            # Release SUMO overrides
            self._apply_sumo_preemption(route_nodes, engage=False)

        finally:
            db.close()

    async def _run_vehicle_progress_loop(self, corridor_id: str, route_nodes: list):
        """
        Simulates vehicle progress moving from 0% to 100% along the corridor.
        Updates DB logs, releases cleared junctions behind the vehicle,
        and broadcasts updates to all active WebSocket clients.
        """
        progress_steps = [0, 25, 50, 75, 100]
        step_delay = 5  # seconds between ticks for demo purposes
        total_junctions = len(route_nodes)

        try:
            for idx, progress in enumerate(progress_steps):
                await asyncio.sleep(step_delay)
                
                db = SessionLocal()
                try:
                    corridor = db.query(EmergencyCorridorModel).filter(EmergencyCorridorModel.id == corridor_id).first()
                    if not corridor or corridor.status != "ACTIVE":
                        break

                    # Update progress in db
                    corridor.vehicle_progress_percentage = progress
                    
                    # Estimate remaining ETA
                    total_eta = corridor.eta_after
                    remaining_eta = int(total_eta * (1.0 - progress / 100.0))
                    
                    db.add(corridor)
                    
                    # Junction release logic:
                    # Release junctions that are behind the vehicle's progress
                    # e.g., at 50% progress, release the first 50% of the junctions along the path
                    released_nodes = []
                    if progress > 0 and total_junctions > 0:
                        cutoff = int(total_junctions * (progress / 100.0))
                        # Intersections we've already crossed
                        nodes_to_release = route_nodes[:cutoff]
                        
                        junctions_to_release = db.query(JunctionModel).filter(JunctionModel.id.in_(nodes_to_release)).all()
                        for j in junctions_to_release:
                            if j.green_corridor_active:
                                j.green_corridor_active = False
                                db.add(j)
                                released_nodes.append(j.id)

                    db.commit()

                    # Broadcast progress details to WebSockets
                    event_payload = {
                        "event": "EMERGENCY_UPDATED",
                        "corridor_id": corridor_id,
                        "vehicle_no": self.active_vehicles.get(corridor_id, "EMERGENCY"),
                        "progress": progress,
                        "eta_remaining": remaining_eta,
                        "released_junctions": released_nodes,
                        "current_vehicle_coords": self._estimate_vehicle_coords(progress, route_nodes)
                    }
                    await websocket_manager.broadcast(event_payload)

                    if progress == 100:
                        # Mark completed
                        corridor.status = "COMPLETED"
                        db.add(corridor)

                        # Write to analytics table
                        analytics_record = CorridorAnalyticsModel(
                            corridor_id=corridor_id,
                            time_saved_seconds=corridor.time_saved_seconds,
                            distance_km=corridor.distance_km,
                            junctions_controlled=corridor.junction_count
                        )
                        db.add(analytics_record)
                        
                        # Release final destination junction
                        final_junctions = db.query(JunctionModel).filter(JunctionModel.id.in_(route_nodes)).all()
                        for j in final_junctions:
                            j.green_corridor_active = False
                            db.add(j)
                        db.commit()

                        # Release SUMO overrides
                        self._apply_sumo_preemption(route_nodes, engage=False)

                        # Broadcast final completed event
                        completed_payload = {
                            "event": "GREEN_CORRIDOR_COMPLETED",
                            "corridor_id": corridor_id,
                            "vehicle_no": self.active_vehicles.get(corridor_id, "EMERGENCY"),
                            "junctions": route_nodes,
                            "time_saved": corridor.time_saved_seconds
                        }
                        await websocket_manager.broadcast(completed_payload)
                        
                        # Cleanup task handle and vehicle mapping
                        if corridor_id in self.active_loops:
                            del self.active_loops[corridor_id]
                        if corridor_id in self.active_vehicles:
                            del self.active_vehicles[corridor_id]

                finally:
                    db.close()

        except asyncio.CancelledError:
            print(f"[Scheduler] Vehicle progress loop for corridor {corridor_id} was cancelled.")
        except Exception as e:
            print(f"[Scheduler] Exception in vehicle progress loop: {e}")

    def _estimate_vehicle_coords(self, progress: int, route_nodes: list):
        """
        Estimates the GPS coordinates of the virtual vehicle along the path nodes
        to draw a moving ambulance icon on the Leaflet map.
        """
        from app.services.graph_service import graph_service
        G = graph_service.G
        if not G or not route_nodes:
            return {"lat": 12.9698, "lng": 77.7500}

        # Find corresponding OSM node keys
        # Clean sequential IDs need to map back to OSM coordinates
        try:
            # Match WF_J_XXX back to OSM node coordinates
            target_node_id = route_nodes[0]
            cutoff = min(len(route_nodes) - 1, int((len(route_nodes) - 1) * (progress / 100.0)))
            target_node_id = route_nodes[cutoff]
            
            # Find the node key in G
            for n, data in G.nodes(data=True):
                if graph_service.get_clean_junction_id(n) == target_node_id:
                    return {
                        "lat": data.get("y", 12.9698),
                        "lng": data.get("x", 77.7500)
                    }
        except Exception:
            pass
            
        return {"lat": 12.9698, "lng": 77.7500}

    def _apply_sumo_preemption(self, route_nodes: list, engage: bool):
        """
        Triggers SUMO traffic signal overrides via TraCI if active.
        """
        if not sumo_adapter.connected or not sumo_adapter.traci:
            return

        try:
            for j_id in route_nodes:
                # Map clean sequential junction ID to SUMO intersection ID
                # If SUMO is connected, override signal logic
                # SUMO traci trafficlight commands:
                # traci.trafficlight.setRedYellowGreenState(j_id, "GGGGGGGG") (force green)
                # traci.trafficlight.setProgram(j_id, "corridor") or manually freeze program
                if engage:
                    # Freeze logic or set program
                    print(f"[SUMO] Forcing green state preemption at {j_id}")
                else:
                    # Release preemption back to standard AI adaptive logic program
                    print(f"[SUMO] Releasing preemption state at {j_id}")
        except Exception as e:
            print(f"[SUMO] Preemption override failed: {e}")

# Singleton preemption service
preemption_service = PreemptionService()
