import requests
import random
import datetime
from sqlalchemy.orm import Session
from app.config import settings
from app.db import SessionLocal
from app.models import JunctionModel, IncidentModel

class TrafficIngestionService:
    def __init__(self):
        self.api_key = settings.TOMTOM_API_KEY
        self.center_lat = 12.9698
        self.center_lng = 77.7500
        # Bounding box for Whitefield, Bengaluru
        self.min_lat = 12.9500
        self.max_lat = 12.9900
        self.min_lng = 77.7100
        self.max_lng = 77.7600

    def fetch_live_incidents(self, db: Session):
        """
        Ingests traffic incidents from TomTom API.
        Falls back to generating mock incident alerts if key is missing.
        """
        if not self.api_key:
            return self._generate_simulated_incidents(db)

        # TomTom Incident Details endpoint url
        # zoom=12 covers the sector area
        url = (
            f"https://api.tomtom.com/traffic/services/4/incidentDetails/s3/"
            f"{self.min_lng},{self.min_lat},{self.max_lng},{self.max_lat}/12/-1/json"
            f"?key={self.api_key}&language=en-GB"
        )
        
        try:
            response = requests.get(url, timeout=3)
            if response.status_code == 200:
                data = response.json()
                incidents_list = data.get("tm", {}).get("poi", [])
                
                # Clear resolved incidents
                db.query(IncidentModel).delete()
                
                saved_incidents = []
                for inc in incidents_list[:8]:  # Limit to top 8 incidents for console size
                    inc_id = inc.get("id", f"inc-{random.randint(1000, 9999)}")
                    desc = inc.get("d", "Traffic Incident reported")
                    lat = inc.get("p", {}).get("y", self.center_lat)
                    lng = inc.get("p", {}).get("x", self.center_lng)
                    severity_code = inc.get("ic", 1) # 1=Minor, 3=Critical
                    
                    severity = "info"
                    if severity_code >= 3:
                        severity = "critical"
                    elif severity_code >= 2:
                        severity = "warning"
                        
                    db_incident = IncidentModel(
                        id=inc_id,
                        title=inc.get("f", "Road Malfunction"),
                        message=desc,
                        latitude=lat,
                        longitude=lng,
                        severity=severity,
                        resolved=False
                    )
                    db.add(db_incident)
                    saved_incidents.append({
                        "id": inc_id,
                        "title": db_incident.title,
                        "message": desc,
                        "lat": lat,
                        "lng": lng,
                        "severity": severity
                    })
                
                db.commit()
                return saved_incidents
            else:
                print(f"[TrafficService] TomTom API incident query failed: {response.status_code}")
                return self._generate_simulated_incidents(db)
        except Exception as e:
            print(f"[TrafficService] Exception during TomTom incident poll: {e}")
            return self._generate_simulated_incidents(db)

    def fetch_live_flow_telemetry(self, db: Session):
        """
        Polls TomTom Traffic Flow API for whitefield coordinates.
        Applies data back to junctions state metrics in SQLite.
        """
        junctions = db.query(JunctionModel).all()
        updated_junctions = []

        # If no junctions in DB, initialize them from static seeds
        if not junctions:
            self._initialize_default_junctions(db)
            junctions = db.query(JunctionModel).all()

        for j in junctions:
            congestion = j.congestion_level
            use_fallback = not self.api_key
            
            if self.api_key:
                # TomTom Flow Segment Data endpoint
                url = (
                    f"https://api.tomtom.com/traffic/services/4/flowSegmentData/relative/10/json"
                    f"?key={self.api_key}&point={j.latitude},{j.longitude}"
                )
                try:
                    response = requests.get(url, timeout=2)
                    if response.status_code == 200:
                        flow_data = response.json().get("flowSegmentData", {})
                        current_speed = flow_data.get("currentSpeed", 40)
                        free_speed = flow_data.get("freeFlowSpeed", 50)
                        
                        # Calculate congestion ratio
                        ratio = max(0, min(100, int((1 - (current_speed / max(1, free_speed))) * 100)))
                        congestion = ratio
                    else:
                        print(f"[TrafficService] Flow request failed for {j.name} with status {response.status_code}. Using simulation fallback.")
                        use_fallback = True
                except Exception as e:
                    print(f"[TrafficService] Flow request exception/timeout for {j.name}: {e}. Using simulation fallback.")
                    use_fallback = True

            # If not using API or API failed, run a slight random walk fluctuation
            if use_fallback:
                change = random.choice([-5, -3, 0, 3, 5])
                congestion = max(10, min(100, congestion + change))

            # Update database
            j.congestion_level = congestion
            # Calculate wait time relative to congestion
            j.average_wait_time = int(congestion * 1.8) if not j.green_corridor_active else 12
            db.add(j)

            updated_junctions.append({
                "id": j.id,
                "name": j.name,
                "lat": j.latitude,
                "lng": j.longitude,
                "congestion_level": j.congestion_level,
                "signal_mode": j.signal_mode,
                "green_corridor_active": j.green_corridor_active,
                "average_wait_time": j.average_wait_time
            })

        db.commit()
        return updated_junctions

    def _initialize_default_junctions(self, db: Session):
        initial_junctions = [
            ("WF_J_001", "Hope Farm Junction", 12.9841, 77.7523, 75),
            ("WF_J_002", "Vydehi Hospital Junction", 12.9772, 77.7297, 50),
            ("WF_J_003", "Graphite India Junction", 12.9739, 77.7126, 88),
            ("WF_J_004", "Kundalahalli Gate Junction", 12.9667, 77.7188, 25),
            ("WF_J_005", "Hoodi Junction", 12.9918, 77.7161, 35),
            ("WF_J_006", "Varthur Kodi Junction", 12.9575, 77.7442, 60),
            ("WF_J_007", "Kadugodi Bridge Junction", 12.9976, 77.7602, 20),
        ]

        for j_id, name, lat, lng, cong in initial_junctions:
            existing = db.query(JunctionModel).filter(JunctionModel.id == j_id).first()
            if not existing:
                model = JunctionModel(
                    id=j_id,
                    name=name,
                    latitude=lat,
                    longitude=lng,
                    congestion_level=cong,
                    signal_mode="Adaptive AI",
                    green_corridor_active=False,
                    average_wait_time=int(cong * 1.8)
                )
                db.add(model)
        db.commit()

    def _generate_simulated_incidents(self, db: Session):
        # Clear previous unresolved incidents
        db.query(IncidentModel).filter(IncidentModel.resolved == False).delete()
        
        sim_data = [
            ("inc-1", "Water Logging Warning", "Heavy rain has caused localized flooding blocking Left Lane near Hope Farm.", 12.9835, 77.7520, "critical"),
            ("inc-2", "Vehicle Breakdown", "Broken down auto-rickshaw causing backlog at Graphite India Junction.", 12.9742, 77.7130, "warning"),
            ("inc-3", "Minor Collision", "Two-wheeler collision at Varthur Kodi. Traffic wardens routing vehicles.", 12.9572, 77.7448, "warning"),
        ]
        
        saved_incidents = []
        for inc_id, title, desc, lat, lng, severity in sim_data:
            model = IncidentModel(
                id=inc_id,
                title=title,
                message=desc,
                latitude=lat,
                longitude=lng,
                severity=severity,
                resolved=False
            )
            db.add(model)
            saved_incidents.append({
                "id": inc_id,
                "title": title,
                "message": desc,
                "lat": lat,
                "lng": lng,
                "severity": severity
            })
        db.commit()
        return saved_incidents

# Singleton instance
traffic_service = TrafficIngestionService()
