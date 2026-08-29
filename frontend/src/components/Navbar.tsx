import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Radio, 
  Activity, 
  Cpu, 
  Sliders, 
  AlertOctagon, 
  RotateCcw, 
  Flame, 
  Waves, 
  CloudFog,
  ChevronDown
} from 'lucide-react';
import { ScenarioType, Alert } from '../types';
import { api } from '../services/api';

interface NavbarProps {
  wsConnected: boolean;
  activeCriticalAlerts: Alert[];
  onOpenSimulator: () => void;
  onOpenESP32Docs: () => void;
  onScenarioTriggered?: (scenario: ScenarioType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wsConnected,
  activeCriticalAlerts,
  onOpenSimulator,
  onOpenESP32Docs,
  onScenarioTriggered
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isScenarioDropdownOpen, setIsScenarioDropdownOpen] = useState(false);
  const [triggeringScenario, setTriggeringScenario] = useState<string | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour12: true,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' IST'
      );
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleScenarioSelect = async (scenario: ScenarioType) => {
    setTriggeringScenario(scenario);
    setIsScenarioDropdownOpen(false);
    try {
      await api.triggerScenario(scenario);
      onScenarioTriggered?.(scenario);
    } catch (err) {
      console.error('Error triggering scenario:', err);
    } finally {
      setTimeout(() => setTriggeringScenario(null), 1000);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      {/* Critical Alert Flash Banner */}
      {activeCriticalAlerts.length > 0 && (
        <div className="bg-rose-600/90 text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 max-w-5xl truncate">
            <AlertOctagon className="w-4 h-4 shrink-0" />
            <span className="font-bold tracking-wide">CRITICAL CIVIL DEFENSE ALERT:</span>
            <span className="truncate">{activeCriticalAlerts[0].alert_message}</span>
          </div>
          <span className="text-[11px] bg-rose-950/70 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
            Immediate Response Active ({activeCriticalAlerts.length})
          </span>
        </div>
      )}

      {/* Main Navbar Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 via-amber-500 to-indigo-600 p-0.5 shadow-lg shadow-rose-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                AEGIS-INDIA
              </h1>
              <span className="text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.5 rounded">
                DISASTER WARNING
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              AI Environmental Hazard Monitoring & Early Warning Platform
            </p>
          </div>
        </div>

        {/* Live Status & Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* WebSocket Live Telemetry Indicator */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                wsConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                wsConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`} />
            </span>
            <span className="text-slate-300 font-medium hidden md:inline">
              {wsConnected ? 'Live Feed' : 'Connecting'}
            </span>
            <span className="font-mono text-slate-400 text-[11px] border-l border-slate-700 pl-2 hidden lg:inline">
              {currentTime}
            </span>
          </div>

          {/* Quick Scenario Injector Dropdown (Crucial for Hackathon Demos) */}
          <div className="relative">
            <button
              onClick={() => setIsScenarioDropdownOpen(!isScenarioDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-lg text-xs font-semibold transition-all shadow-sm"
              title="Trigger real-time disaster scenarios for live demo"
            >
              <Activity className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Simulate Scenario</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isScenarioDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 py-1.5 overflow-hidden">
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  Live Hackathon Test Injections
                </div>
                
                <button
                  onClick={() => handleScenarioSelect('CHENNAI_FLOOD')}
                  className="w-full text-left px-3 py-2 text-xs text-rose-300 hover:bg-rose-500/15 flex items-center gap-2 transition"
                >
                  <Waves className="w-4 h-4 text-rose-400" />
                  <div>
                    <div className="font-semibold">Chennai Flash Flood</div>
                    <div className="text-[10px] text-slate-400">Water 84.5cm (CRITICAL)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleScenarioSelect('UTTARAKHAND_FIRE')}
                  className="w-full text-left px-3 py-2 text-xs text-amber-300 hover:bg-amber-500/15 flex items-center gap-2 transition"
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <div>
                    <div className="font-semibold">Uttarakhand Forest Fire</div>
                    <div className="text-[10px] text-slate-400">42.8°C + 88ppm Smoke (CRITICAL)</div>
                  </div>
                </button>

                <button
                  onClick={() => handleScenarioSelect('DELHI_SMOG')}
                  className="w-full text-left px-3 py-2 text-xs text-orange-300 hover:bg-orange-500/15 flex items-center gap-2 transition"
                >
                  <CloudFog className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="font-semibold">Delhi Severe Smog Crisis</div>
                    <div className="text-[10px] text-slate-400">AQI 385 Hazardous (CRITICAL)</div>
                  </div>
                </button>

                <div className="border-t border-slate-800 mt-1">
                  <button
                    onClick={() => handleScenarioSelect('NORMAL_RESET')}
                    className="w-full text-left px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-500/15 flex items-center gap-2 transition"
                  >
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-semibold">Reset to Normal Telemetry</div>
                      <div className="text-[10px] text-slate-400">Safe environmental baselines</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Simulator Drawer Trigger */}
          <button
            onClick={onOpenSimulator}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Simulator Controls</span>
          </button>

          {/* ESP32 Hardware Integration Modal */}
          <button
            onClick={onOpenESP32Docs}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-semibold transition"
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>ESP32 API</span>
          </button>
        </div>
      </div>
    </header>
  );
};
