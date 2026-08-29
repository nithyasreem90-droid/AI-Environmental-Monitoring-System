import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.models import HazardEvent
from app.schemas import HazardEventResponse, HazardStatusUpdate

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/hazards", tags=["Hazards"])

@router.get("", response_model=List[HazardEventResponse])
def get_hazards(
    status: Optional[str] = Query(None, description="Filter by status: ACTIVE, INVESTIGATING, RESOLVED"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level: LOW, MEDIUM, HIGH, CRITICAL"),
    hazard_type: Optional[str] = Query(None, description="Filter by hazard type: FLOOD, FOREST_FIRE, AIR_POLLUTION, HEATWAVE"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve environmental hazard events."""
    query = db.query(HazardEvent)
    if status:
        query = query.filter(HazardEvent.status == status.upper())
    if risk_level:
        query = query.filter(HazardEvent.risk_level == risk_level.upper())
    if hazard_type:
        query = query.filter(HazardEvent.hazard_type == hazard_type.upper())

    hazards = query.order_by(desc(HazardEvent.detected_at)).limit(limit).all()
    return hazards


@router.get("/{hazard_id}", response_model=HazardEventResponse)
def get_hazard_by_id(hazard_id: int, db: Session = Depends(get_db)):
    """Retrieve a single hazard event by ID."""
    hazard = db.query(HazardEvent).filter(HazardEvent.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hazard event not found")
    return hazard


@router.patch("/{hazard_id}/status", response_model=HazardEventResponse)
def update_hazard_status(
    hazard_id: int,
    payload: HazardStatusUpdate,
    db: Session = Depends(get_db)
):
    """Update hazard status (e.g. mark as RESOLVED or INVESTIGATING)."""
    hazard = db.query(HazardEvent).filter(HazardEvent.id == hazard_id).first()
    if not hazard:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hazard event not found")

    hazard.status = payload.status.upper()
    db.commit()
    db.refresh(hazard)
    return hazard
