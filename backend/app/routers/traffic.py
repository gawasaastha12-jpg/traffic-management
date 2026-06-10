from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import JunctionModel, IncidentModel
from app.services.traffic_service import traffic_service
from app.services.graph_service import graph_service

router = APIRouter(prefix="/api/grid", tags=["Grid"])

@router.get("")
@router.get("/")
@router.get("/junctions")
def get_all_junctions(db: Session = Depends(get_db)):
    """
    Returns lists of junctions registered in SQLite.
    """
    junctions = db.query(JunctionModel).all()
    # Initialize seeds if empty
    if not junctions:
        traffic_service._initialize_default_junctions(db)
        junctions = db.query(JunctionModel).all()
    return junctions

@router.get("/roads")
def get_all_roads():
    """
    Returns edges from graphML model.
    """
    geojson = graph_service.get_network_geojson()
    return geojson.get("edges", [])

@router.get("/live")
def get_live_telemetry(db: Session = Depends(get_db)):
    """
    Triggers live TomTom Traffic Flow polls and returns updated congestion rates.
    """
    return traffic_service.fetch_live_flow_telemetry(db)

@router.get("/incidents")
def get_live_incidents(db: Session = Depends(get_db)):
    """
    Returns current active incidents registered on the road network.
    """
    incidents = db.query(IncidentModel).filter(IncidentModel.resolved == False).all()
    if not incidents:
        return traffic_service.fetch_live_incidents(db)
    return incidents

@router.get("/predictions")
def get_traffic_predictions(db: Session = Depends(get_db)):
    """
    Calculates GCN spatial convolved bottleneck forecasting for the next 6 hours.
    """
    junctions = db.query(JunctionModel).all()
    if not junctions:
        traffic_service._initialize_default_junctions(db)
        junctions = db.query(JunctionModel).all()
    
    densities = {j.id: j.congestion_level for j in junctions}
    from app.services.ai_service import gcn_forecaster
    predictions = gcn_forecaster.predict_forecasts(densities)
    return predictions

@router.get("/camera/{junction_id}")
def get_camera_telemetry(junction_id: str, db: Session = Depends(get_db)):
    """
    Simulates CCTV stream, runs YOLOv8 model inference on virtual frame,
    and returns the active bounding box detections.
    """
    junction = db.query(JunctionModel).filter(JunctionModel.id == junction_id).first()
    queue_len = 20.0
    if junction:
        queue_len = float(junction.congestion_level * 4.2)
        
    from app.services.ai_service import yolo_detector
    result = yolo_detector.detect_vehicles(junction_id, queue_len)
    return result

@router.post("/corridor/{junction_id}")
def toggle_corridor(junction_id: str, db: Session = Depends(get_db)):
    """
    Toggles active green corridor priority for a junction in SQLite.
    """
    junction = db.query(JunctionModel).filter(JunctionModel.id == junction_id).first()
    if junction:
        junction.green_corridor_active = not junction.green_corridor_active
        if junction.green_corridor_active:
            # Drop congestion indices significantly
            junction.congestion_level = max(10, junction.congestion_level - 40)
            junction.average_wait_time = 12
        else:
            # Revert delay times
            junction.congestion_level = min(100, junction.congestion_level + 35)
            junction.average_wait_time = int(junction.congestion_level * 1.8)
        
        db.add(junction)
        db.commit()
        db.refresh(junction)
    return junction

@router.post("/mode/{junction_id}")
def override_mode(junction_id: str, mode_payload: dict = Depends(lambda: None), db: Session = Depends(get_db)):
    """
    Overrides signal control modes.
    """
    junction = db.query(JunctionModel).filter(JunctionModel.id == junction_id).first()
    if junction and mode_payload:
        mode = mode_payload.get("mode", "Adaptive AI")
        junction.signal_mode = mode
        db.add(junction)
        db.commit()
        db.refresh(junction)
    return junction

