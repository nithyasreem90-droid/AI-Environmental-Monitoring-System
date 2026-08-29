import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import Alert, HazardEvent
from app.schemas import AlertResponse, AlertStatusUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertResponse])
def get_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    status: Optional[str] = Query(None, description="Filter by status: TRIGGERED, ACKNOWLEDGED, RESOLVED"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve disaster early warning alerts."""
    query = db.query(Alert)
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if status:
        query = query.filter(Alert.status == status.upper())

    alerts = query.order_by(desc(Alert.created_at)).limit(limit).all()

    results = []
    for a in alerts:
        loc = None
        if a.hazard_event:
            loc = a.hazard_event.location
        elif a.device:
            loc = a.device.location
        results.append({
            "id": a.id,
            "hazard_event_id": a.hazard_event_id,
            "device_id": a.device_id,
            "alert_message": a.alert_message,
            "severity": a.severity,
            "created_at": a.created_at,
            "status": a.status,
            "location": loc
        })
    return results


@router.patch("/{alert_id}/ack", response_model=AlertResponse)
def acknowledge_alert(alert_id: int, db: Session = Depends(get_db)):
    """Acknowledge an emergency alert by civil defense / operator."""
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.status = "ACKNOWLEDGED"
    db.commit()
    db.refresh(alert)

    loc = alert.hazard_event.location if alert.hazard_event else (alert.device.location if alert.device else None)
    return {
        "id": alert.id,
        "hazard_event_id": alert.hazard_event_id,
        "device_id": alert.device_id,
        "alert_message": alert.alert_message,
        "severity": alert.severity,
        "created_at": alert.created_at,
        "status": alert.status,
        "location": loc
    }
