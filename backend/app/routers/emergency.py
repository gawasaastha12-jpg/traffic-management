from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.db import get_db
from app.models import EmergencyCorridorModel, CorridorAnalyticsModel
from app.services.emergency_service import emergency_service

router = APIRouter(prefix="/api/emergency", tags=["Emergency"])

class Coordinate(BaseModel):
    lat: float
    lon: float

class EmergencyCreatePayload(BaseModel):
    vehicle_type: str
    priority_level: Optional[int] = None
    origin: Coordinate
    destination: Coordinate
    vehicle_no: Optional[str] = None
    origin_name: Optional[str] = None
    destination_name: Optional[str] = None

class CancelPayload(BaseModel):
    corridor_id: str

@router.post("/create")
def create_corridor(payload: EmergencyCreatePayload, db: Session = Depends(get_db)):
    """
    Creates and initiates a green corridor for an emergency vehicle.
    """
    try:
        # Convert Pydantic payload to dictionary
        payload_dict = {
            "vehicle_type": payload.vehicle_type,
            "priority_level": payload.priority_level,
            "origin": {"lat": payload.origin.lat, "lon": payload.origin.lon},
            "destination": {"lat": payload.destination.lat, "lon": payload.destination.lon},
            "vehicle_no": payload.vehicle_no,
            "origin_name": payload.origin_name,
            "destination_name": payload.destination_name
        }
        corridor = emergency_service.create_emergency_corridor(db, payload_dict)
        return {
            "status": "success",
            "corridor_id": corridor.id,
            "eta_before": corridor.eta_before,
            "eta_after": corridor.eta_after,
            "time_saved_seconds": corridor.time_saved_seconds,
            "route_nodes": corridor.route_nodes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create corridor: {str(e)}")

@router.get("/active")
def get_active_corridors(db: Session = Depends(get_db)):
    """
    Returns all active emergency corridors.
    """
    corridors = db.query(EmergencyCorridorModel).filter(EmergencyCorridorModel.status == "ACTIVE").all()
    return corridors

@router.get("/history")
def get_corridor_history(db: Session = Depends(get_db)):
    """
    Returns completed and cancelled emergency corridors.
    """
    corridors = db.query(EmergencyCorridorModel).filter(EmergencyCorridorModel.status.in_(["COMPLETED", "CANCELLED"])).all()
    return corridors

@router.post("/cancel")
def cancel_corridor(payload: CancelPayload, db: Session = Depends(get_db)):
    """
    Cancels an active green corridor.
    """
    corridor = emergency_service.cancel_active_corridor(db, payload.corridor_id)
    if not corridor:
        raise HTTPException(status_code=404, detail="Active corridor not found")
    return {"status": "cancelled", "corridor_id": payload.corridor_id}

@router.get("/{corridor_id}")
def get_corridor(corridor_id: str, db: Session = Depends(get_db)):
    """
    Returns detailed information about a specific corridor.
    """
    corridor = db.query(EmergencyCorridorModel).filter(EmergencyCorridorModel.id == corridor_id).first()
    if not corridor:
        raise HTTPException(status_code=404, detail="Corridor not found")
    return corridor

@router.get("/summary/analytics")
def get_analytics(db: Session = Depends(get_db)):
    """
    Returns aggregated stats and raw logs from the corridor_analytics database table.
    """
    records = db.query(CorridorAnalyticsModel).all()
    
    total_corridors = len(records)
    total_time_saved = sum(r.time_saved_seconds for r in records)
    total_distance = sum(r.distance_km for r in records)
    
    avg_time_saved = total_time_saved / total_corridors if total_corridors > 0 else 0
    avg_distance = total_distance / total_corridors if total_corridors > 0 else 0
    
    return {
        "summary": {
            "total_corridors": total_corridors,
            "total_minutes_saved": round(total_time_saved / 60.0, 1),
            "total_distance_km": round(total_distance, 2),
            "average_time_saved_seconds": round(avg_time_saved, 1),
            "average_distance_km": round(avg_distance, 2)
        },
        "records": [
            {
                "id": r.id,
                "corridor_id": r.corridor_id,
                "time_saved_seconds": r.time_saved_seconds,
                "distance_km": r.distance_km,
                "junctions_controlled": r.junctions_controlled,
                "timestamp": r.timestamp
            } for r in records
        ]
    }
