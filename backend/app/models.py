from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime
from app.db import Base
import datetime

class JunctionModel(Base):
    __tablename__ = "junctions"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    congestion_level = Column(Integer, default=0)
    signal_mode = Column(String, default="Adaptive AI")
    green_corridor_active = Column(Boolean, default=False)
    average_wait_time = Column(Float, default=0.0)
    data_source = Column(String, default="simulated")

class IncidentModel(Base):
    __tablename__ = "incidents"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String, default="info") # info, warning, critical
    resolved = Column(Boolean, default=False)
    timestamp = Column(String, default=lambda: datetime.datetime.now().isoformat())

class WeatherLogModel(Base):
    __tablename__ = "weather_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    rainfall = Column(Float, default=0.0)
    visibility = Column(Float, default=10000.0) # in meters
    humidity = Column(Float, default=50.0)
    condition = Column(String, default="Clear")
    timestamp = Column(String, default=lambda: datetime.datetime.now().isoformat())

class EmergencyCorridorModel(Base):
    __tablename__ = "emergency_corridors"

    id = Column(String, primary_key=True, index=True)
    vehicle_type = Column(String, nullable=False) # ambulance, fire, police
    vehicle_no = Column(String, nullable=True)
    origin_name = Column(String, nullable=True)
    destination_name = Column(String, nullable=True)
    priority_level = Column(Integer, default=1) # 1, 2, 3
    origin_lat = Column(Float, nullable=False)
    origin_lon = Column(Float, nullable=False)
    destination_lat = Column(Float, nullable=False)
    destination_lon = Column(Float, nullable=False)
    eta_before = Column(Integer, nullable=False)
    eta_after = Column(Integer, nullable=False)
    time_saved_seconds = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    junction_count = Column(Integer, nullable=False)
    congestion_score = Column(Integer, nullable=False)
    route_nodes = Column(String, nullable=False) # Serialized JSON array of WF_J_XXX nodes
    status = Column(String, default="ACTIVE") # ACTIVE, COMPLETED, CANCELLED
    vehicle_progress_percentage = Column(Integer, default=0) # 0, 25, 50, 75, 100
    created_at = Column(String, default=lambda: datetime.datetime.now().isoformat())

class CorridorAnalyticsModel(Base):
    __tablename__ = "corridor_analytics"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    corridor_id = Column(String, nullable=False)
    time_saved_seconds = Column(Integer, nullable=False)
    distance_km = Column(Float, nullable=False)
    junctions_controlled = Column(Integer, nullable=False)
    timestamp = Column(String, default=lambda: datetime.datetime.now().isoformat())

