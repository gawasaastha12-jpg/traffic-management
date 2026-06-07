import requests
import random
import datetime
from sqlalchemy.orm import Session
from app.config import settings
from app.models import WeatherLogModel

class WeatherService:
    def __init__(self):
        self.api_key = settings.OPENWEATHER_API_KEY
        self.lat = 12.9698
        self.lng = 77.7500

    def fetch_live_weather(self, db: Session):
        """
        Polls OpenWeather API for rain detection and risk factors.
        Saves logs to SQLite database.
        """
        if not self.api_key:
            return self._generate_simulated_weather(db)

        # OpenWeatherMap current weather URL
        url = (
            f"https://api.openweathermap.org/data/2.5/weather"
            f"?lat={self.lat}&lon={self.lng}&appid={self.api_key}&units=metric"
        )

        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                
                # Extract rain volume (if present)
                rain = data.get("rain", {}).get("1h", 0.0)
                visibility = float(data.get("visibility", 10000.0))
                humidity = float(data.get("main", {}).get("humidity", 60.0))
                condition = "Clear"
                
                weather_desc = data.get("weather", [{}])[0].get("main", "Clear")
                condition = weather_desc

                log = WeatherLogModel(
                    rainfall=rain,
                    visibility=visibility,
                    humidity=humidity,
                    condition=condition
                )
                db.add(log)
                db.commit()
                
                return {
                    "rainfall": rain,
                    "visibility": visibility,
                    "humidity": humidity,
                    "condition": condition,
                    "timestamp": log.timestamp
                }
            else:
                print(f"[WeatherService] OpenWeather API failed: {response.status_code}")
                return self._generate_simulated_weather(db)
        except Exception as e:
            print(f"[WeatherService] Exception during OpenWeather poll: {e}")
            return self._generate_simulated_weather(db)

    def _generate_simulated_weather(self, db: Session):
        """
        Simulates local monsoon fluctuations (common in Bengaluru)
        to enable testing rain overlays on the Leaflet frontend map.
        """
        conditions = ["Clear", "Scattered Clouds", "Light Rain", "Heavy Rain", "Thunderstorm"]
        # Bias simulation slightly to rain for testing
        condition = random.choice(conditions)
        
        rain = 0.0
        visibility = 10000.0
        humidity = random.uniform(45.0, 95.0)

        if "Light Rain" in condition:
            rain = random.uniform(0.5, 2.5)
            visibility = random.uniform(5000.0, 8000.0)
            humidity = random.uniform(80.0, 90.0)
        elif "Heavy Rain" in condition:
            rain = random.uniform(3.0, 8.0)
            visibility = random.uniform(2000.0, 4000.0)
            humidity = random.uniform(90.0, 98.0)
        elif "Thunderstorm" in condition:
            rain = random.uniform(10.0, 20.0)
            visibility = random.uniform(800.0, 1500.0)
            humidity = random.uniform(95.0, 100.0)

        log = WeatherLogModel(
            rainfall=round(rain, 2),
            visibility=round(visibility, 1),
            humidity=round(humidity, 1),
            condition=condition
        )
        db.add(log)
        db.commit()

        return {
            "rainfall": log.rainfall,
            "visibility": log.visibility,
            "humidity": log.humidity,
            "condition": log.condition,
            "timestamp": log.timestamp
        }

# Singleton instance
weather_service = WeatherService()
