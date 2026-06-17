import asyncio
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketState
from utils.constants import BROADCAST_USER_ID


class ConnectionManager:

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.host_user_id: str | None = None

    def set_host(self, user_id: str):
        self.host_user_id = user_id

    def register_connection(self, websocket: WebSocket, user_id: str):
        self.active_connections[user_id] = websocket

    def remove_connection(self, user_id: str):
        self.active_connections.pop(user_id, None)
        if self.host_user_id == user_id:
            self.host_user_id = next(iter(self.active_connections), None)

    def send_message(self, from_user_id: str, to_user_id: str, message: dict[str, Any]):
        if (ws := self.active_connections.get(to_user_id)) is None:
            return
        if ws.client_state != WebSocketState.CONNECTED:
            return
        asyncio.create_task(ws.send_json({"from": from_user_id, "data": message}))

    def user_broadcast(self, from_user_id: str, message: dict[str, Any]):
        for user_id in self.active_connections.keys():
            self.send_message(from_user_id, user_id, message)

    def server_send(self, event: str, to_user_id: str, message: dict[str, Any]):
        print(f"Server sending event {event} to user {to_user_id}")
        if to_user_id == BROADCAST_USER_ID:
            self.server_broadcast(event, message)
            return
        if (ws := self.active_connections.get(to_user_id)) is None:
            return
        if ws.client_state != WebSocketState.CONNECTED:
            return
        asyncio.create_task(
            ws.send_json({"from": "server", "event": event, "data": message})
        )

    def server_broadcast(self, event: str, message: dict[str, Any]):
        for user_id in self.active_connections.keys():
            self.server_send(event, user_id, message)
