import os
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Resilient Hazard Warning & Environmental Monitoring System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # Database URL
    DATABASE_URL: str = "sqlite:///./hazard_db.db"
    POSTGRES_DATABASE_URL: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/hazard_db"

    # CORS
    CORS_ORIGINS: Union[List[str], str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

    @field_validator("CORS_ORIGINS", mode="before")
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Hazard Risk Thresholds
    WATER_LEVEL_MODERATE_CM: float = 35.0
    WATER_LEVEL_HIGH_CM: float = 50.0
    WATER_LEVEL_CRITICAL_CM: float = 75.0

    FIRE_TEMP_THRESHOLD_C: float = 38.0
    FIRE_HUMIDITY_THRESHOLD_PCT: float = 25.0
    FIRE_SMOKE_THRESHOLD_PPM: float = 45.0

    AQI_MODERATE: float = 100.0
    AQI_UNHEALTHY: float = 200.0
    AQI_HAZARDOUS: float = 300.0

    SMOKE_ELEVATED_PPM: float = 30.0
    SMOKE_CRITICAL_PPM: float = 60.0

    AUTO_START_SIMULATION: bool = True
    SIMULATION_INTERVAL_SECONDS: int = 4

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
