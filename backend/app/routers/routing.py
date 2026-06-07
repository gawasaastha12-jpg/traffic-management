from fastapi import APIRouter, Query
from app.services.routing_service import routing_service

router = APIRouter(prefix="/api/routing", tags=["Routing"])

@router.get("/eta")
def get_routing_eta(
    origin: str = Query(..., description="Source node ID or junction ID"),
    destination: str = Query(..., description="Target node ID or junction ID")
):
    """
    Computes optimal route path coordinates and travel times.
    """
    return routing_service.calculate_eta_and_route(origin, destination)
