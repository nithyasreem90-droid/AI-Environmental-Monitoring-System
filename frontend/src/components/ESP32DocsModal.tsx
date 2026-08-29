import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  Wifi, 
  Layers, 
  CheckCircle,
  FileCode
} from 'lucide-react';

interface ESP32DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ESP32DocsModal: React.FC<ESP32DocsModalProps> = ({ isOpen, onClose }) => {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedArduino, setCopiedArduino] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'curl' | 'arduino' | 'pinout'>('curl');

  if (!isOpen) return null;

  const sampleJson = `{
  "device_id": "ESP32_001",
  "location": "Chennai Adyar Basin",
  "latitude": 13.0827,
  "longitude": 80.2707,
  "temperature": 35.5,
  "humidity": 70.0,
  "water_level": 45.0,
  "air_quality": 120.0,
  "smoke_level": 20.0,
  "timestamp": "${new Date().toISOString()}"
}`;

  const sampleCurl = `curl -X POST http://localhost:8000/api/sensor-data \\
  -H "Content-Type: application/json" \\
  -d '${sampleJson.replace(/\n/g, '').replace(/\s+/g, ' ')}'`;

  const arduinoSnippet = `// ESP32 Telemetry Dispatcher Snippet
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* serverUrl = "http://YOUR_SERVER_IP:8000/api/sensor-data";

void sendSensorData() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<512> doc;
    doc["device_id"] = "ESP32_CHN_01";
    doc["location"] = "Chennai Adyar Basin";
    doc["latitude"] = 13.0827;
    doc["longitude"] = 80.2707;
    doc["temperature"] = dht.readTemperature();
    doc["humidity"] = dht.readHumidity();
    doc["water_level"] = readUltrasonicDepth();
    doc["air_quality"] = readMQ135AQI();
    doc["smoke_level"] = readMQ2Smoke();

    String jsonBody;
    serializeJson(doc, jsonBody);
    int httpResponseCode = http.POST(jsonBody);
    http.end();
  }
}`;

  const copyToClipboard = (text: string, type: 'curl' | 'json' | 'arduino') => {
    navigator.clipboard.writeText(text);
    if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'json') {
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } else {
      setCopiedArduino(true);
      setTimeout(() => setCopiedArduino(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ESP32 Hardware & IoT Ingestion Gateway</h3>
              <p className="text-xs text-slate-400">HTTP REST Ingestion API & Firmware Specifications</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-950/20 text-xs">
          <button
            onClick={() => setActiveDocTab('curl')}
            className={`pb-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeDocTab === 'curl'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>HTTP POST API & cURL</span>
          </button>

          <button
            onClick={() => setActiveDocTab('arduino')}
            className={`pb-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeDocTab === 'arduino'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>ESP32 Arduino Firmware (.ino)</span>
          </button>

          <button
            onClick={() => setActiveDocTab('pinout')}
            className={`pb-3 font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeDocTab === 'pinout'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Sensor Pinout & Hardware</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[65vh] overflow-y-auto space-y-4">
          {/* TAB 1: cURL & API Schema */}
          {activeDocTab === 'curl' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold">Test Ingestion using cURL:</span>
                  <button
                    onClick={() => copyToClipboard(sampleCurl, 'curl')}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition"
                  >
                    {copiedCurl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCurl ? 'Copied!' : 'Copy cURL'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap">
                  {sampleCurl}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold">JSON Payload Schema:</span>
                  <button
                    onClick={() => copyToClipboard(sampleJson, 'json')}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied!' : 'Copy JSON'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {sampleJson}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Arduino Sketch Preview */}
          {activeDocTab === 'arduino' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Full firmware file located in <code className="text-emerald-400">backend/esp32_firmware_sample.ino</code>
                </span>
                <button
                  onClick={() => copyToClipboard(arduinoSnippet, 'arduino')}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition"
                >
                  {copiedArduino ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedArduino ? 'Copied Code!' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-200 overflow-x-auto">
                {arduinoSnippet}
              </pre>
            </div>
          )}

          {/* TAB 3: Pinout & Wiring */}
          {activeDocTab === 'pinout' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    DHT22 (Temperature & Humidity)
                  </div>
                  <p className="text-slate-400 text-[11px]">VCC: 3.3V | GND: GND | DATA: <b>GPIO 4</b></p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    HC-SR04 (Ultrasonic Water Level)
                  </div>
                  <p className="text-slate-400 text-[11px]">VCC: 5V | GND: GND | TRIG: <b>GPIO 5</b> | ECHO: <b>GPIO 18</b></p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400" />
                    MQ-135 (Air Quality Sensor)
                  </div>
                  <p className="text-slate-400 text-[11px]">VCC: 5V | GND: GND | AOUT: <b>GPIO 34 (ADC)</b></p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="font-bold text-white mb-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    MQ-2 (Combustible Smoke Sensor)
                  </div>
                  <p className="text-slate-400 text-[11px]">VCC: 5V | GND: GND | AOUT: <b>GPIO 35 (ADC)</b></p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
