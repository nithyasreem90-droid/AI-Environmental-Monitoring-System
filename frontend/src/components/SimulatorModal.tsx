import React, { useState } from 'react';
import { 
  X, 
  Play, 
  Square, 
  Sliders, 
  Waves, 
  Flame, 
  CloudFog, 
  RotateCcw, 
  CheckCircle2, 
  Activity,
  Zap
} from 'lucide-react';
import { SimulatorStatus, ScenarioType } from '../types';
import { api } from '../services/api';

interface SimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  status?: SimulatorStatus | null;
  onRefresh: () => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  isOpen,
  onClose,
  status,
  onRefresh
}) => {
  const [intervalSec, setIntervalSec] = useState<number>(status?.interval_seconds || 4);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleSimulator = async (start: boolean) => {
    setLoading(true);
    try {
      if (start) {
        await api.startSimulator(intervalSec);
        setStatusMessage('Simulator started in background.');
      } else {
        await api.stopSimulator();
        setStatusMessage('Simulator paused.');
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerScenario = async (scenario: ScenarioType) => {
    setLoading(true);
    try {
      const res = await api.triggerScenario(scenario);
      setStatusMessage(res.message || `Scenario ${scenario} triggered!`);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">IoT Sensor Simulator Control Center</h3>
              <p className="text-xs text-slate-400">Generate real-time environmental telemetry without hardware</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Status Message */}
          {statusMessage && (
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Simulator Power & Speed */}
          <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Simulation Engine State
                </span>
                <p className="text-xs text-slate-400">
                  Status:{' '}
                  <span className={status?.is_running ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                    {status?.is_running ? 'RUNNING (Broadcasting Telemetry)' : 'PAUSED'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {status?.is_running ? (
                  <button
                    onClick={() => handleToggleSimulator(false)}
                    disabled={loading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>Pause Simulator</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleToggleSimulator(true)}
                    disabled={loading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Start Simulator</span>
                  </button>
                )}
              </div>
            </div>

            {/* Interval Slider */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                <span>Broadcast Interval:</span>
                <span className="font-mono font-bold text-white">{intervalSec} seconds</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={intervalSec}
                onChange={(e) => setIntervalSec(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* 1-Click Disaster Scenarios for Judge Evaluation */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
              One-Click Disaster Scenario Injections
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Scenario 1: Chennai Flood */}
              <button
                onClick={() => handleTriggerScenario('CHENNAI_FLOOD')}
                disabled={loading}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-rose-500/50 text-left transition group hover:bg-rose-500/5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <Waves className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-rose-300">Chennai Flash Flood</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Forces Water Level to 84.5 cm (Breaches Critical 75cm threshold).
                </p>
              </button>

              {/* Scenario 2: Uttarakhand Fire */}
              <button
                onClick={() => handleTriggerScenario('UTTARAKHAND_FIRE')}
                disabled={loading}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 text-left transition group hover:bg-amber-500/5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Flame className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-amber-300">Uttarakhand Forest Fire</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Sets 42.8°C temp, 14% humidity, and 88 ppm combustion smoke.
                </p>
              </button>

              {/* Scenario 3: Delhi Smog */}
              <button
                onClick={() => handleTriggerScenario('DELHI_SMOG')}
                disabled={loading}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-orange-500/50 text-left transition group hover:bg-orange-500/5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-orange-500/20 text-orange-400 flex items-center justify-center">
                    <CloudFog className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-orange-300">Delhi Severe Smog</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Spikes AQI to 385 (Hazardous level) with elevated particulate smoke.
                </p>
              </button>

              {/* Scenario 4: Normal Reset */}
              <button
                onClick={() => handleTriggerScenario('NORMAL_RESET')}
                disabled={loading}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 text-left transition group hover:bg-emerald-500/5"
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-emerald-300">Reset to Safe Baselines</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Clears all anomalies and returns all stations to nominal conditions.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
