import axios from 'axios';
import {
  DashboardOverview,
  MapNode,
  SensorReading,
  SensorDevice,
  HazardEvent,
  Alert,
  TrendsData,
  SimulatorStatus,
  ScenarioType
} from '../types';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Dashboard
  getDashboardOverview: async (): Promise<DashboardOverview> => {
    const res = await client.get('/dashboard/overview');
    return res.data;
  },

  getMapData: async (): Promise<MapNode[]> => {
    const res = await client.get('/dashboard/map-data');
    return res.data;
  },

  getTrends: async (deviceId: string = 'ESP32_CHN_01', limit: number = 30): Promise<TrendsData> => {
    const res = await client.get('/dashboard/trends', { params: { device_id: deviceId, limit } });
    return res.data;
  },

  // Sensors & Telemetry
  getSensorReadings: async (deviceId?: string, limit: number = 50): Promise<SensorReading[]> => {
    const res = await client.get('/sensor-data', { params: { device_id: deviceId, limit } });
    return res.data;
  },

  getSensorDevices: async (): Promise<SensorDevice[]> => {
    const res = await client.get('/sensors/devices');
    return res.data;
  },

  postSensorData: async (data: any) => {
    const res = await client.post('/sensor-data', data);
    return res.data;
  },

  // Hazards
  getHazards: async (params?: { status?: string; risk_level?: string; hazard_type?: string; limit?: number }): Promise<HazardEvent[]> => {
    const res = await client.get('/hazards', { params });
    return res.data;
  },

  updateHazardStatus: async (hazardId: number, status: string): Promise<HazardEvent> => {
    const res = await client.patch(`/hazards/${hazardId}/status`, { status });
    return res.data;
  },

  // Alerts
  getAlerts: async (params?: { severity?: string; status?: string; limit?: number }): Promise<Alert[]> => {
    const res = await client.get('/alerts', { params });
    return res.data;
  },

  acknowledgeAlert: async (alertId: number): Promise<Alert> => {
    const res = await client.patch(`/alerts/${alertId}/ack`);
    return res.data;
  },

  // Simulator
  getSimulatorStatus: async (): Promise<SimulatorStatus> => {
    const res = await client.get('/simulator/status');
    return res.data;
  },

  startSimulator: async (intervalSeconds: number = 4) => {
    const res = await client.post('/simulator/start', { active: true, interval_seconds: intervalSeconds });
    return res.data;
  },

  stopSimulator: async () => {
    const res = await client.post('/simulator/stop');
    return res.data;
  },

  triggerScenario: async (scenarioType: ScenarioType, targetDeviceId?: string) => {
    const res = await client.post('/simulator/trigger-scenario', {
      scenario_type: scenarioType,
      target_device_id: targetDeviceId,
    });
    return res.data;
  }
};
