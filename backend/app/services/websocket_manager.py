from typing import List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        """
        Accepts a connection and registers it in memory.
        """
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"[WebSocket] Client connected. Active sessions: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """
        Deregisters a disconnected WebSocket.
        """
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"[WebSocket] Client disconnected. Active sessions: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """
        Sends a direct JSON payload to a single socket.
        """
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"[WebSocket] Error sending personal message: {e}")
            self.disconnect(websocket)

    async def broadcast(self, message: dict):
        """
        Broadcasts a JSON payload to all active connections.
        """
        closed_sockets = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"[WebSocket] Error broadcasting to connection: {e}")
                closed_sockets.append(connection)

        # Cleanup dead sockets
        for dead_socket in closed_sockets:
            self.disconnect(dead_socket)

# Singleton manager instance
websocket_manager = ConnectionManager()
