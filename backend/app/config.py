import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    DATABASE_URL: str = "sqlite:///./data/renew.db"
    
    # API Keys
    TOMTOM_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""
    ORS_API_KEY: str = ""

    
    # SUMO Config
    SUMO_SERVER_IP: str = "127.0.0.1"
    SUMO_SERVER_PORT: int = 8813

    # Load from .env file
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure data directory exists
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(__file__)), "data"), exist_ok=True)
