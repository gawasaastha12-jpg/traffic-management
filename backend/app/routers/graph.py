from fastapi import APIRouter
from app.services.graph_service import graph_service

router = APIRouter(prefix="/api/graph", tags=["Graph"])

@router.get("")
def get_road_network():
    """
    Returns the downloaded and structured GraphML road network nodes and edges.
    """
    return graph_service.get_network_geojson()
