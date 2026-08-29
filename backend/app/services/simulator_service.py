import asyncio
import datetime
import logging
import random
from typing import Dict, Any, List
from app.config import settings
from app.database import SessionLocal
from app.models import SensorDevice, SensorReading
from app.schemas import SensorDataCreate
from app.services.risk_analysis import risk_engine
from app.services.alert_service import AlertService
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

# Predefined Indian Hotspot Sensor Nodes
DEFAULT_INDIAN_NODES = [
    {
        "device_id": "ESP32_CHN_01",
        "location": "Chennai Adyar Basin, Tamil Nadu",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "base_temp": 32.0,
        "base_hum": 75.0,
        "base_water": 22.0,
        "base_aqi": 75.0,
        "base_smoke": 12.0,
        "device_type": "ESP32_HYDRO_STATION"
    },
    {
        "device_id": "ESP32_KER_02",
        "location": "Wayanad Highland Flood Zone, Kerala",
        "latitude": 11.6854,
        "longitude": 76.1320,
        "base_temp": 24.5,
        "base_hum": 88.0,
        "base_water": 28.0,
        "base_aqi": 42.0,
        "base_smoke": 8.0,
        "device_type": "ESP32_HYDRO_LANDSLIDE_NODE"
    },
    {
        "device_id": "ESP32_UTK_03",
        "location": "Chamoli Forest Range, Uttarakhand",
        "latitude": 30.4258,
        "longitude": 79.3300,
        "base_temp": 28.0,
        "base_hum": 35.0,
        "base_water": 12.0,
        "base_aqi": 38.0,
        "base_smoke": 10.0,
        "device_type": "ESP32_WILDFIRE_WATCH_NODE"
    },
    {
        "device_id": "ESP32_DEL_04",
        "location": "Anand Vihar AQI Zone, Delhi NCR",
        "latitude": 28.6469,
        "longitude": 77.3160,
        "base_temp": 31.0,
        "base_hum": 50.0,
        "base_water": 10.0,
        "base_aqi": 185.0,
        "base_smoke": 28.0,
        "device_type": "ESP32_AIR_SMOG_MONITOR"
    },
    {
        "device_id": "ESP32_MUM_05",
        "location": "Mithi River Catchment, Mumbai",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "base_temp": 30.5,
        "base_hum": 80.0,
        "base_water": 25.0,
        "base_aqi": 95.0,
        "base_smoke": 14.0,
        "device_type": "ESP32_HYDRO_STATION"
    },
    {
        "device_id": "ESP32_BLR_06",
        "location": "Electronic City Baseline, Bengaluru",
        "latitude": 12.8452,
        "longitude": 77.6602,
        "base_temp": 26.0,
        "base_hum": 60.0,
        "base_water": 8.0,
        "base_aqi": 55.0,
        "base_smoke": 11.0,
        "device_type": "ESP32_WEATHER_NODE"
    }
]

class SensorSimulatorService:
    def __init__(self):
        self.is_running = False
        self.interval_seconds = settings.SIMULATION_INTERVAL_SECONDS
        self._task: asyncio.Task = None
        self.last_broadcast: datetime.datetime = None
        # State modifiers for active injected scenarios
        self.active_overrides: Dict[str, Dict[str, float]] = {}

    def ensure_devices_registered(self):
        """Ensure default simulator devices exist in DB."""
        db = SessionLocal()
        try:
            for node in DEFAULT_INDIAN_NODES:
                existing = db.query(SensorDevice).filter(SensorDevice.device_id == node["device_id"]).first()
                if not existing:
                    new_dev = SensorDevice(
                        device_id=node["device_id"],
                        location=node["location"],
                        latitude=node["latitude"],
                        longitude=node["longitude"],
                        status="ACTIVE",
                        device_type=node["device_type"],
                        battery_level=random.uniform(85.0, 99.0),
                        last_seen=datetime.datetime.utcnow()
                    )
                    db.add(new_dev)
            db.commit()
        except Exception as e:
            logger.error(f"Error ensuring sensor devices in DB: {e}")
            db.rollback()
        finally:
            db.close()

    async def start(self, interval_seconds: int = None):
        if interval_seconds:
            self.interval_seconds = interval_seconds
        if self.is_running:
            return
        self.ensure_devices_registered()
        self.is_running = True
        self._task = asyncio.create_task(self._simulation_loop())
        logger.info(f"Sensor Simulator started with interval {self.interval_seconds}s")

    async def stop(self):
        self.is_running = False
        if self._task:
            self._task.cancel()
            self._task = None
        logger.info("Sensor Simulator stopped.")

    def trigger_scenario(self, scenario_type: str, target_device_id: str = None) -> str:
        """Inject realistic hazard anomalies for live hackathon demonstration."""
        if scenario_type == "CHENNAI_FLOOD":
            dev_id = target_device_id or "ESP32_CHN_01"
            self.active_overrides[dev_id] = {
                "water_level": 84.5,
                "humidity": 96.0,
                "temperature": 27.2
            }
            return f"Injected CRITICAL Flash Flood scenario at {dev_id} (Water: 84.5 cm)"

        elif scenario_type == "UTTARAKHAND_FIRE":
            dev_id = target_device_id or "ESP32_UTK_03"
            self.active_overrides[dev_id] = {
                "temperature": 42.8,
                "humidity": 14.0,
                "smoke_level": 88.0
            }
            return f"Injected CRITICAL Wildfire scenario at {dev_id} (Temp: 42.8°C, Humidity: 14%, Smoke: 88 ppm)"

        elif scenario_type == "DELHI_SMOG":
            dev_id = target_device_id or "ESP32_DEL_04"
            self.active_overrides[dev_id] = {
                "air_quality": 385.0,
                "smoke_level": 52.0,
                "humidity": 78.0
            }
            return f"Injected HAZARDOUS Air Quality crisis at {dev_id} (AQI: 385, Smoke: 52 ppm)"

        elif scenario_type == "KERALA_LANDSLIDE_RAIN":
            dev_id = target_device_id or "ESP32_KER_02"
            self.active_overrides[dev_id] = {
                "water_level": 62.0,
                "humidity": 98.0,
                "temperature": 22.0
            }
            return f"Injected HIGH Flood/Landslide Inundation at {dev_id} (Water: 62 cm)"

        elif scenario_type == "NORMAL_RESET":
            self.active_overrides.clear()
            return "Reset all sensor nodes to standard baseline telemetry."

        return f"Unknown scenario: {scenario_type}"

    async def _simulation_loop(self):
        while self.is_running:
            try:
                await self._generate_and_process_tick()
                self.last_broadcast = datetime.datetime.utcnow()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Simulator loop error: {e}", exc_info=True)
            await asyncio.sleep(self.interval_seconds)

    async def _generate_and_process_tick(self):
        db = SessionLocal()
        try:
            for node in DEFAULT_INDIAN_NODES:
                dev_id = node["device_id"]
                overrides = self.active_overrides.get(dev_id, {})

                # Stochastic natural variations around baseline or active override
                temp = overrides.get("temperature", node["base_temp"] + random.uniform(-0.8, 0.8))
                hum = overrides.get("humidity", node["base_hum"] + random.uniform(-1.5, 1.5))
                water = overrides.get("water_level", node["base_water"] + random.uniform(-0.6, 0.6))
                aqi = overrides.get("air_quality", node["base_aqi"] + random.uniform(-3.0, 3.0))
                smoke = overrides.get("smoke_level", node["base_smoke"] + random.uniform(-1.0, 1.0))

                # Bounds clamping
                temp = max(5.0, min(55.0, round(temp, 1)))
                hum = max(5.0, min(100.0, round(hum, 1)))
                water = max(0.0, min(120.0, round(water, 1)))
                aqi = max(10.0, min(500.0, round(aqi, 1)))
                smoke = max(1.0, min(200.0, round(smoke, 1)))

                now = datetime.datetime.utcnow()
                sensor_input = SensorDataCreate(
                    device_id=dev_id,
                    location=node["location"],
                    latitude=node["latitude"],
                    longitude=node["longitude"],
                    temperature=temp,
                    humidity=hum,
                    water_level=water,
                    air_quality=aqi,
                    smoke_level=smoke,
                    timestamp=now
                )

                # 1. Run Risk Analysis Engine
                analysis_result = risk_engine.analyze(sensor_input)

                # 2. Store Reading in DB
                reading = SensorReading(
                    device_id=dev_id,
                    temperature=temp,
                    humidity=hum,
                    water_level=water,
                    air_quality=aqi,
                    smoke_level=smoke,
                    timestamp=now
                )
                db.add(reading)
                db.commit()
                db.refresh(reading)

                # 3. Process Alerts & Hazards
                await AlertService.process_risk_analysis(db, sensor_input, analysis_result)

                # 4. Broadcast live telemetry reading to WebSockets
                try:
                    await ws_manager.broadcast({
                        "event_type": "TELEMETRY_UPDATE",
                        "reading": {
                            "id": reading.id,
                            "device_id": dev_id,
                            "location": node["location"],
                            "latitude": node["latitude"],
                            "longitude": node["longitude"],
                            "temperature": temp,
                            "humidity": hum,
                            "water_level": water,
                            "air_quality": aqi,
                            "smoke_level": smoke,
                            "timestamp": now.isoformat(),
                            "risk_level": analysis_result.overall_risk_level,
                            "hazard_detected": analysis_result.hazard_detected
                        }
                    })
                except Exception as ws_err:
                    pass

        finally:
            db.close()

simulator = SensorSimulatorService()
