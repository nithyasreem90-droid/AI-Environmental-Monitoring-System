import React, { useState } from 'react';
import { 
  AlertOctagon, 
  AlertTriangle, 
  CheckCheck, 
  ShieldAlert, 
  Clock, 
  MapPin,
  Volume2,
  VolumeX,
  CheckCircle,
  Filter
} from 'lucide-react';
import { Alert, RiskLevel } from '../types';
import { HAZARD_COLOR_MAP } from '../constants/indianLocations';

interface ActiveAlertsFeedProps {
  alerts: Alert[];
  onAcknowledgeAlert: (alertId: number) => void;
}

export const ActiveAlertsFeed: React.FC<ActiveAlertsFeedProps> = ({
  alerts,
  onAcknowledgeAlert
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState(true);

  const filteredAlerts = alerts.filter(a => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Emergency Alerts Stream
              </h2>
              {alerts.filter(a => a.status === 'TRIGGERED').length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full animate-pulse">
                  {alerts.filter(a => a.status === 'TRIGGERED').length} ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Live Early Warning Broadcast for Emergency First Responders
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                filterSeverity === sev
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Scrollable List */}
      <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-10 px-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-semibold text-slate-300">All Monitoring Zones Clear</p>
            <p className="text-xs text-slate-500 mt-0.5">No unacknowledged hazards matching your filter.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const colorMap = HAZARD_COLOR_MAP[alert.severity] || HAZARD_COLOR_MAP.LOW;
            const isTriggered = alert.status === 'TRIGGERED';

            return (
              <div
                key={alert.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  isTriggered 
                    ? `${colorMap.bg} ${colorMap.border} shadow-lg` 
                    : 'bg-slate-950/40 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {alert.severity === 'CRITICAL' ? (
                      <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-pulse" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] rounded font-bold ${colorMap.badge}`}>
                          {alert.severity}
                        </span>
                        {alert.location && (
                          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {alert.location}
                          </span>
                        )}
                        {alert.device_id && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {alert.device_id}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-200 mt-1.5 font-medium leading-relaxed">
                        {alert.alert_message}
                      </p>

                      <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(alert.created_at).toLocaleTimeString()}
                        </span>
                        <span>•</span>
                        <span className={isTriggered ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-medium'}>
                          {alert.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acknowledge Action Button */}
                  {isTriggered && (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-500 rounded-lg text-xs font-semibold transition flex items-center gap-1 shrink-0"
                      title="Acknowledge Alert"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
