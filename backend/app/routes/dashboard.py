import datetime
import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.database import get_db
from app.models import SensorDevice, SensorReading, HazardEvent, Alert
from app.schemas import (
    DashboardOverviewResponse,
    OverviewStats,
    MapNode,
    HazardEventResponse,
    AlertResponse,
    SensorReadingResponse
)
from app.services.risk_analysis import risk_engine
from app.schemas import SensorDataCreate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/overview", response_model=DashboardOverviewResponse)
def get_dashboard_overview(db: Session = Depends(get_db)):
    """Aggregated Disaster Management Command Center Statistics."""
    # 1. Devices & Latest Telemetry
    devices = db.query(SensorDevice).all()
    total_sensors = len(devices)

    latest_readings: List[SensorReading] = []
    device_risks: Dict[str, str] = {}
    risk_counts = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}

    for dev in devices:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.device_id == dev.device_id)
            .order_by(desc(SensorReading.timestamp))
            .first()
        )
        if latest:
            latest_readings.append(latest)
            # Evaluate current risk for device
            s_in = SensorDataCreate(
                device_id=dev.device_id,
                location=dev.location,
                latitude=dev.latitude,
                longitude=dev.longitude,
                temperature=latest.temperature,
                humidity=latest.humidity,
                water_level=latest.water_level,
                air_quality=latest.air_quality,
                smoke_level=latest.smoke_level,
                timestamp=latest.timestamp
            )
            eval_res = risk_engine.analyze(s_in)
            r_level = eval_res.overall_risk_level
            device_risks[dev.device_id] = r_level
            risk_counts[r_level] = risk_counts.get(r_level, 0) + 1
        else:
            risk_counts["LOW"] += 1

    # 2. Active Hazards & Alerts
    active_hazards = (
        db.query(HazardEvent)
        .filter(HazardEvent.status == "ACTIVE")
        .order_by(desc(HazardEvent.detected_at))
        .all()
    )

    recent_alerts_query = (
        db.query(Alert)
        .order_by(desc(Alert.created_at))
        .limit(10)
        .all()
    )
    recent_alerts = []
    for a in recent_alerts_query:
        loc = a.hazard_event.location if a.hazard_event else (a.device.location if a.device else None)
        recent_alerts.append(AlertResponse(
            id=a.id,
            hazard_event_id=a.hazard_event_id,
            device_id=a.device_id,
            alert_message=a.alert_message,
            severity=a.severity,
            created_at=a.created_at,
            status=a.status,
            location=loc
        ))

    active_alert_count = db.query(Alert).filter(Alert.status == "TRIGGERED").count()
    critical_areas_count = risk_counts.get("CRITICAL", 0)
    normal_areas_count = risk_counts.get("LOW", 0)

    stats = OverviewStats(
        total_active_sensors=total_sensors,
        normal_areas=normal_areas_count,
        active_hazard_alerts=active_alert_count,
        critical_risk_areas=critical_areas_count
    )

    return DashboardOverviewResponse(
        stats=stats,
        active_hazards=active_hazards,
        recent_alerts=recent_alerts,
        latest_telemetry=[SensorReadingResponse.model_validate(r) for r in latest_readings],
        risk_breakdown=risk_counts,
        system_status="OPERATIONAL"
    )


@router.get("/map-data", response_model=List[MapNode])
def get_map_data(db: Session = Depends(get_db)):
    """Geo-tagged sensor and hazard nodes for interactive Leaflet Map."""
    devices = db.query(SensorDevice).all()
    map_nodes = []

    for dev in devices:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.device_id == dev.device_id)
            .order_by(desc(SensorReading.timestamp))
            .first()
        )

        if latest:
            temp = latest.temperature
            hum = latest.humidity
            water = latest.water_level
            aqi = latest.air_quality
            smoke = latest.smoke_level
            last_up = latest.timestamp
        else:
            temp, hum, water, aqi, smoke = 28.0, 60.0, 15.0, 60.0, 10.0
            last_up = datetime.datetime.utcnow()

        s_in = SensorDataCreate(
            device_id=dev.device_id,
            location=dev.location,
            latitude=dev.latitude,
            longitude=dev.longitude,
            temperature=temp,
            humidity=hum,
            water_level=water,
            air_quality=aqi,
            smoke_level=smoke,
            timestamp=last_up
        )
        res = risk_engine.analyze(s_in)

        highest_hazard = None
        for h_type, assess in res.assessments.items():
            if assess.is_hazard and assess.risk_level in ["HIGH", "CRITICAL"]:
                highest_hazard = h_type
                break

        map_nodes.append(MapNode(
            device_id=dev.device_id,
            location=dev.location,
            latitude=dev.latitude,
            longitude=dev.longitude,
            status=dev.status,
            risk_level=res.overall_risk_level,
            highest_hazard_type=highest_hazard,
            temperature=temp,
            humidity=hum,
            water_level=water,
            air_quality=aqi,
            smoke_level=smoke,
            last_updated=last_up
        ))

    return map_nodes


@router.get("/trends")
def get_trends(
    device_id: str = "ESP32_CHN_01",
    limit: int = 30,
    db: Session = Depends(get_db)
):
    """Retrieve historical time series for analytics charts."""
    readings = (
        db.query(SensorReading)
        .filter(SensorReading.device_id == device_id)
        .order_by(desc(SensorReading.timestamp))
        .limit(limit)
        .all()
    )
    # Reverse to chronological order for charts
    readings.reverse()

    data = []
    for r in readings:
        data.append({
            "timestamp": r.timestamp.strftime("%H:%M:%S"),
            "temperature": r.temperature,
            "humidity": r.humidity,
            "water_level": r.water_level,
            "air_quality": r.air_quality,
            "smoke_level": r.smoke_level
        })

    # Also calculate hazard counts by type for distribution pie/bar
    hazard_counts = (
        db.query(HazardEvent.hazard_type, func.count(HazardEvent.id))
        .group_by(HazardEvent.hazard_type)
        .all()
    )
    hazard_distribution = {h_type: count for h_type, count in hazard_counts}

    return {
        "device_id": device_id,
        "time_series": data,
        "hazard_distribution": hazard_distribution
    }
