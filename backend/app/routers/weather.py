from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.services.weather_service import weather_service

router = APIRouter(prefix="/api/weather", tags=["Weather"])

@router.get("")
def get_weather(db: Session = Depends(get_db)):
    """
    Returns live OpenWeatherMap parameters or simulated rainfall levels.
    """
    return weather_service.fetch_live_weather(db)
