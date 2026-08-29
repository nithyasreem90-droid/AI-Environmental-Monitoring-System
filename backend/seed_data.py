"""
Database Seeding Script for Environmental Hazard Monitoring & Early Warning System.
Populates initial sensors, baseline telemetry readings, and sample hazard alerts.
"""
import datetime
import random
from app.database import SessionLocal, init_db
from app.models import SensorDevice, SensorReading, HazardEvent, Alert
from app.services.simulator_service import DEFAULT_INDIAN_NODES
from app.services.risk_analysis import risk_engine
from app.schemas import SensorDataCreate

def seed_database():
    print("[*] Initializing Database Schema...")
    init_db()
    db = SessionLocal()

    try:
        print("[+] Seeding Sensor Devices & Historical Readings...")
        now = datetime.datetime.utcnow()

        for node in DEFAULT_INDIAN_NODES:
            dev = db.query(SensorDevice).filter(SensorDevice.device_id == node["device_id"]).first()
            if not dev:
                dev = SensorDevice(
                    device_id=node["device_id"],
                    location=node["location"],
                    latitude=node["latitude"],
                    longitude=node["longitude"],
                    status="ACTIVE",
                    device_type=node["device_type"],
                    battery_level=round(random.uniform(88.0, 99.0), 1),
                    last_seen=now
                )
                db.add(dev)
                db.commit()

            # Seed 20 historical readings across the last 2 hours
            for i in range(20, 0, -1):
                read_time = now - datetime.timedelta(minutes=i * 5)
                temp = node["base_temp"] + random.uniform(-1.0, 1.0)
                hum = node["base_hum"] + random.uniform(-2.0, 2.0)
                water = node["base_water"] + random.uniform(-1.0, 1.0)
                aqi = node["base_aqi"] + random.uniform(-4.0, 4.0)
                smoke = node["base_smoke"] + random.uniform(-1.0, 1.0)

                reading = SensorReading(
                    device_id=node["device_id"],
                    temperature=round(temp, 1),
                    humidity=round(hum, 1),
                    water_level=round(water, 1),
                    air_quality=round(aqi, 1),
                    smoke_level=round(smoke, 1),
                    timestamp=read_time,
                    created_at=read_time
                )
                db.add(reading)
        db.commit()

        # Seed a sample historical alert for demo
        sample_hazard = HazardEvent(
            hazard_type="AIR_POLLUTION",
            risk_level="HIGH",
            location="Anand Vihar AQI Zone, Delhi NCR",
            latitude=28.6469,
            longitude=77.3160,
            description="HIGH Air Pollution threat in Anand Vihar AQI Zone. Air quality index breached 220 AQI.",
            detected_at=now - datetime.timedelta(minutes=15),
            status="ACTIVE",
            device_id="ESP32_DEL_04",
            metrics_snapshot='{"temperature": 32.0, "humidity": 48.0, "water_level": 10.0, "air_quality": 224.0, "smoke_level": 34.0}'
        )
        db.add(sample_hazard)
        db.commit()
        db.refresh(sample_hazard)

        sample_alert = Alert(
            hazard_event_id=sample_hazard.id,
            device_id="ESP32_DEL_04",
            alert_message="[HIGH] Air Pollution detected at Anand Vihar AQI Zone, Delhi NCR: Deploy anti-smog water cannons and advise masks.",
            severity="HIGH",
            created_at=now - datetime.timedelta(minutes=15),
            status="TRIGGERED"
        )
        db.add(sample_alert)
        db.commit()

        print("[OK] Database seeding completed successfully!")

    except Exception as e:
        print(f"[ERR] Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
