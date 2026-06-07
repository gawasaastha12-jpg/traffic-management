from fastapi import APIRouter, Body
from app.services.simulation_service import simulation_service

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.post("/start")
def start_traffic_simulation(
    vehicles_count: int = Body(50, embed=True),
    simulation_speed: float = Body(1.0, embed=True)
):
    """
    Triggers or resets the micro-simulation (SUMO adapter or local NetworkX simulator)
    to calculate real-time queue lengths and junction delays.
    """
    return simulation_service.start_simulation(vehicles_count, simulation_speed)
