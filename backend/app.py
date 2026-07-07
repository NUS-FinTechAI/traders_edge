import json
import os

from config import clean_up, start_up
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services import (
    game_router,
    market_data_service_router,
    progression_router,
    user_router,
)

# TODO:
# Add error handling
# Improve game state checking (ie remove all the assert)

DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]


def _parse_allowed_origins(raw_origins):
    if not raw_origins:
        return DEFAULT_ALLOWED_ORIGINS

    raw_origins = raw_origins.strip()
    if not raw_origins:
        return DEFAULT_ALLOWED_ORIGINS

    if raw_origins.startswith("["):
        try:
            origins = json.loads(raw_origins)
        except json.JSONDecodeError as exc:
            raise ValueError("ALLOWED_ORIGINS must be a JSON array or comma-separated list") from exc

        if not isinstance(origins, list) or not all(
            isinstance(origin, str) for origin in origins
        ):
            raise ValueError("ALLOWED_ORIGINS JSON value must be a list of strings")

        return [origin.strip() for origin in origins if origin.strip()]

    return [
        origin.strip().strip("\"'")
        for origin in raw_origins.split(",")
        if origin.strip().strip("\"'")
    ]


class Server:
    def __init__(self):
        self._app = FastAPI(title="Trader's Edge")
        self.register_debug_routes()
        self.register_cors()
        self.register_start_up_handler()
        self.register_routes()
        self.register_shut_down_handler()

    def register_debug_routes(self):
        @self._app.get("/ping")
        def pong():
            return "pong"

    def register_cors(self):
        origins = _parse_allowed_origins(os.getenv("ALLOWED_ORIGINS"))
        self._app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    def register_start_up_handler(self):
        print("Registering startup handlers")
        self._app.add_event_handler("startup", lambda: start_up())

    def register_shut_down_handler(self):
        print("Registering shutdown handlers")
        self._app.add_event_handler("shutdown", clean_up)

    def register_routes(self):
        self._app.include_router(market_data_service_router)
        self._app.include_router(game_router)
        self._app.include_router(progression_router)
        self._app.include_router(user_router)


app = Server()._app
