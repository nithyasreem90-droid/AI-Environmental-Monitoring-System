import React from 'react';
import { 
  Waves, 
  Flame, 
  CloudFog, 
  ThermometerSun, 
  BrainCircuit, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { SensorReading, RiskLevel } from '../types';
import { HAZARD_COLOR_MAP } from '../constants/indianLocations';

interface HazardRiskPanelProps {
  currentReading?: SensorReading | null;
  locationName: string;
}

export const HazardRiskPanel: React.FC<HazardRiskPanelProps> = ({
  currentReading,
  locationName
}) => {
  const wl = currentReading?.water_level ?? 20;
  const temp = currentReading?.temperature ?? 30;
  const hum = currentReading?.humidity ?? 65;
  const aqi = currentReading?.air_quality ?? 85;
  const smoke = currentReading?.smoke_level ?? 12;

  // 1. Calculate Flood Risk
  let floodRisk: RiskLevel = 'LOW';
  let floodProgress = Math.min(100, (wl / 90) * 100);
  if (wl >= 75) floodRisk = 'CRITICAL';
  else if (wl >= 50) floodRisk = 'HIGH';
  else if (wl >= 35) floodRisk = 'MEDIUM';

  // 2. Calculate Forest Fire Risk
  let fireRisk: RiskLevel = 'LOW';
  let fireScore = 15;
  if ((temp >= 40 && hum <= 20 && smoke >= 50) || smoke >= 75) {
    fireRisk = 'CRITICAL';
    fireScore = 95;
  } else if ((temp >= 38 && hum <= 25 && smoke >= 45) || (smoke >= 45 && temp >= 36)) {
    fireRisk = 'HIGH';
    fireScore = 78;
  } else if ((temp >= 36 && hum <= 30) || smoke >= 30) {
    fireRisk = 'MEDIUM';
    fireScore = 48;
  }

  // 3. Calculate Pollution Risk
  let pollutionRisk: RiskLevel = 'LOW';
  let aqiProgress = Math.min(100, (aqi / 400) * 100);
  if (aqi >= 300) pollutionRisk = 'CRITICAL';
  else if (aqi >= 200) pollutionRisk = 'HIGH';
  else if (aqi >= 100) pollutionRisk = 'MEDIUM';

  // 4. Calculate Heatwave Risk
  let heatRisk: RiskLevel = 'LOW';
  if (temp >= 44) heatRisk = 'CRITICAL';
  else if (temp >= 40) heatRisk = 'HIGH';
  else if (temp >= 37) heatRisk = 'MEDIUM';

  const floodColor = HAZARD_COLOR_MAP[floodRisk];
  const fireColor = HAZARD_COLOR_MAP[fireRisk];
  const pollutionColor = HAZARD_COLOR_MAP[pollutionRisk];
  const heatColor = HAZARD_COLOR_MAP[heatRisk];

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Hazard Risk Assessment Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Station: <span className="text-slate-200 font-semibold">{locationName}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
            Engine: Rule-Matrix + AI Hook (12ms)
          </span>
        </div>
      </div>

      {/* 4 Hazard Risk Evaluator Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* A. Flood Risk Gauge */}
        <div className={`p-4 rounded-xl border transition-all ${floodColor.bg} ${floodColor.border}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Waves className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Flood Risk</h3>
                <span className="text-[10px] text-slate-400">Depth & Inundation Rate</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-xs rounded font-bold ${floodColor.badge}`}>
              {floodRisk}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-1.5 text-xs">
            <span className="text-slate-400">Water Depth:</span>
            <span className="font-mono font-bold text-white text-sm">
              {wl.toFixed(1)} <span className="text-xs text-slate-400">/ 100 cm</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                floodRisk === 'CRITICAL' ? 'bg-rose-500 animate-pulse' :
                floodRisk === 'HIGH' ? 'bg-orange-500' :
                floodRisk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${floodProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Safe &lt;35cm</span>
            <span>Warning 50cm</span>
            <span>Critical &gt;75cm</span>
          </div>
        </div>

        {/* B. Forest Fire Risk Gauge */}
        <div className={`p-4 rounded-xl border transition-all ${fireColor.bg} ${fireColor.border}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Forest Fire Risk</h3>
                <span className="text-[10px] text-slate-400">Temp + Low Hum + Smoke</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-xs rounded font-bold ${fireColor.badge}`}>
              {fireRisk}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-1.5 text-xs">
            <span className="text-slate-400">Combustion Smoke:</span>
            <span className="font-mono font-bold text-white text-sm">
              {smoke.toFixed(1)} <span className="text-xs text-slate-400">ppm ({temp}°C, {hum}%)</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                fireRisk === 'CRITICAL' ? 'bg-rose-500 animate-pulse' :
                fireRisk === 'HIGH' ? 'bg-orange-500' :
                fireRisk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${fireScore}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Moist Veg</span>
            <span>Dry Bush</span>
            <span>Crown Fire</span>
          </div>
        </div>

        {/* C. Pollution Risk Gauge */}
        <div className={`p-4 rounded-xl border transition-all ${pollutionColor.bg} ${pollutionColor.border}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center">
                <CloudFog className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Air Pollution Risk</h3>
                <span className="text-[10px] text-slate-400">AQI Index & Particulates</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-xs rounded font-bold ${pollutionColor.badge}`}>
              {pollutionRisk}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-1.5 text-xs">
            <span className="text-slate-400">National AQI:</span>
            <span className="font-mono font-bold text-white text-sm">
              {aqi.toFixed(0)} <span className="text-xs text-slate-400">/ 500 AQI</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pollutionRisk === 'CRITICAL' ? 'bg-rose-500 animate-pulse' :
                pollutionRisk === 'HIGH' ? 'bg-orange-500' :
                pollutionRisk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${aqiProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Good (0-50)</span>
            <span>Poor (100-200)</span>
            <span>Hazardous (&gt;300)</span>
          </div>
        </div>

        {/* D. Heatwave Risk Gauge */}
        <div className={`p-4 rounded-xl border transition-all ${heatColor.bg} ${heatColor.border}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <ThermometerSun className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white">Heatwave Index</h3>
                <span className="text-[10px] text-slate-400">Thermal Stress Indicator</span>
              </div>
            </div>
            <span className={`px-2 py-0.5 text-xs rounded font-bold ${heatColor.badge}`}>
              {heatRisk}
            </span>
          </div>

          <div className="flex items-baseline justify-between mb-1.5 text-xs">
            <span className="text-slate-400">Ambient Temp:</span>
            <span className="font-mono font-bold text-white text-sm">
              {temp.toFixed(1)}°C <span className="text-xs text-slate-400">(Relative Hum: {hum}%)</span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                heatRisk === 'CRITICAL' ? 'bg-rose-500 animate-pulse' :
                heatRisk === 'HIGH' ? 'bg-orange-500' :
                heatRisk === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, (temp / 50) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
            <span>Normal &lt;35°C</span>
            <span>Warning 40°C</span>
            <span>Red Alert &gt;44°C</span>
          </div>
        </div>
      </div>

      {/* AI Emergency Directive Card */}
      <div className="mt-5 rounded-xl bg-slate-950/70 border border-slate-800 p-4">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200">
              Automated Incident Decision Protocol:
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {floodRisk === 'CRITICAL'
                ? 'CRITICAL FLOOD ALERT: Ultrasonic level sensors indicate dangerous channel overflow (>75cm). Sound localized sirens and initiate low-lying community evacuation immediately.'
                : fireRisk === 'CRITICAL'
                ? 'CRITICAL FOREST FIRE: Extreme thermal anomaly combined with dense smoke plume (>75ppm). Dispatch aerial wildfire suppression and alert forest rangers.'
                : pollutionRisk === 'CRITICAL'
                ? 'HAZARDOUS AIR POLLUTION: Severe smog episode (>300 AQI). Implement GRAP-IV emergency protocols, deploy anti-smog mist guns, and enforce public health advisories.'
                : 'All environmental parameters within safe thresholds. Automated continuous surveillance active across all regional nodes.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
