export interface LocationPreset {
  deviceId: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  primaryRisk: string;
  description: string;
}

export const INDIAN_MONITORING_ZONES: LocationPreset[] = [
  {
    deviceId: "ESP32_CHN_01",
    name: "Chennai Adyar Basin",
    state: "Tamil Nadu",
    lat: 13.0827,
    lng: 80.2707,
    primaryRisk: "Urban Monsoon Inundation & Cyclone Surge",
    description: "Low-lying coastal riparian corridor vulnerable to extreme northeast monsoon rain."
  },
  {
    deviceId: "ESP32_KER_02",
    name: "Wayanad Highland Zone",
    state: "Kerala",
    lat: 11.6854,
    lng: 76.1320,
    primaryRisk: "Flash Floods & Slope Landslide Runoff",
    description: "Western Ghats micro-catchment basin with steep terrain elevation."
  },
  {
    deviceId: "ESP32_UTK_03",
    name: "Chamoli Forest Range",
    state: "Uttarakhand",
    lat: 30.4258,
    lng: 79.3300,
    primaryRisk: "Himalayan Wildfire & Thermal Anomaly",
    description: "Dense pine and oak forest belt prone to dry season crown fires."
  },
  {
    deviceId: "ESP32_DEL_04",
    name: "Anand Vihar Smog Hub",
    state: "Delhi NCR",
    lat: 28.6469,
    lng: 77.3160,
    primaryRisk: "Hazardous AQI & Toxic Particulate Smog",
    description: "High traffic and industrial transit border with severe winter inversion spikes."
  },
  {
    deviceId: "ESP32_MUM_05",
    name: "Mithi River Catchment",
    state: "Maharashtra",
    lat: 19.0760,
    lng: 72.8777,
    primaryRisk: "Tidal Surge & Riverbank Overflow",
    description: "High-density urban estuarine channel discharging into the Arabian Sea."
  },
  {
    deviceId: "ESP32_BLR_06",
    name: "Electronic City Baseline",
    state: "Karnataka",
    lat: 12.8452,
    lng: 77.6602,
    primaryRisk: "Baseline Control Station",
    description: "Continuous environmental monitoring in high-tech corridor."
  }
];

export const HAZARD_COLOR_MAP = {
  LOW: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badge: 'bg-emerald-500 text-slate-950 font-bold',
    hex: '#10b981'
  },
  MEDIUM: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500 text-slate-950 font-bold',
    hex: '#f59e0b'
  },
  HIGH: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    badge: 'bg-orange-500 text-slate-950 font-bold',
    hex: '#f97316'
  },
  CRITICAL: {
    bg: 'bg-rose-500/15',
    text: 'text-rose-400',
    border: 'border-rose-500/50',
    badge: 'bg-rose-600 text-white font-bold animate-pulse',
    hex: '#ef4444'
  }
};
