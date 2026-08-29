import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.services.simulator_service import simulator
from app.services.websocket_manager import ws_manager
from app.routes import sensors, hazards, alerts, dashboard, simulator as sim_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.DEBUG else logging.WARNING,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("HazardSystem")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown event lifecycle."""
    logger.info("Initializing Database...")
    try:
        init_db()
    except Exception as e:
        logger.error(f"Database initialization error: {e}")

    # Start background sensor simulator if enabled
    if settings.AUTO_START_SIMULATION:
        logger.info("Starting background IoT Sensor Simulator for Indian Hotspots...")
        await simulator.start(settings.SIMULATION_INTERVAL_SECONDS)

    yield

    logger.info("Shutting down background services...")
    if simulator.is_running:
        await simulator.stop()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Resilient Environmental Hazard Monitoring & Early Warning Platform with ESP32 Integration.",
    lifespan=lifespan
)

# CORS Configuration
origins = settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(sensors.router)
app.include_router(hazards.router)
app.include_router(alerts.router)
app.include_router(dashboard.router)
app.include_router(sim_routes.router)

# Real-time WebSocket Endpoint
@app.websocket("/ws/live")
async def websocket_live_feed(websocket: WebSocket):
    """
    Sub-second live WebSocket telemetry and alert stream for connected dashboard clients.
    """
    await ws_manager.connect(websocket)
    try:
        # Send initial confirmation handshake
        await websocket.send_json({
            "event_type": "CONNECTED",
            "message": "Connected to Resilient Hazard Early Warning Live Feed",
            "server_time": str(logger.handlers)
        })
        while True:
            # Receive client heartbeats or incoming telemetry
            data = await websocket.receive_text()
            # Optionally respond to ping/heartbeat
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client session error: {e}")
        ws_manager.disconnect(websocket)

# Root & Health Endpoints
@app.get("/")
def root_status():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "api_endpoints": {
            "sensor_ingestion": "POST /api/sensor-data",
            "historical_readings": "GET /api/sensor-data",
            "sensor_devices": "GET /api/sensors/devices",
            "dashboard_overview": "GET /api/dashboard/overview",
            "dashboard_map": "GET /api/dashboard/map-data",
            "hazards": "GET /api/hazards",
            "alerts": "GET /api/alerts",
            "simulator_control": "POST /api/simulator/start | stop | trigger-scenario",
            "websocket_feed": "WS /ws/live"
        }
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "simulator_active": simulator.is_running,
        "connected_ws_clients": len(ws_manager.active_connections)
    }
