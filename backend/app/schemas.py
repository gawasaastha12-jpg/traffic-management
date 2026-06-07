from pydantic import BaseModel
from typing import Optional, List

class TrafficState(BaseModel):
    junction_id: str
    name: str
    density: int  # Congestion level percentage (0-100)
    rainfall: float  # Live precipitation mm/h
    queue_length: int  # Queue length in meters
    average_wait_time: float  # In seconds
    signal_status: str  # e.g., "RED", "AMBER", "GREEN" or signal mode
    predicted_density: int  # Future predicted load capacity (0-100)

class TrafficIncident(BaseModel):
    id: str
    title: str
    message: str
    latitude: float
    longitude: float
    severity: str
    resolved: bool
    timestamp: str

class DigitalTwinTelemetry(BaseModel):
    timestamp: str
    states: List[TrafficState]
    incidents: List[TrafficIncident]
    weather_rainfall: float
