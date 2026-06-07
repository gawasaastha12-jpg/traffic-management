import random
import asyncio
from typing import Dict, List
from app.services.graph_service import graph_service

class SimulationService:
    def __init__(self):
        self.is_running = False
        self.vehicles_count = 50
        self.simulation_speed = 1.0
        # Tracks dynamic queues at junctions in memory: junction_id -> list of simulated vehicle IDs
        self.junction_queues: Dict[str, List[str]] = {}
        # Tracks average crossing delay per junction
        self.junction_delays: Dict[str, float] = {}

    def start_simulation(self, vehicles_count: int = 50, speed: float = 1.0):
        """
        Triggers or resets the traffic simulation engine.
        Returns initial diagnostic states.
        """
        self.vehicles_count = vehicles_count
        self.simulation_speed = speed
        self.is_running = True
        
        # Initialize queues for junctions from the loaded OSMnx graph
        G = graph_service.G
        if G is None:
            graph_service.load_or_download_graph()
            G = graph_service.G
            
        nodes = list(G.nodes) if G else ["WF_J_001", "WF_J_002", "WF_J_003", "WF_J_004", "WF_J_005", "WF_J_006", "WF_J_007"]

        
        for n in nodes:
            node_id = str(n)
            # Create simulated vehicle queues based on static node density multipliers
            density_seed = random.randint(2, 25)
            self.junction_queues[node_id] = [f"veh-{node_id}-{i}" for i in range(density_seed)]
            self.junction_delays[node_id] = float(density_seed * 4.5)

        print(f"[SimService] NetworkX local traffic simulation started with {vehicles_count} vehicles.")
        return {
            "status": "simulation_active",
            "engine": "NetworkX_Fallback_Flows",
            "nodes_tracked": len(self.junction_queues),
            "total_simulated_vehicles": sum(len(q) for q in self.junction_queues.values()),
            "average_system_delay_seconds": round(sum(self.junction_delays.values()) / max(1, len(self.junction_delays)), 1)
        }

    def get_simulation_metrics(self, junction_id: str):
        """
        Retrieves real-time queue lengths and delays for a junction.
        Attempts to call the SUMO adapter, falling back to the local NetworkX engine if offline.
        """
        from app.services.sumo_adapter import sumo_adapter
        
        # 1. Try SUMO live transponder
        sumo_metrics = sumo_adapter.get_micro_simulation_metrics(junction_id)
        if sumo_metrics:
            return sumo_metrics

        # 2. NetworkX Fallback
        node_id = str(junction_id)
        queue = self.junction_queues.get(node_id, [])
        
        # Simulate slight changes in queue length
        drift = random.choice([-2, -1, 0, 1, 2])
        new_queue_len = max(0, len(queue) + drift)
        
        # Update queue
        self.junction_queues[node_id] = [f"veh-{node_id}-{i}" for i in range(new_queue_len)]
        self.junction_delays[node_id] = float(new_queue_len * 4.2)
        
        return {
            "queue_count": new_queue_len,
            "queue_meters": new_queue_len * 6.5, # Assume average vehicle space is 6.5m
            "average_delay_seconds": round(self.junction_delays[node_id], 1)
        }


# Singleton instance
simulation_service = SimulationService()
