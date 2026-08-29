import datetime
import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas import ScenarioTriggerRequest, SimulatorToggleRequest, SimulatorStatusResponse
from app.services.simulator_service import simulator, DEFAULT_INDIAN_NODES

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/simulator", tags=["Sensor Simulator"])

@router.post("/start")
async def start_simulator(payload: SimulatorToggleRequest = None):
    """Start automatic background telemetry simulator."""
    interval = payload.interval_seconds if payload else None
    await simulator.start(interval)
    return {
        "status": "started",
        "is_running": simulator.is_running,
        "interval_seconds": simulator.interval_seconds,
        "message": f"Sensor simulation running at {simulator.interval_seconds}s interval."
    }

@router.post("/stop")
async def stop_simulator():
    """Stop automatic background telemetry simulator."""
    await simulator.stop()
    return {
        "status": "stopped",
        "is_running": simulator.is_running,
        "message": "Sensor simulation paused."
    }

@router.post("/trigger-scenario")
def trigger_disaster_scenario(payload: ScenarioTriggerRequest):
    """
    Trigger emergency disaster scenarios for hackathon evaluation:
    - 'CHENNAI_FLOOD': Inundation spike in Chennai
    - 'UTTARAKHAND_FIRE': Thermal and smoke anomaly in Himalayan forest
    - 'DELHI_SMOG': Toxic AQI spike in Delhi NCR
    - 'KERALA_LANDSLIDE_RAIN': High water & humidity in Wayanad
    - 'NORMAL_RESET': Clear all injected hazard conditions
    """
    msg = simulator.trigger_scenario(payload.scenario_type, payload.target_device_id)
    return {
        "status": "scenario_applied",
        "scenario": payload.scenario_type,
        "message": msg
    }

@router.get("/status", response_model=SimulatorStatusResponse)
def get_simulator_status():
    """Get current simulator operating status."""
    return SimulatorStatusResponse(
        is_running=simulator.is_running,
        interval_seconds=simulator.interval_seconds,
        active_nodes_count=len(DEFAULT_INDIAN_NODES),
        last_broadcast=simulator.last_broadcast
    )
