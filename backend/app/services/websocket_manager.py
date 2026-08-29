import json
import logging
from typing import List, Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    """Manages active WebSocket connections for live telemetry and hazard broadcasts."""
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast a message dictionary as JSON to all connected clients."""
        if not self.active_connections:
            return

        dead_connections = set()
        data_text = json.dumps(message, default=str)

        for connection in self.active_connections:
            try:
                await connection.send_text(data_text)
            except Exception as e:
                logger.warning(f"Error sending message to client: {e}")
                dead_connections.add(connection)

        for dead in dead_connections:
            self.active_connections.discard(dead)

ws_manager = ConnectionManager()
