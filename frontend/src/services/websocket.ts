import { useEffect, useRef, useState, useCallback } from 'react';
import { SensorReading, Alert } from '../types';

interface WebSocketMessage {
  event_type: 'TELEMETRY_UPDATE' | 'HAZARD_ALERT' | 'CONNECTED';
  reading?: SensorReading;
  alert?: Alert;
  message?: string;
}

interface UseWebSocketOptions {
  onTelemetry?: (reading: SensorReading) => void;
  onAlert?: (alert: Alert) => void;
  autoReconnect?: boolean;
}

export function useHazardWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<Date | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const connect = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '5173' ? `${window.location.hostname}:8000` : window.location.host;
      const wsUrl = `${protocol}//${host}/ws/live`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[WS] Connected to live hazard stream:', wsUrl);
      };

      ws.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          setLastMessageTime(new Date());

          if (data.event_type === 'TELEMETRY_UPDATE' && data.reading) {
            optionsRef.current.onTelemetry?.(data.reading);
          } else if (data.event_type === 'HAZARD_ALERT' && data.alert) {
            optionsRef.current.onAlert?.(data.alert);
          }
        } catch (err) {
          // Heartbeat string
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (optionsRef.current.autoReconnect !== false) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('[WS] Attempting reconnect...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.warn('[WS] Socket error:', error);
        ws.close();
      };
    } catch (err) {
      console.error('[WS] Connection exception:', err);
    }
  }, []);

  useEffect(() => {
    connect();

    const pingInterval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send('ping');
      }
    }, 15000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  return { isConnected, lastMessageTime };
}
