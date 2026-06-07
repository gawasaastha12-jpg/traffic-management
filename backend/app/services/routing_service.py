import requests
import networkx as nx
from app.config import settings
from app.services.graph_service import graph_service

class RoutingService:
    def __init__(self):
        self.api_key = settings.ORS_API_KEY

    def calculate_eta_and_route(self, u_id: str, v_id: str, congestion_weights: dict = None):
        """
        Calculates the optimal route and travel time ETA between two junction IDs.
        If ORS_API_KEY is configured, calls the OpenRouteService directions API.
        Otherwise, falls back to local routing calculation on the loaded GraphML network.
        """
        # Load the graph
        G = graph_service.G
        if G is None:
            G = graph_service.load_or_download_graph()

        # If IDs aren't in the graph, find nearest node IDs
        node_list = list(G.nodes)
        if not node_list:
            return {"eta_seconds": 300, "route_nodes": [], "distance_meters": 1200}

        u = u_id if u_id in G.nodes else node_list[0]
        v = v_id if v_id in G.nodes else node_list[-1]

        # Try OpenRouteService directions API (driving-car profile)
        if self.api_key:
            u_lat = G.nodes[u].get("y")
            u_lng = G.nodes[u].get("x")
            v_lat = G.nodes[v].get("y")
            v_lng = G.nodes[v].get("x")
            
            # ORS directions API accepts start/end parameters in lng,lat format
            url = (
                f"https://api.openrouteservice.org/v2/directions/driving-car"
                f"?api_key={self.api_key}"
                f"&start={u_lng},{u_lat}"
                f"&end={v_lng},{v_lat}"
            )
            try:
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    route_data = response.json()
                    features = route_data.get("features", [])
                    if features:
                        properties = features[0].get("properties", {})
                        summary = properties.get("summary", {})
                        duration = summary.get("duration", 300) # seconds
                        distance = summary.get("distance", 1000) # meters
                        
                        geometry = features[0].get("geometry", {})
                        coordinates = geometry.get("coordinates", [])
                        # Convert [lng, lat] coordinate list from ORS to [lat, lng] for Leaflet
                        route_coords = [[c[1], c[0]] for c in coordinates]
                        
                        return {
                            "eta_seconds": int(duration),
                            "distance_meters": int(distance),
                            "route_nodes": [u, v],
                            "route_coordinates": route_coords,
                            "mode": "OpenRouteService_API"
                        }
            except Exception as e:
                print(f"[RoutingService] OpenRouteService directions API failed: {e}. Falling back to NetworkX.")


        # Local NetworkX Route Calculation (Fallback)
        try:
            # We define custom travel time weights for edges
            # travel_time = length / speed (converted to m/s) * (1 + congestion_level / 100)
            def travel_time_weight(edge_u, edge_v, edge_data):
                length = float(edge_data.get("length", 100))
                
                # Retrieve speed limit
                speed_kph = 40
                maxspeed = edge_data.get("maxspeed", "40")
                if isinstance(maxspeed, list):
                    maxspeed = maxspeed[0]
                if str(maxspeed).isdigit():
                    speed_kph = int(maxspeed)
                
                speed_ms = speed_kph * (1000.0 / 3600.0) # convert to meters per second
                
                # Fetch live congestion overlay
                congestion = 10
                if congestion_weights and f"{edge_u}-{edge_v}" in congestion_weights:
                    congestion = congestion_weights[f"{edge_u}-{edge_v}"]
                else:
                    congestion = int(edge_data.get("congestion_score", 10))

                multiplier = 1.0 + (congestion / 100.0) * 3.0  # Heavy congestion delays routing times up to 4x
                
                base_time = length / speed_ms
                return base_time * multiplier

            # Run Dijkstra shortest path on weighted graph
            path = nx.shortest_path(G, source=u, target=v, weight=travel_time_weight)
            
            # Compute total travel time and length along the path
            total_duration = 0.0
            total_length = 0.0
            for i in range(len(path) - 1):
                node_u = path[i]
                node_v = path[i+1]
                edge_data = G[node_u][node_v][0]
                total_length += float(edge_data.get("length", 100))
                total_duration += travel_time_weight(node_u, node_v, edge_data)

            # Get route coordinates for drawing on map
            route_coords = []
            for node in path:
                route_coords.append([
                    G.nodes[node].get("y", 12.9698),
                    G.nodes[node].get("x", 77.7500)
                ])

            return {
                "eta_seconds": int(total_duration),
                "distance_meters": int(total_length),
                "route_nodes": [str(n) for n in path],
                "route_coordinates": route_coords,
                "mode": "NetworkX_Local"
            }
        except Exception as e:
            print(f"[RoutingService] NetworkX local path calculation failed: {e}")
            return {
                "eta_seconds": 300,
                "distance_meters": 1200,
                "route_nodes": [u_id, v_id],
                "mode": "Mock_Fallback"
            }

# Singleton instance
routing_service = RoutingService()
