import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Legend
} from 'recharts';
import { TrendsData } from '../types';
import { BarChart3, LineChart as LineIcon, Activity, TrendingUp } from 'lucide-react';

interface AnalyticsChartsProps {
  trendsData?: TrendsData | null;
  selectedDeviceId: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  trendsData,
  selectedDeviceId
}) => {
  const [activeTab, setActiveTab] = useState<'water' | 'climate' | 'aqi' | 'hazards'>('water');

  const rawData = trendsData?.time_series || [];
  const chartData = rawData.length > 0 ? rawData : [
    { timestamp: '10:00', water_level: 22, temperature: 31, humidity: 75, air_quality: 65, smoke_level: 12 },
    { timestamp: '10:15', water_level: 25, temperature: 32, humidity: 74, air_quality: 70, smoke_level: 14 },
    { timestamp: '10:30', water_level: 38, temperature: 33, humidity: 70, air_quality: 85, smoke_level: 18 },
    { timestamp: '10:45', water_level: 54, temperature: 32, humidity: 82, air_quality: 95, smoke_level: 22 },
    { timestamp: '11:00', water_level: 68, temperature: 30, humidity: 90, air_quality: 110, smoke_level: 25 },
    { timestamp: '11:15', water_level: 82, temperature: 28, humidity: 95, air_quality: 130, smoke_level: 30 },
  ];

  // Hazard distribution data
  const dist = trendsData?.hazard_distribution || {
    FLOOD: 4,
    AIR_POLLUTION: 6,
    FOREST_FIRE: 2,
    HEATWAVE: 1
  };
  const distributionData = Object.entries(dist).map(([key, value]) => ({
    type: key.replace('_', ' '),
    count: value
  }));

  const customTooltipStyle = {
    backgroundColor: '#0f172a',
    borderColor: '#334155',
    borderRadius: '0.75rem',
    color: '#f8fafc',
    fontSize: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
  };

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl">
      {/* Header & Metric Switcher Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Historical Telemetry & Hazard Analytics
            </h2>
            <p className="text-xs text-slate-400">
              Temporal Ingestion Trends for <span className="font-mono text-slate-300">{selectedDeviceId}</span>
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('water')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'water' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Water Level
          </button>
          <button
            onClick={() => setActiveTab('climate')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'climate' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Temp & Humidity
          </button>
          <button
            onClick={() => setActiveTab('aqi')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'aqi' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            AQI & Smoke
          </button>
          <button
            onClick={() => setActiveTab('hazards')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              activeTab === 'hazards' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Hazard Distribution
          </button>
        </div>
      </div>

      {/* Chart View Area */}
      <div className="h-72 w-full">
        {/* 1. Water Level Over Time */}
        {activeTab === 'water' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} unit=" cm" />
              <Tooltip contentStyle={customTooltipStyle} />
              <ReferenceLine y={75} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical Flood (75cm)', fill: '#ef4444', fontSize: 11 }} />
              <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Warning (50cm)', fill: '#f59e0b', fontSize: 11 }} />
              <Area type="monotone" dataKey="water_level" name="Water Level (cm)" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#waterGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* 2. Temperature & Humidity Dual-Axis */}
        {activeTab === 'climate' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
              <YAxis yAxisId="left" stroke="#f43f5e" fontSize={11} domain={[15, 50]} unit="°C" />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={11} domain={[0, 100]} unit="%" />
              <Tooltip contentStyle={customTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Line yAxisId="left" type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {/* 3. AQI & Smoke Concentration */}
        {activeTab === 'aqi' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="smokeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} domain={[0, 'auto']} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="air_quality" name="Air Quality (AQI)" stroke="#f97316" strokeWidth={2} fillOpacity={1} fill="url(#aqiGrad)" />
              <Area type="monotone" dataKey="smoke_level" name="Smoke (ppm)" stroke="#eab308" strokeWidth={2} fillOpacity={1} fill="url(#smokeGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {/* 4. Hazard Severity Breakdown */}
        {activeTab === 'hazards' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={distributionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="type" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Bar dataKey="count" name="Incidents Detected" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
