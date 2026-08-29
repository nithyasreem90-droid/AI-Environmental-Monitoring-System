import json
import datetime
import logging
from typing import List, Optional
from sqlalchemy.orm import Session
from app.models import HazardEvent, Alert, SensorDevice
from app.schemas import RiskAnalysisResult, SensorDataCreate
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

class AlertService:
    @staticmethod
    async def process_risk_analysis(
        db: Session,
        sensor_data: SensorDataCreate,
        analysis: RiskAnalysisResult
    ) -> List[Alert]:
        """
        Takes risk analysis results, registers HazardEvents and Alerts in DB,
        and broadcasts real-time notifications via WebSockets.
        """
        created_alerts: List[Alert] = []

        # Update device status and last_seen
        device = db.query(SensorDevice).filter(SensorDevice.device_id == sensor_data.device_id).first()
        if device:
            device.last_seen = datetime.datetime.utcnow()
            device.status = "ALERT" if analysis.overall_risk_level in ["HIGH", "CRITICAL"] else "ACTIVE"
            db.commit()

        metrics_json = json.dumps({
            "temperature": sensor_data.temperature,
            "humidity": sensor_data.humidity,
            "water_level": sensor_data.water_level,
            "air_quality": sensor_data.air_quality,
            "smoke_level": sensor_data.smoke_level,
            "timestamp": sensor_data.timestamp.isoformat() if sensor_data.timestamp else datetime.datetime.utcnow().isoformat()
        })

        for hazard_type, assessment in analysis.assessments.items():
            if assessment.is_hazard and assessment.risk_level in ["MEDIUM", "HIGH", "CRITICAL"]:
                # Check for recent active hazard event to prevent duplicate spam within a 5-minute window
                five_mins_ago = datetime.datetime.utcnow() - datetime.timedelta(minutes=5)
                existing_hazard = (
                    db.query(HazardEvent)
                    .filter(
                        HazardEvent.device_id == sensor_data.device_id,
                        HazardEvent.hazard_type == hazard_type,
                        HazardEvent.status == "ACTIVE",
                        HazardEvent.detected_at >= five_mins_ago
                    )
                    .first()
                )

                if existing_hazard:
                    # Update existing active hazard metrics
                    existing_hazard.risk_level = assessment.risk_level
                    existing_hazard.metrics_snapshot = metrics_json
                    existing_hazard.detected_at = datetime.datetime.utcnow()
                    db.commit()
                    hazard_id = existing_hazard.id
                else:
                    # Create new Hazard Event
                    desc = f"{assessment.risk_level} {hazard_type.replace('_', ' ').title()} threat in {sensor_data.location}. " + " ".join(assessment.trigger_reasons)
                    new_hazard = HazardEvent(
                        hazard_type=hazard_type,
                        risk_level=assessment.risk_level,
                        location=sensor_data.location,
                        latitude=sensor_data.latitude,
                        longitude=sensor_data.longitude,
                        description=desc,
                        detected_at=datetime.datetime.utcnow(),
                        status="ACTIVE",
                        device_id=sensor_data.device_id,
                        metrics_snapshot=metrics_json
                    )
                    db.add(new_hazard)
                    db.commit()
                    db.refresh(new_hazard)
                    hazard_id = new_hazard.id

                # Create Alert Record
                alert_msg = f"[{assessment.risk_level}] {hazard_type.replace('_', ' ')} detected at {sensor_data.location}: {assessment.recommendation}"
                new_alert = Alert(
                    hazard_event_id=hazard_id,
                    device_id=sensor_data.device_id,
                    alert_message=alert_msg,
                    severity=assessment.risk_level,
                    created_at=datetime.datetime.utcnow(),
                    status="TRIGGERED"
                )
                db.add(new_alert)
                db.commit()
                db.refresh(new_alert)
                created_alerts.append(new_alert)

                # Broadcast live alert via WebSocket
                try:
                    await ws_manager.broadcast({
                        "event_type": "HAZARD_ALERT",
                        "alert": {
                            "id": new_alert.id,
                            "hazard_event_id": hazard_id,
                            "device_id": sensor_data.device_id,
                            "location": sensor_data.location,
                            "alert_message": alert_msg,
                            "severity": assessment.risk_level,
                            "created_at": new_alert.created_at.isoformat(),
                            "status": "TRIGGERED",
                            "recommendation": assessment.recommendation
                        }
                    })
                except Exception as ws_err:
                    logger.warning(f"WebSocket broadcast error: {ws_err}")

        return created_alerts
