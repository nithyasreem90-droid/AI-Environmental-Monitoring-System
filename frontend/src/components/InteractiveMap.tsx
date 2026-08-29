import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MapNode, RiskLevel } from '../types';
import { HAZARD_COLOR_MAP } from '../constants/indianLocations';
import { 
  Waves, 
  Flame, 
  CloudFog, 
  Thermometer, 
  Droplets, 
  Wind, 
  AlertCircle,
  Eye
} from 'lucide-react';

interface InteractiveMapProps {
  nodes: MapNode[];
  selectedDeviceId?: string;
  onSelectDevice: (deviceId: string) => void;
}

// Custom DivIcon Generator for Leaflet
const createCustomMarker = (riskLevel: RiskLevel, isSelected: boolean) => {
  const colorMap = HAZARD_COLOR_MAP[riskLevel] || HAZARD_COLOR_MAP.LOW;
  const isDanger = riskLevel === 'HIGH' || riskLevel === 'CRITICAL';

  const html = `
    <div class="relative flex items-center justify-center">
      ${isDanger ? `<div class="radar-pulse-ring" style="border: 2px solid ${colorMap.hex}; background-color: ${colorMap.hex}22;"></div>` : ''}
      <div class="relative w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 ${
        isSelected ? 'scale-125 ring-4 ring-white/50 z-30' : ''
      }" style="background-color: #0f172a; border-color: ${colorMap.hex};">
        <div class="w-4 h-4 rounded-full" style="background-color: ${colorMap.hex};"></div>
      </div>
      <div class="absolute -bottom-5 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider text-white shadow-md uppercase" style="background-color: ${colorMap.hex}; white-space: nowrap;">
        ${riskLevel}
      </div>
    </div>
  `;

  return L.divIcon({
    html: html,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -20],
  });
};

// Map View Controller to smoothly fly to selected device
function MapFlyTo({ selectedNode }: { selectedNode?: MapNode }) {
  const map = useMap();
  useEffect(() => {
    if (selectedNode) {
      map.flyTo([selectedNode.latitude, selectedNode.longitude], 7, {
        duration: 1.2
      });
    }
  }, [selectedNode, map]);
  return null;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  nodes,
  selectedDeviceId,
  onSelectDevice
}) => {
  const selectedNode = nodes.find(n => n.device_id === selectedDeviceId);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3.5 py-2.5 rounded-xl shadow-lg flex items-center gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              India Geospatial Early Warning Radar
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {nodes.length} Telemetry Nodes Across Key Hazard Corridors
          </p>
        </div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 z-[400] bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-2 rounded-xl shadow-lg hidden sm:flex items-center gap-3 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Low Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="text-slate-300">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
          <span className="text-slate-300">High Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-rose-300 font-bold">Critical</span>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="h-[480px] w-full">
        <MapContainer
          center={[21.0, 79.5]}
          zoom={5}
          scrollWheelZoom={true}
          className="h-full w-full"
        >
          {/* CartoDB Dark Matter Tiles for Cyber/Disaster Room Theme */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapFlyTo selectedNode={selectedNode} />

          {/* Render Warning Radius Circles for Critical Nodes */}
          {nodes.map((node) => {
            const isDanger = node.risk_level === 'HIGH' || node.risk_level === 'CRITICAL';
            if (!isDanger) return null;
            const color = node.risk_level === 'CRITICAL' ? '#ef4444' : '#f97316';

            return (
              <Circle
                key={`circle-${node.device_id}`}
                center={[node.latitude, node.longitude]}
                radius={node.risk_level === 'CRITICAL' ? 45000 : 25000}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4, 8'
                }}
              />
            );
          })}

          {/* Render Markers for each Station */}
          {nodes.map((node) => {
            const isSelected = node.device_id === selectedDeviceId;
            const colorMap = HAZARD_COLOR_MAP[node.risk_level] || HAZARD_COLOR_MAP.LOW;

            return (
              <Marker
                key={node.device_id}
                position={[node.latitude, node.longitude]}
                icon={createCustomMarker(node.risk_level, isSelected)}
                eventHandlers={{
                  click: () => onSelectDevice(node.device_id)
                }}
              >
                <Popup>
                  <div className="p-1 max-w-[260px]">
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-2 mb-2">
                      <div>
                        <div className="text-xs font-bold text-white">{node.location}</div>
                        <div className="text-[10px] font-mono text-slate-400">{node.device_id}</div>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] rounded ${colorMap.badge}`}>
                        {node.risk_level}
                      </span>
                    </div>

                    {/* Telemetry Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] mb-3">
                      <div className="bg-slate-800/80 p-1.5 rounded flex items-center gap-1.5 text-slate-300">
                        <Thermometer className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Temp: <b>{node.temperature}°C</b></span>
                      </div>
                      <div className="bg-slate-800/80 p-1.5 rounded flex items-center gap-1.5 text-slate-300">
                        <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Hum: <b>{node.humidity}%</b></span>
                      </div>
                      <div className="bg-slate-800/80 p-1.5 rounded flex items-center gap-1.5 text-slate-300">
                        <Waves className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>Water: <b>{node.water_level} cm</b></span>
                      </div>
                      <div className="bg-slate-800/80 p-1.5 rounded flex items-center gap-1.5 text-slate-300">
                        <Wind className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>AQI: <b>{node.air_quality}</b></span>
                      </div>
                    </div>

                    {/* Hazard Status */}
                    {node.highest_hazard_type && (
                      <div className="bg-rose-500/10 border border-rose-500/30 p-2 rounded text-[11px] text-rose-300 mb-3 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        <span>Threat: <b>{node.highest_hazard_type.replace('_', ' ')}</b></span>
                      </div>
                    )}

                    {/* Select Station Action */}
                    <button
                      onClick={() => onSelectDevice(node.device_id)}
                      className="w-full py-1.5 px-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Telemetry</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
