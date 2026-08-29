import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# ----------------- SENSOR SCHEMAS -----------------

class SensorDataCreate(BaseModel):
    device_id: str = Field(..., description="Unique hardware identifier (e.g. ESP32_001)")
    location: str = Field(..., description="Geographical location or zone name")
    latitude: float = Field(..., description="Latitude coordinate")
    longitude: float = Field(..., description="Longitude coordinate")
    temperature: float = Field(..., description="Ambient temperature in °C")
    humidity: float = Field(..., description="Relative humidity in %")
    water_level: float = Field(..., description="Water depth/level in cm")
    air_quality: float = Field(..., description="AQI / PM value")
    smoke_level: float = Field(..., description="Smoke/gas sensor concentration in ppm")
    timestamp: Optional[datetime.datetime] = Field(default_factory=datetime.datetime.utcnow, description="ISO timestamp of reading")

    class Config:
        json_schema_extra = {
            "example": {
                "device_id": "ESP32_001",
                "location": "Chennai",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "temperature": 35.5,
                "humidity": 70,
                "water_level": 45,
                "air_quality": 120,
                "smoke_level": 20,
                "timestamp": "2026-08-29T10:30:00"
            }
        }


class SensorReadingResponse(BaseModel):
    id: int
    device_id: str
    temperature: float
    humidity: float
    water_level: float
    air_quality: float
    smoke_level: float
    timestamp: datetime.datetime
    created_at: datetime.datetime

    class Config:
        from_attributes = True


class SensorDeviceResponse(BaseModel):
    id: int
    device_id: str
    location: str
    latitude: float
    longitude: float
    status: str
    device_type: Optional[str] = None
    battery_level: Optional[float] = 100.0
    last_seen: Optional[datetime.datetime] = None
    latest_reading: Optional[SensorReadingResponse] = None

    class Config:
        from_attributes = True


# ----------------- HAZARD & ALERT SCHEMAS -----------------

class HazardRiskAssessment(BaseModel):
    hazard_type: str
    risk_level: str  # LOW, MEDIUM, HIGH, CRITICAL
    score: float     # 0.0 - 100.0
    is_hazard: bool
    trigger_reasons: List[str]
    recommendation: str


class RiskAnalysisResult(BaseModel):
    device_id: str
    location: str
    overall_risk_level: str
    hazard_detected: bool
    assessments: Dict[str, HazardRiskAssessment]
    generated_alerts: List[str] = []


class HazardEventResponse(BaseModel):
    id: int
    hazard_type: str
    risk_level: str
    location: str
    latitude: float
    longitude: float
    description: str
    detected_at: datetime.datetime
    status: str
    device_id: Optional[str] = None
    metrics_snapshot: Optional[str] = None

    class Config:
        from_attributes = True


class HazardStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: ACTIVE, INVESTIGATING, RESOLVED")


class AlertResponse(BaseModel):
    id: int
    hazard_event_id: Optional[int] = None
    device_id: Optional[str] = None
    alert_message: str
    severity: str
    created_at: datetime.datetime
    status: str
    location: Optional[str] = None

    class Config:
        from_attributes = True


class AlertStatusUpdate(BaseModel):
    status: str = Field(..., description="New status: TRIGGERED, ACKNOWLEDGED, RESOLVED")


# ----------------- DASHBOARD SCHEMAS -----------------

class OverviewStats(BaseModel):
    total_active_sensors: int
    normal_areas: int
    active_hazard_alerts: int
    critical_risk_areas: int


class MapNode(BaseModel):
    device_id: str
    location: str
    latitude: float
    longitude: float
    status: str
    risk_level: str
    highest_hazard_type: Optional[str] = None
    temperature: float
    humidity: float
    water_level: float
    air_quality: float
    smoke_level: float
    last_updated: datetime.datetime


class DashboardOverviewResponse(BaseModel):
    stats: OverviewStats
    active_hazards: List[HazardEventResponse]
    recent_alerts: List[AlertResponse]
    latest_telemetry: List[SensorReadingResponse]
    risk_breakdown: Dict[str, int]
    system_status: str = "OPERATIONAL"


# ----------------- SIMULATION SCHEMAS -----------------

class ScenarioTriggerRequest(BaseModel):
    scenario_type: str = Field(..., description="Options: 'CHENNAI_FLOOD', 'UTTARAKHAND_FIRE', 'DELHI_SMOG', 'KERALA_LANDSLIDE_RAIN', 'NORMAL_RESET'")
    target_device_id: Optional[str] = None

class SimulatorToggleRequest(BaseModel):
    active: bool
    interval_seconds: Optional[int] = 4

class SimulatorStatusResponse(BaseModel):
    is_running: bool
    interval_seconds: int
    active_nodes_count: int
    last_broadcast: Optional[datetime.datetime] = None
