import React from 'react';
import { 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  TrendingUp,
  MapPin
} from 'lucide-react';
import { OverviewStats } from '../types';

interface OverviewCardsProps {
  stats: OverviewStats;
  criticalCount: number;
}

export const OverviewCards: React.FC<OverviewCardsProps> = ({ stats, criticalCount }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Active Sensors */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Active Sensors
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
                {stats.total_active_sensors}
              </span>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                100% Online
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>ESP32 Hardware & IoT Nodes</span>
          <span className="text-slate-300 font-mono">6 Regional Hubs</span>
        </div>
      </div>

      {/* 2. Normal Areas */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-emerald-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Normal Areas
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-400 tracking-tight font-mono">
                {stats.normal_areas}
              </span>
              <span className="text-xs text-slate-400">
                / {stats.total_active_sensors} monitored
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>Status: Safe Baselines</span>
          <span className="text-emerald-400 font-medium">Stable</span>
        </div>
      </div>

      {/* 3. Active Hazard Alerts */}
      <div className="relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-amber-500/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Active Hazard Alerts
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tracking-tight font-mono ${
                stats.active_hazard_alerts > 0 ? 'text-amber-400' : 'text-slate-300'
              }`}>
                {stats.active_hazard_alerts}
              </span>
              {stats.active_hazard_alerts > 0 && (
                <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.5 rounded">
                  Requires Action
                </span>
              )}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>Disaster Early Warnings</span>
          <span className="text-slate-300">Live Dispatched</span>
        </div>
      </div>

      {/* 4. Critical Risk Areas */}
      <div className={`relative overflow-hidden rounded-xl p-5 shadow-lg backdrop-blur-sm transition-all ${
        criticalCount > 0 
          ? 'bg-rose-950/40 border-2 border-rose-500/60 shadow-rose-900/30' 
          : 'bg-slate-900/80 border border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Critical Risk Areas
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-3xl font-extrabold tracking-tight font-mono ${
                criticalCount > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-300'
              }`}>
                {criticalCount}
              </span>
              {criticalCount > 0 ? (
                <span className="text-xs font-bold text-rose-300 bg-rose-600/30 border border-rose-500/50 px-2 py-0.5 rounded animate-pulse">
                  EMERGENCY
                </span>
              ) : (
                <span className="text-xs text-emerald-400 font-medium">None Active</span>
              )}
            </div>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            criticalCount > 0 
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-bounce' 
              : 'bg-slate-800 border border-slate-700 text-slate-400'
          }`}>
            <Flame className="w-6 h-6" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2.5">
          <span>NDRF & SDRF Coordination</span>
          <span className={criticalCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
            {criticalCount > 0 ? 'RED ALERT LEVEL' : 'Clear'}
          </span>
        </div>
      </div>
    </div>
  );
};
