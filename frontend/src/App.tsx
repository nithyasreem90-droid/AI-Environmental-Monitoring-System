import React, { useState, useEffect, useCallback } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { 
  OverviewCards 
} from './components/OverviewCards';
import { 
  InteractiveMap 
} from './components/InteractiveMap';
import { 
  HazardRiskPanel 
} from './components/HazardRiskPanel';
import { 
  RealTimeTelemetry 
} from './components/RealTimeTelemetry';
import { 
  AnalyticsCharts 
} from './components/AnalyticsCharts';
import { 
  ActiveAlertsFeed 
} from './components/ActiveAlertsFeed';
import { 
  SimulatorModal 
} from './components/SimulatorModal';
import { 
  ESP32DocsModal 
} from './components/ESP32DocsModal';

import { 
  DashboardOverview, 
  MapNode, 
  SensorDevice, 
  SensorReading, 
  Alert, 
  TrendsData, 
  SimulatorStatus, 
  ScenarioType 
} from './types';
import { api } from './services/api';
import { useHazardWebSocket } from './services/websocket';
import { INDIAN_MONITORING_ZONES } from './constants/indianLocations';

export const App: React.FC = () => {
  // State
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [mapNodes, setMapNodes] = useState<MapNode[]>([]);
  const [devices, setDevices] = useState<SensorDevice[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('ESP32_CHN_01');
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [simulatorStatus, setSimulatorStatus] = useState<SimulatorStatus | null>(null);

  const [simulatorModalOpen, setSimulatorModalOpen] = useState(false);
  const [esp32DocsModalOpen, setEsp32DocsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial dashboard state
  const loadDashboardData = useCallback(async () => {
    try {
      const [ov, nodes, devs, al, sim] = await Promise.all([
        api.getDashboardOverview(),
        api.getMapData(),
        api.getSensorDevices(),
        api.getAlerts({ limit: 40 }),
        api.getSimulatorStatus().catch(() => null)
      ]);

      setOverview(ov);
      setMapNodes(nodes);
      setDevices(devs);
      setAlerts(al);
      if (sim) setSimulatorStatus(sim);
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load trends for currently selected device
  const loadTrends = useCallback(async (devId: string) => {
    try {
      const tr = await api.getTrends(devId, 30);
      setTrendsData(tr);
    } catch (err) {
      console.error('Error fetching device trends:', err);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    if (selectedDeviceId) {
      loadTrends(selectedDeviceId);
    }
  }, [selectedDeviceId, loadTrends]);

  // Periodic fallback refresh (every 8s)
  useEffect(() => {
    const interval = setInterval(() => {
      loadDashboardData();
      if (selectedDeviceId) loadTrends(selectedDeviceId);
    }, 8000);
    return () => clearInterval(interval);
  }, [loadDashboardData, loadTrends, selectedDeviceId]);

  // Handle incoming live telemetry packet via WebSocket
  const handleLiveTelemetry = useCallback((reading: SensorReading) => {
    // Update map nodes
    setMapNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (node.device_id === reading.device_id) {
          return {
            ...node,
            temperature: reading.temperature,
            humidity: reading.humidity,
            water_level: reading.water_level,
            air_quality: reading.air_quality,
            smoke_level: reading.smoke_level,
            risk_level: reading.risk_level || node.risk_level,
            last_updated: reading.timestamp
          };
        }
        return node;
      });
    });

    // If matching currently selected station, update latest telemetry
    if (reading.device_id === selectedDeviceId) {
      setOverview((prev) => {
        if (!prev) return prev;
        const updated = prev.latest_telemetry.filter(t => t.device_id !== reading.device_id);
        return {
          ...prev,
          latest_telemetry: [reading, ...updated]
        };
      });
    }
  }, [selectedDeviceId]);

  // Handle incoming live alert via WebSocket
  const handleLiveAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev]);
  }, []);

  // Connect WebSocket stream
  const { isConnected: wsConnected } = useHazardWebSocket({
    onTelemetry: handleLiveTelemetry,
    onAlert: handleLiveAlert,
    autoReconnect: true
  });

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      const updated = await api.acknowledgeAlert(alertId);
      setAlerts((prev) => prev.map(a => a.id === alertId ? { ...a, status: 'ACKNOWLEDGED' } : a));
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  // Selected station reading & location name
  const currentReading = overview?.latest_telemetry.find(t => t.device_id === selectedDeviceId) 
    || mapNodes.find(n => n.device_id === selectedDeviceId)
    || null;

  const currentLocationName = devices.find(d => d.device_id === selectedDeviceId)?.location 
    || INDIAN_MONITORING_ZONES.find(z => z.deviceId === selectedDeviceId)?.name 
    || selectedDeviceId;

  const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'TRIGGERED');
  const criticalCount = overview?.stats.critical_risk_areas ?? mapNodes.filter(n => n.risk_level === 'CRITICAL').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Navigation */}
      <Navbar
        wsConnected={wsConnected}
        activeCriticalAlerts={criticalAlerts}
        onOpenSimulator={() => setSimulatorModalOpen(true)}
        onOpenESP32Docs={() => setEsp32DocsModalOpen(true)}
        onScenarioTriggered={() => {
          setTimeout(loadDashboardData, 600);
        }}
      />

      {/* Main Dashboard Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Section 1: Overview Summary Cards */}
        <OverviewCards
          stats={overview?.stats || {
            total_active_sensors: devices.length || 6,
            normal_areas: Math.max(0, (devices.length || 6) - criticalCount),
            active_hazard_alerts: alerts.filter(a => a.status === 'TRIGGERED').length,
            critical_risk_areas: criticalCount
          }}
          criticalCount={criticalCount}
        />

        {/* Section 2: Geospatial Map & Hazard Risk Assessment Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Interactive Map (7 cols) */}
          <div className="lg:col-span-7">
            <InteractiveMap
              nodes={mapNodes}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={(id) => setSelectedDeviceId(id)}
            />
          </div>

          {/* Hazard Risk Assessment Panel (5 cols) */}
          <div className="lg:col-span-5">
            <HazardRiskPanel
              currentReading={currentReading as any}
              locationName={currentLocationName}
            />
          </div>
        </div>

        {/* Section 3: Real-Time Telemetry Gauges & Live Emergency Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Real-time Environmental Telemetry (7 cols) */}
          <div className="lg:col-span-7">
            <RealTimeTelemetry
              currentReading={currentReading as any}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={(id) => setSelectedDeviceId(id)}
            />
          </div>

          {/* Active Emergency Alerts Stream (5 cols) */}
          <div className="lg:col-span-5">
            <ActiveAlertsFeed
              alerts={alerts}
              onAcknowledgeAlert={handleAcknowledgeAlert}
            />
          </div>
        </div>

        {/* Section 4: Temporal Analytics & Historical Ingestion Charts */}
        <AnalyticsCharts
          trendsData={trendsData}
          selectedDeviceId={selectedDeviceId}
        />
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AegisIndia AI Early Warning System • Hackathon Project</span>
          <span className="font-mono text-slate-400">FastAPI • PostgreSQL • React • ESP32 IoT Mesh</span>
        </div>
      </footer>

      {/* Interactive Modals */}
      <SimulatorModal
        isOpen={simulatorModalOpen}
        onClose={() => setSimulatorModalOpen(false)}
        status={simulatorStatus}
        onRefresh={loadDashboardData}
      />

      <ESP32DocsModal
        isOpen={esp32DocsModalOpen}
        onClose={() => setEsp32DocsModalOpen(false)}
      />
    </div>
  );
};

export default App;
