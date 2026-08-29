import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class SensorDevice(Base):
    __tablename__ = "sensor_devices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), unique=True, index=True, nullable=False)
    location = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(32), default="ACTIVE")  # ACTIVE, OFFLINE, MAINTENANCE, ALERT
    device_type = Column(String(64), default="ESP32_ENVIRONMENTAL_NODE")
    battery_level = Column(Float, default=100.0)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    readings = relationship("SensorReading", back_populates="device", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="device")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    device_id = Column(String(64), ForeignKey("sensor_devices.device_id"), index=True, nullable=False)
    temperature = Column(Float, nullable=False)   # in Celsius
    humidity = Column(Float, nullable=False)      # in %
    water_level = Column(Float, nullable=False)   # in cm
    air_quality = Column(Float, nullable=False)   # AQI / PM index
    smoke_level = Column(Float, nullable=False)   # in ppm
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    device = relationship("SensorDevice", back_populates="readings")


class HazardEvent(Base):
    __tablename__ = "hazard_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hazard_type = Column(String(64), nullable=False, index=True)  # FLOOD, FOREST_FIRE, AIR_POLLUTION, HEATWAVE, GAS_LEAK
    risk_level = Column(String(32), nullable=False, index=True)   # LOW, MEDIUM, HIGH, CRITICAL
    location = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=False)
    detected_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    status = Column(String(32), default="ACTIVE", index=True)     # ACTIVE, INVESTIGATING, RESOLVED
    device_id = Column(String(64), nullable=True)
    metrics_snapshot = Column(Text, nullable=True)                 # JSON string with metrics at detection time

    # Relationships
    alerts = relationship("Alert", back_populates="hazard_event", cascade="all, delete-orphan")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    hazard_event_id = Column(Integer, ForeignKey("hazard_events.id"), nullable=True)
    device_id = Column(String(64), ForeignKey("sensor_devices.device_id"), nullable=True)
    alert_message = Column(Text, nullable=False)
    severity = Column(String(32), nullable=False, index=True)     # LOW, MEDIUM, HIGH, CRITICAL
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    status = Column(String(32), default="TRIGGERED", index=True)  # TRIGGERED, ACKNOWLEDGED, RESOLVED

    # Relationships
    hazard_event = relationship("HazardEvent", back_populates="alerts")
    device = relationship("SensorDevice", back_populates="alerts")
