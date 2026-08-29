# 🛡️ AegisIndia: AI-Powered Environmental Hazard Monitoring & Early Warning System

An enterprise-grade, hackathon-ready Environmental Hazard Monitoring and Disaster Early Warning Platform built for Indian geographical vulnerabilities. 

AegisIndia ingests real-time environmental telemetry from **ESP32 IoT hardware nodes** and simulated regional sensor arrays, evaluates multi-criteria hazard risks (Urban Floods, Forest Fires, Severe Smog/AQI, Heatwaves), persists all telemetry and incidents in a PostgreSQL/SQLite database, and broadcasts sub-second emergency alerts and geospatial visualizations to a modern disaster response dashboard.

---

## 🌟 Key Highlights & Features

- **Multi-Hazard Risk Engine**: Modular evaluation matrix covering:
  - 🌊 **Urban & Riparian Flood**: Water depth tracking, channel overflow thresholds, rate-of-rise alerts.
  - 🔥 **Forest Fire & Wildfire**: Multi-sensor fusion combining high ambient thermal anomaly, dry humidity (<25%), and combustion smoke plumes.
  - 🌫️ **Air Quality (AQI) & Smog**: National AQI categorization, toxic particulate gas detection, and GRAP emergency triggers.
  - ☀️ **Extreme Heatwave**: High thermal stress warnings.
- **Physical ESP32 IoT Node Ready**: Ready-to-flash Arduino C++ firmware (`esp32_firmware_sample.ino`) with pinout schematics for DHT22, HC-SR04, MQ-135, and MQ-2 sensors.
- **Live WebSocket Streaming**: Sub-second telemetry broadcast and instant audio/visual critical alert propagation.
- **Geospatial Early Warning Radar**: Interactive Leaflet map with animated radar pulse rings, danger radii, and popup diagnostics for Indian regional nodes (Chennai, Wayanad, Chamoli, Delhi NCR, Mumbai, Bengaluru).
- **1-Click Hackathon Scenario Injector**: Trigger simulated flash floods, wildfires, and smog spikes on-demand for live demonstrations.
- **Resilient Dual Database Support**: Out-of-the-box PostgreSQL support with automatic SQLite fallback for zero-friction evaluation.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────┐
                                  │   Physical ESP32 Nodes    │
                                  │   & Background Simulator  │
                                  └─────────────┬─────────────┘
                                                │ HTTP POST /api/sensor-data
                                                ▼
                                  ┌───────────────────────────┐
                                  │      FastAPI Backend      │
                                  │   (app/routes/sensors.py) │
                                  └─────────────┬─────────────┘
                                                │
                 ┌──────────────────────────────┼──────────────────────────────┐
                 │                              │                              │
                 ▼                              ▼                              ▼
  ┌─────────────────────────────┐┌─────────────────────────────┐┌─────────────────────────────┐
  │     PostgreSQL Database     ││     Risk Analysis Engine    ││   WebSocket Event Hub       │
  │  (Sensors, Hazards, Alerts) ││ (Flood, Wildfire, AQI, Heat)││   (/ws/live Broadcast)      │
  └─────────────────────────────┘└──────────────┬──────────────┘└──────────────┬──────────────┘
                                                │                              │
                                                │ New Hazards / Alerts         │ Real-Time Stream
                                                ▼                              ▼
                                  ┌───────────────────────────────────────────────────────────┐
                                  │               React + Vite + Tailwind Dashboard           │
                                  │    • Overview KPI Cards       • Geospatial Radar Map      │
                                  │    • Hazard Risk Matrix       • Real-Time Telemetry Grid  │
                                  │    • Emergency Alerts Stream  • Temporal Trend Analytics  │
                                  └───────────────────────────────────────────────────────────┘
```

---

## 📂 Project Directory Structure

```
hackathon/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                  # FastAPI application entrypoint with CORS, WS & lifespan
│   │   ├── config.py                # Environment configuration & hazard thresholds
│   │   ├── database.py              # SQLAlchemy engine, session maker & resilient fallback
│   │   ├── models.py                # SensorDevices, SensorReadings, HazardEvents, Alerts
│   │   ├── schemas.py               # Pydantic v2 validation & response models
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── sensors.py           # POST /api/sensor-data, GET /api/sensor-data
│   │   │   ├── hazards.py           # GET /api/hazards, PATCH /api/hazards/{id}/status
│   │   │   ├── alerts.py            # GET /api/alerts, PATCH /api/alerts/{id}/ack
│   │   │   ├── dashboard.py         # GET /api/dashboard/overview, GET /api/dashboard/map-data
│   │   │   └── simulator.py         # POST /api/simulator/start, stop, trigger-scenario
│   │   └── services/
│   │       ├── __init__.py
│   │       ├── risk_analysis.py     # Modular multi-criteria Risk Engine (Flood, Fire, AQI, Heat)
│   │       ├── alert_service.py     # Alert creation, deduplication & broadcast
│   │       ├── websocket_manager.py # Live WebSocket connection hub
│   │       └── simulator_service.py # Realistic Indian hotspot telemetry generator
│   ├── seed_data.py                 # Initial data seeder for Indian sensor stations
│   ├── esp32_firmware_sample.ino    # Arduino C++ sketch for physical ESP32 integration
│   ├── requirements.txt             # Python backend dependencies
│   └── .env.example                 # Environment variables template
│
├── frontend/
│   ├── index.html                   # HTML entrypoint with Leaflet CSS
│   ├── package.json                 # React 18/19, Vite, Tailwind, Lucide, Leaflet, Recharts
│   ├── vite.config.ts               # Vite configuration with proxy to FastAPI backend
│   ├── tailwind.config.js           # Custom Tailwind theme for disaster command center
│   ├── src/
│   │   ├── main.tsx                 # React root
│   │   ├── App.tsx                  # Main dashboard layout
│   │   ├── types/index.ts           # TypeScript interfaces for Sensors, Hazards, Alerts
│   │   ├── services/
│   │   │   ├── api.ts               # Axios client for all backend REST endpoints
│   │   │   └── websocket.ts         # Live WebSocket listener hook
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Header, live status pill, emergency banner, scenario triggers
│   │   │   ├── OverviewCards.tsx    # Total sensors, normal areas, active alerts, critical zones
│   │   │   ├── InteractiveMap.tsx   # Leaflet map with Indian markers, radar pulse & popups
│   │   │   ├── HazardRiskPanel.tsx  # Flood, Forest Fire, AQI risk meters & AI recommendations
│   │   │   ├── RealTimeTelemetry.tsx# Live sensor cards with gauges & mini-trend indicators
│   │   │   ├── AnalyticsCharts.tsx  # Multi-axis time series (Water, Climate, AQI, Hazards)
│   │   │   ├── ActiveAlertsFeed.tsx # Real-time alerts feed with acknowledge actions
│   │   │   ├── SimulatorModal.tsx   # Scenario trigger & simulator control drawer
│   │   │   └── ESP32DocsModal.tsx   # Hardware guide & sample HTTP POST cURL/Arduino code
│   │   └── constants/
│   │       └── indianLocations.ts   # Pre-configured sensor stations across India
│
└── README.md
```

---

## ⚡ Quick Start Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) PostgreSQL 14+ (or run with automatic SQLite fallback)

---

### Step 1: Start the Backend

1. Open a terminal and navigate to `backend/`:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. (Optional) Seed the database with initial stations and historical readings:
   ```bash
   python seed_data.py
   ```

4. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The backend will be available at `http://localhost:8000`.
- **Interactive Swagger API Docs**: `http://localhost:8000/docs`
- **Alternative Redoc API Docs**: `http://localhost:8000/redoc`
- **Live WebSocket Endpoint**: `ws://localhost:8000/ws/live`

---

### Step 2: Start the Frontend

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   ```

2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Open your browser at:
   ```
   http://localhost:5173
   ```

---

## 📡 API Reference & ESP32 Integration

### 1. Ingest Sensor Telemetry (ESP32 Endpoint)
`POST /api/sensor-data`

Accepts telemetry from physical ESP32 devices or simulators, runs risk analysis, records reading, creates alerts if thresholds are breached, and broadcasts live over WebSockets.

#### Request Body Example:
```json
{
  "device_id": "ESP32_CHN_01",
  "location": "Chennai Adyar Basin, Tamil Nadu",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "temperature": 35.5,
  "humidity": 70.0,
  "water_level": 45.0,
  "air_quality": 120.0,
  "smoke_level": 20.0,
  "timestamp": "2026-08-29T10:30:00"
}
```

#### cURL Example:
```bash
curl -X POST http://localhost:8000/api/sensor-data \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_001",
    "location": "Chennai",
    "latitude": 13.0827,
    "longitude": 80.2707,
    "temperature": 35.5,
    "humidity": 70.0,
    "water_level": 45.0,
    "air_quality": 120.0,
    "smoke_level": 20.0
  }'
```

---

### 2. Dashboard Overview
`GET /api/dashboard/overview`

Returns aggregated command center KPIs (Total active sensors, Normal areas, Active alerts, Critical risk zones), active hazards list, and latest telemetry.

---

### 3. Geospatial Map Nodes
`GET /api/dashboard/map-data`

Returns geo-coordinates and current danger levels for all registered monitoring stations for Leaflet rendering.

---

### 4. Hazards & Disaster Alerts
- `GET /api/hazards` - Filter hazards by `status`, `risk_level`, or `hazard_type`.
- `GET /api/alerts` - Retrieve emergency alerts ordered chronologically.
- `PATCH /api/alerts/{alert_id}/ack` - Mark an emergency alert as acknowledged by response teams.

---

### 5. Trigger Live Hackathon Scenarios
`POST /api/simulator/trigger-scenario`

```json
{
  "scenario_type": "CHENNAI_FLOOD"
}
```
*Supported Scenarios:*
- `CHENNAI_FLOOD` (Critical Water Inundation: 84.5 cm)
- `UTTARAKHAND_FIRE` (Critical Wildfire: 42.8°C, 14% Hum, 88 ppm Smoke)
- `DELHI_SMOG` (Hazardous AQI: 385 AQI, 52 ppm Smoke)
- `KERALA_LANDSLIDE_RAIN` (High Inundation: 62.0 cm)
- `NORMAL_RESET` (Resets all nodes to safe baselines)

---

## 🔌 ESP32 Hardware Wiring Guide

| Sensor | Purpose | ESP32 Pin |
|---|---|---|
| **DHT22 / DHT11** | Ambient Temperature & Relative Humidity | `GPIO 4` |
| **HC-SR04 Ultrasonic** | Water Surface Depth Measurement | `TRIG: GPIO 5`, `ECHO: GPIO 18` |
| **MQ-135** | Air Quality / Hazardous Gas (AQI) | `GPIO 34 (Analog ADC)` |
| **MQ-2** | Combustible Gas & Smoke Concentration | `GPIO 35 (Analog ADC)` |
| **Status LED** | Transmission / WiFi Indicator | `GPIO 2` |

> Complete Arduino C++ sketch available in `backend/esp32_firmware_sample.ino`.

---

## 🧪 Verification & Testing

1. **Verify Backend Status**:
   ```bash
   curl http://localhost:8000/health
   ```
   Returns `{"status":"healthy","simulator_active":true,"connected_ws_clients":1}`

2. **Trigger Simulated Flood**:
   Click **Simulate Scenario** -> **Chennai Flash Flood** in the top navigation bar or trigger via API:
   - The map marker in Chennai will instantly glow RED with a pulsing radar wave.
   - A critical civil defense alert appears in the emergency feed.
   - The Flood Risk Gauge shifts to CRITICAL with actionable evacuation directives.

---

## 🏆 Hackathon Project Evaluation Checklist
- [x] Clean, modular FastAPI backend structure (models, schemas, routes, services).
- [x] ESP32 HTTP POST ingestion endpoint (`/api/sensor-data`).
- [x] Complete PostgreSQL database schema (SensorDevices, SensorReadings, HazardEvents, Alerts).
- [x] Multi-hazard risk analysis engine (Flood, Wildfire, AQI Smog, Heatwave).
- [x] Real-time updates via WebSockets and sensor simulator.
- [x] Interactive Leaflet Map with Indian vulnerability hotspots.
- [x] Recharts temporal analytics and trend visualization.
- [x] Hardware integration sample code (`esp32_firmware_sample.ino`).
