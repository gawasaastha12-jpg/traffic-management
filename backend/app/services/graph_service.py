import os
import osmnx as ox
import networkx as nx
from app.config import settings

class RoadGraphService:
    def __init__(self):
        self.data_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "data"
        )
        self.graph_path = os.path.join(self.data_dir, "bangalore_whitefield.graphml")
        self.geojson_path = os.path.join(self.data_dir, "whitefield_roads.geojson")
        self.G = None
        self.center_lat = 12.9698
        self.center_lng = 77.7500
        self.radius = 2200

        # Mapping dictionary to rename OSM node IDs to clean target junction IDs
        self.junction_map = {
            "node-1": "WF_J_001",
            "node-2": "WF_J_002",
            "node-3": "WF_J_003",
            "node-4": "WF_J_004",
            "node-5": "WF_J_005",
            "node-6": "WF_J_006",
            "node-7": "WF_J_007"
        }

    def load_or_download_graph(self) -> nx.MultiDiGraph:
        """
        Loads the graph from cached GraphML.
        Generates and saves the road network as a GeoJSON file too.
        """
        os.makedirs(self.data_dir, exist_ok=True)

        if os.path.exists(self.graph_path):
            print(f"[GraphService] Loading cached graph from {self.graph_path}")
            try:
                self.G = ox.load_graphml(self.graph_path)
                self._save_geojson_if_missing()
                return self.G
            except Exception as e:
                print(f"[GraphService] Error loading GraphML: {e}. Re-downloading...")
        
        print(f"[GraphService] Downloading road network for Whitefield...")
        try:
            G = ox.graph_from_point(
                (self.center_lat, self.center_lng),
                dist=self.radius,
                network_type="drive",
                simplify=True
            )
            ox.save_graphml(G, filepath=self.graph_path)
            self.G = G
            self._save_geojson_if_missing()
            return G
        except Exception as e:
            print(f"[GraphService] Failed to query OSMnx: {e}. Falling back to mock graph.")
            G = nx.MultiDiGraph()
            G.add_node("node-1", y=12.9841, x=77.7523, name="Hope Farm")
            G.add_node("node-2", y=12.9772, x=77.7297, name="Vydehi Junction")
            G.add_node("node-3", y=12.9739, x=77.7126, name="Graphite India")
            G.add_node("node-4", y=12.9667, x=77.7188, name="Kundalahalli Gate")
            G.add_node("node-5", y=12.9918, x=77.7161, name="Hoodi Junction")
            G.add_node("node-6", y=12.9575, x=77.7442, name="Varthur Kodi")
            G.add_node("node-7", y=12.9976, x=77.7602, name="Kadugodi Bridge")
            
            # Connect the nodes
            G.add_edge("node-1", "node-2", length=1800, lanes=4, speed_limit=50, name="ITPL Road")
            G.add_edge("node-2", "node-3", length=1200, lanes=4, speed_limit=50, name="Graphite India Road")
            G.add_edge("node-3", "node-4", length=1000, lanes=3, speed_limit=40, name="Kundalahalli Main Road")
            
            self.G = G
            ox.save_graphml(G, filepath=self.graph_path)
            self._save_geojson_if_missing()
            return G

    def _save_geojson_if_missing(self):
        """
        Converts road network edges to GeoJSON using geopandas and caches it.
        This enables rapid, lightweight frontend Leaflet road network line rendering.
        """
        if not self.G:
            return

        try:
            print(f"[GraphService] Exporting graph road lines to GeoJSON at {self.geojson_path}")
            # Convert edge geometries to GeoDataFrame
            edges_gdf = ox.graph_to_gdfs(self.G, nodes=False)
            
            # Convert types to serialize cleanly
            if "lanes" in edges_gdf.columns:
                edges_gdf["lanes"] = edges_gdf["lanes"].astype(str)
            if "maxspeed" in edges_gdf.columns:
                edges_gdf["maxspeed"] = edges_gdf["maxspeed"].astype(str)
            
            # Export
            edges_gdf.to_file(self.geojson_path, driver="GeoJSON")
            print("[GraphService] GeoJSON export completed successfully.")
        except Exception as e:
            print(f"[GraphService] Could not write GeoJSON file using geopandas: {e}. Creating fallback JSON file...")
            self._write_manual_geojson()

    def _write_manual_geojson(self):
        """
        Fallback custom JSON serializer to write GeoJSON files if geopandas driver fails.
        """
        import json
        features = []
        for u, v, key, data in self.G.edges(keys=True, data=True):
            geometry = data.get("geometry", None)
            coords = []
            if geometry:
                coords = [[float(c[0]), float(c[1])] for c in list(geometry.coords)]
            else:
                u_lng = float(self.G.nodes[u].get("x", self.center_lng))
                u_lat = float(self.G.nodes[u].get("y", self.center_lat))
                v_lng = float(self.G.nodes[v].get("x", self.center_lng))
                v_lat = float(self.G.nodes[v].get("y", self.center_lat))
                coords = [[u_lng, u_lat], [v_lng, v_lat]]

            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coords
                },
                "properties": {
                    "source": str(u),
                    "destination": str(v),
                    "name": str(data.get("name", "Unnamed Link")),
                    "length": float(data.get("length", 100))
                }
            })
            
        geojson_data = {
            "type": "FeatureCollection",
            "features": features
        }
        try:
            with open(self.geojson_path, "w") as f:
                json.dump(geojson_data, f)
            print("[GraphService] Fallback GeoJSON written successfully.")
        except Exception as err:
            print(f"[GraphService] Manual GeoJSON write failed: {err}")

    def get_clean_junction_id(self, node_id: str) -> str:
        """
        Maps a generic OSM node integer ID to a clean corporate WF_J_XXX string ID.
        """
        n_str = str(node_id)
        if n_str in self.junction_map:
            return self.junction_map[n_str]
        
        # Sequentially map any other node integer consistently
        # e.g., node 2374829 -> WF_J_237
        clean_num = int(n_str[-3:]) if n_str[-3:].isdigit() else hash(n_str) % 900 + 100
        return f"WF_J_{clean_num}"

    def get_network_geojson(self):
        if self.G is None:
            self.load_or_download_graph()

        nodes_data = []
        edges_data = []

        for node_id, data in self.G.nodes(data=True):
            lat = data.get("y", self.center_lat)
            lng = data.get("x", self.center_lng)
            clean_id = self.get_clean_junction_id(node_id)
            nodes_data.append({
                "id": clean_id,
                "name": data.get("name", f"Junction {clean_id}"),
                "lat": lat,
                "lng": lng
            })

        for u, v, key, data in self.G.edges(keys=True, data=True):
            geometry = data.get("geometry", None)
            coords = []
            if geometry:
                coords = list(geometry.coords)
                coords = [[c[1], c[0]] for c in coords]
            else:
                u_lat = self.G.nodes[u].get("y", self.center_lat)
                u_lng = self.G.nodes[u].get("x", self.center_lng)
                v_lat = self.G.nodes[v].get("y", self.center_lat)
                v_lng = self.G.nodes[v].get("x", self.center_lng)
                coords = [[u_lat, u_lng], [v_lat, v_lng]]

            edges_data.append({
                "source": self.get_clean_junction_id(u),
                "destination": self.get_clean_junction_id(v),
                "name": data.get("name", "Unnamed Link"),
                "length": float(data.get("length", 100)),
                "lanes": int(data.get("lanes", 2)[0]) if isinstance(data.get("lanes", 2), list) else int(data.get("lanes", 2)),
                "speed_limit": int(data.get("maxspeed", "40")[0]) if isinstance(data.get("maxspeed", "40"), list) else int(data.get("maxspeed", "40") if str(data.get("maxspeed", "40")).isdigit() else 40),
                "geometry": coords,
                "congestion_score": int(data.get("congestion_score", 10))
            })

        return {"nodes": nodes_data, "edges": edges_data}

# Singleton instance
graph_service = RoadGraphService()
