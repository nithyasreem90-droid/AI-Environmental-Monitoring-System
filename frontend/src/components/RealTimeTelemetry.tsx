import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Waves, 
  Wind, 
  Flame, 
  BatteryCharging, 
  Clock, 
  MapPin,
  Cpu
} from 'lucide-react';
import { SensorReading, SensorDevice } from '../types';
import { INDIAN_MONITORING_ZONES } from '../constants/indianLocations';

interface RealTimeTelemetryProps {
  currentReading?: SensorReading | null;
  devices: SensorDevice[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
}

export const RealTimeTelemetry: React.FC<RealTimeTelemetryProps> = ({
  currentReading,
  devices,
  selectedDeviceId,
  onSelectDevice
}) => {
  const currentDevice = devices.find(d => d.device_id === selectedDeviceId);
  const locationPreset = INDIAN_MONITORING_ZONES.find(z => z.deviceId === selectedDeviceId);

  const temp = currentReading?.temperature ?? 32.0;
  const hum = currentReading?.humidity ?? 70.0;
  const water = currentReading?.water_level ?? 22.0;
  const aqi = currentReading?.air_quality ?? 75.0;
  const smoke = currentReading?.smoke_level ?? 12.0;

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      {/* Header & Station Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <span>Real-Time Environmental Sensor Telemetry</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                LIVE STREAM
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              {locationPreset?.description || 'Active ESP32 telemetry ingestion point'}
            </p>
          </div>
        </div>

        {/* Device Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          >
            {devices.map((d) => (
              <option key={d.device_id} value={d.device_id}>
                {d.location} ({d.device_id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5 Real-Time Sensor Telemetry Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* 1. Temperature */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 relative overflow-hidden group hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Temperature</span>
            <Thermometer className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {temp.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">°C</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">DHT22 Sensor</span>
            <span className={temp > 38 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
              {temp > 40 ? 'HEATWAVE' : temp > 38 ? 'HIGH' : 'NORMAL'}
            </span>
          </div>
        </div>

        {/* 2. Humidity */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 relative overflow-hidden group hover:border-blue-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Humidity</span>
            <Droplets className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {hum.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">%</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">Relative Humidity</span>
            <span className={hum < 25 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              {hum < 25 ? 'DRY ARID' : hum > 85 ? 'HIGH MOIST' : 'OPTIMAL'}
            </span>
          </div>
        </div>

        {/* 3. Water Level */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Water Level</span>
            <Waves className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {water.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">cm</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">HC-SR04 Ultrasonic</span>
            <span className={water > 75 ? 'text-rose-400 font-bold animate-pulse' : water > 50 ? 'text-orange-400 font-bold' : 'text-emerald-400'}>
              {water > 75 ? 'CRITICAL FLOOD' : water > 50 ? 'ELEVATED' : 'SAFE'}
            </span>
          </div>
        </div>

        {/* 4. Air Quality (AQI) */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Air Quality</span>
            <Wind className="w-4 h-4 text-orange-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {aqi.toFixed(0)}
            </span>
            <span className="text-sm font-semibold text-slate-400">AQI</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">MQ-135 Sensor</span>
            <span className={aqi > 300 ? 'text-rose-400 font-bold animate-pulse' : aqi > 200 ? 'text-orange-400 font-bold' : 'text-emerald-400'}>
              {aqi > 300 ? 'HAZARDOUS' : aqi > 200 ? 'POOR' : 'MODERATE'}
            </span>
          </div>
        </div>

        {/* 5. Smoke / Gas Level */}
        <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 relative overflow-hidden group hover:border-amber-500/40 transition-all col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">Smoke Level</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {smoke.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">ppm</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px]">
            <span className="text-slate-500">MQ-2 Combustible</span>
            <span className={smoke > 45 ? 'text-rose-400 font-bold animate-pulse' : smoke > 30 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
              {smoke > 45 ? 'DENSE SMOKE' : smoke > 30 ? 'ELEVATED' : 'CLEAR'}
            </span>
          </div>
        </div>
      </div>

      {/* Device Hardware Metadata Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400 bg-slate-950/40 border border-slate-800/80 px-3.5 py-2 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-mono text-slate-300">{selectedDeviceId}</span>
          </span>
          <span className="flex items-center gap-1">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span>Solar Battery: <b>{currentDevice?.battery_level?.toFixed(0) || 98}%</b></span>
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Sync: {currentReading?.timestamp ? new Date(currentReading.timestamp).toLocaleTimeString() : 'Just now'}</span>
        </div>
      </div>
    </div>
  );
};
