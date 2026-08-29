export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type HazardType = 'FLOOD' | 'FOREST_FIRE' | 'AIR_POLLUTION' | 'HEATWAVE' | 'GAS_LEAK';
export type AlertStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';
export type DeviceStatus = 'ACTIVE' | 'OFFLINE' | 'MAINTENANCE' | 'ALERT';

export interface SensorReading {
  id: number;
  device_id: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  temperature: number;
  humidity: number;
  water_level: number;
  air_quality: number;
  smoke_level: number;
  timestamp: string;
  risk_level?: RiskLevel;
  hazard_detected?: boolean;
}

export interface SensorDevice {
  id: number;
  device_id: string;
  location: string;
  latitude: number;
  longitude: number;
  status: DeviceStatus;
  device_type?: string;
  battery_level?: number;
  last_seen?: string;
  latest_reading?: SensorReading | null;
}

export interface HazardEvent {
  id: number;
  hazard_type: HazardType;
  risk_level: RiskLevel;
  location: string;
  latitude: number;
  longitude: number;
  description: string;
  detected_at: string;
  status: 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED';
  device_id?: string;
  metrics_snapshot?: string;
}

export interface Alert {
  id: number;
  hazard_event_id?: number;
  device_id?: string;
  alert_message: string;
  severity: RiskLevel;
  created_at: string;
  status: AlertStatus;
  location?: string;
  recommendation?: string;
}

export interface OverviewStats {
  total_active_sensors: number;
  normal_areas: number;
  active_hazard_alerts: number;
  critical_risk_areas: number;
}

export interface MapNode {
  device_id: string;
  location: string;
  latitude: number;
  longitude: number;
  status: DeviceStatus;
  risk_level: RiskLevel;
  highest_hazard_type?: HazardType | null;
  temperature: number;
  humidity: number;
  water_level: number;
  air_quality: number;
  smoke_level: number;
  last_updated: string;
}

export interface DashboardOverview {
  stats: OverviewStats;
  active_hazards: HazardEvent[];
  recent_alerts: Alert[];
  latest_telemetry: SensorReading[];
  risk_breakdown: Record<RiskLevel, number>;
  system_status: string;
}

export interface TrendsData {
  device_id: string;
  time_series: Array<{
    timestamp: string;
    temperature: number;
    humidity: number;
    water_level: number;
    air_quality: number;
    smoke_level: number;
  }>;
  hazard_distribution: Record<string, number>;
}

export interface SimulatorStatus {
  is_running: boolean;
  interval_seconds: number;
  active_nodes_count: number;
  last_broadcast?: string | null;
}

export type ScenarioType = 
  | 'CHENNAI_FLOOD' 
  | 'UTTARAKHAND_FIRE' 
  | 'DELHI_SMOG' 
  | 'KERALA_LANDSLIDE_RAIN' 
  | 'NORMAL_RESET';
