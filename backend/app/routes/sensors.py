import datetime
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import SensorDevice, SensorReading
from app.schemas import (
    SensorDataCreate,
    SensorReadingResponse,
    SensorDeviceResponse,
    RiskAnalysisResult
)
from app.services.risk_analysis import risk_engine
from app.services.alert_service import AlertService
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Sensors & Telemetry"])

@router.post("/sensor-data", status_code=status.HTTP_201_CREATED)
async def receive_sensor_data(
    data: SensorDataCreate,
    db: Session = Depends(get_db)
):
    """
    Core Ingestion Endpoint for ESP32 Hardware & IoT Simulators.
    1. Validates incoming payload.
    2. Auto-registers hardware device if newly discovered.
    3. Runs AI / Rule-based Risk Analysis Engine.
    4. Persists telemetry in PostgreSQL / DB.
    5. Dispatches alerts if danger thresholds are crossed.
    6. Broadcasts real-time packet to WebSocket dashboard subscribers.
    """
    try:
        now = data.timestamp or datetime.datetime.utcnow()

        # 1. Upsert Sensor Device
        device = db.query(SensorDevice).filter(SensorDevice.device_id == data.device_id).first()
        if not device:
            device = SensorDevice(
                device_id=data.device_id,
                location=data.location,
                latitude=data.latitude,
                longitude=data.longitude,
                status="ACTIVE",
                device_type="ESP32_IOT_NODE",
                last_seen=now
            )
            db.add(device)
            db.commit()
            db.refresh(device)
        else:
            device.last_seen = now
            device.location = data.location
            device.latitude = data.latitude
            device.longitude = data.longitude
            db.commit()

        # 2. Run Modular Risk Analysis Engine
        analysis: RiskAnalysisResult = risk_engine.analyze(data)

        # 3. Store Sensor Reading
        reading = SensorReading(
            device_id=data.device_id,
            temperature=data.temperature,
            humidity=data.humidity,
            water_level=data.water_level,
            air_quality=data.air_quality,
            smoke_level=data.smoke_level,
            timestamp=now
        )
        db.add(reading)
        db.commit()
        db.refresh(reading)

        # 4. Trigger Alerts & Hazard Records if applicable
        generated_alerts = await AlertService.process_risk_analysis(db, data, analysis)

        # 5. Broadcast live telemetry to dashboard clients
        await ws_manager.broadcast({
            "event_type": "TELEMETRY_UPDATE",
            "reading": {
                "id": reading.id,
                "device_id": data.device_id,
                "location": data.location,
                "latitude": data.latitude,
                "longitude": data.longitude,
                "temperature": data.temperature,
                "humidity": data.humidity,
                "water_level": data.water_level,
                "air_quality": data.air_quality,
                "smoke_level": data.smoke_level,
                "timestamp": now.isoformat(),
                "risk_level": analysis.overall_risk_level,
                "hazard_detected": analysis.hazard_detected
            }
        })

        return {
            "status": "success",
            "message": "Sensor data received, analyzed, and persisted successfully.",
            "reading_id": reading.id,
            "device_id": data.device_id,
            "risk_analysis": analysis,
            "alerts_created": len(generated_alerts)
        }

    except Exception as e:
        logger.error(f"Error processing sensor data from {data.device_id}: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process sensor telemetry: {str(e)}"
        )


@router.get("/sensor-data", response_model=List[SensorReadingResponse])
def get_sensor_readings(
    device_id: Optional[str] = Query(None, description="Filter by device ID"),
    limit: int = Query(50, ge=1, le=500, description="Max records to return"),
    db: Session = Depends(get_db)
):
    """Retrieve historical sensor readings."""
    query = db.query(SensorReading)
    if device_id:
        query = query.filter(SensorReading.device_id == device_id)
    readings = query.order_by(desc(SensorReading.timestamp)).limit(limit).all()
    return readings


@router.get("/sensors/devices", response_model=List[SensorDeviceResponse])
def get_sensor_devices(db: Session = Depends(get_db)):
    """Retrieve all registered sensor devices with their latest telemetry reading."""
    devices = db.query(SensorDevice).all()
    results = []
    for dev in devices:
        latest = (
            db.query(SensorReading)
            .filter(SensorReading.device_id == dev.device_id)
            .order_by(desc(SensorReading.timestamp))
            .first()
        )
        dev_dict = {
            "id": dev.id,
            "device_id": dev.device_id,
            "location": dev.location,
            "latitude": dev.latitude,
            "longitude": dev.longitude,
            "status": dev.status,
            "device_type": dev.device_type,
            "battery_level": dev.battery_level,
            "last_seen": dev.last_seen,
            "latest_reading": latest
        }
        results.append(dev_dict)
    return results
