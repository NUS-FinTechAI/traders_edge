import { auth } from "../../../services/firebase";
import {
  DEFAULT_MULTIPLAYER_LEVEL_ID,
  MULTIPLAYER_MODE,
  type ConnectToRoomParams,
  type MultiplayerActivePlayersResponseData,
  type MultiplayerDirectMessage,
  type MultiplayerEnvelope,
  type MultiplayerPriceTickData,
  type MultiplayerRegisterUserData,
  type MultiplayerServerError,
  type MultiplayerStartData,
  type MultiplayerStartResponseData,
  type MultiplayerTickData,
} from "../types/multiplayerTypes";
import type {
  OrderAction,
  OrderType,
  RegisterOrderResp,
} from "../../trading/types/tradingTypes";
import type {
  GameEndRespPayload,
  OrderFilledPayload,
} from "../../trading/types/tradingTypes";

type MultiplayerSocketEventMap = {
  open: () => void;
  close: (event: CloseEvent) => void;
  error: (event: Event) => void;
  startResponse: (payload: MultiplayerStartResponseData) => void;
  registerUser: (payload: MultiplayerRegisterUserData) => void;
  activePlayers: (payload: MultiplayerActivePlayersResponseData) => void;
  gameStarted: (payload: Record<string, unknown>) => void;
  nextTick: (payload: MultiplayerTickData) => void;
  noNpcOrderbookUpdate: (payload: MultiplayerTickData) => void;
  priceTick: (payload: MultiplayerPriceTickData) => void;
  orderResp: (payload: RegisterOrderResp) => void;
  orderFilled: (payload: OrderFilledPayload) => void;
  gameOver: (payload: GameEndRespPayload) => void;
  serverError: (payload: MultiplayerServerError) => void;
  directMessage: (payload: MultiplayerDirectMessage) => void;
  rawMessage: (payload: unknown) => void;
};

type MultiplayerSocketEventName = keyof MultiplayerSocketEventMap;

export interface MultiplayerSocketService {
  connect: (params: ConnectToRoomParams) => void;
  disconnect: () => void;
  isOpen: () => boolean;
  requestActivePlayers: () => void;
  sendStartGame: () => void;
  sendRegisterOrder: (params: {
    ticker: string;
    orderType: OrderType;
    action: OrderAction;
    qty: number;
    price?: number;
    stopPrice?: number;
  }) => void;
  sendPrivateMessage: (params: {
    recipientId: string;
    content: string;
  }) => void;
  sendFakeNews: (params: {
    ticker: string;
    content: string;
    delay: number;
  }) => void;
  on: <K extends MultiplayerSocketEventName>(
    event: K,
    handler: MultiplayerSocketEventMap[K]
  ) => void;
  off: <K extends MultiplayerSocketEventName>(
    event: K,
    handler: MultiplayerSocketEventMap[K]
  ) => void;
}

const resolveMultiplayerWsBase = (): string => {
  const envWsUrl = import.meta.env.VITE_WS_URL;
  if (envWsUrl && envWsUrl.trim().length > 0) {
    try {
      const parsed = new URL(envWsUrl);
      const protocol = parsed.protocol === "https:" ? "wss:" : parsed.protocol;
      return `${protocol}//${parsed.host}`;
    } catch {
      // ignore malformed env and fall back
    }
  }

  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && envApiUrl.trim().length > 0) {
    try {
      const parsed = new URL(envApiUrl);
      const protocol = parsed.protocol === "https:" ? "wss:" : "ws:";
      return `${protocol}//${parsed.host}`;
    } catch {
      // ignore malformed env and fall back
    }
  }

  if (typeof window !== "undefined" && window.location?.hostname) {
    return `ws://${window.location.hostname}:8000`;
  }

  return "ws://localhost:8000";
};

export function createMultiplayerSocketService(): MultiplayerSocketService {
  let ws: WebSocket | null = null;
  let userId: string | null = null;
  let levelId: string = DEFAULT_MULTIPLAYER_LEVEL_ID;

  const listeners: {
    [K in MultiplayerSocketEventName]: Set<MultiplayerSocketEventMap[K]>;
  } = {
    open: new Set(),
    close: new Set(),
    error: new Set(),
    startResponse: new Set(),
    registerUser: new Set(),
    activePlayers: new Set(),
    gameStarted: new Set(),
    nextTick: new Set(),
    noNpcOrderbookUpdate: new Set(),
    priceTick: new Set(),
    orderResp: new Set(),
    orderFilled: new Set(),
    gameOver: new Set(),
    serverError: new Set(),
    directMessage: new Set(),
    rawMessage: new Set(),
  };

  const emit = <K extends MultiplayerSocketEventName>(
    eventName: K,
    payload?: Parameters<MultiplayerSocketEventMap[K]>[0]
  ) => {
    listeners[eventName].forEach((handler) => {
      if (payload === undefined) {
        (handler as () => void)();
      } else {
        (handler as (value: typeof payload) => void)(payload);
      }
    });
  };

  const isOpen = () => ws !== null && ws.readyState === WebSocket.OPEN;

  const send = (payload: unknown) => {
    if (!isOpen()) return;
    ws!.send(JSON.stringify(payload));
  };

  const buildStartData = (): MultiplayerStartData => ({
    levelId,
    mode: MULTIPLAYER_MODE,
  });

  const sendAuth = (token: string) => {
    send({ event: "auth", data: { token } });
  };

  const sendStart = () => {
    send({ event: "start", data: buildStartData() });
  };

  const requestActivePlayers = () => {
    send({ event: "activePlayers", data: {} });
  };

  const sendStartGame = () => {
    sendStart();
  };

  const sendRegisterOrder = (params: {
    ticker: string;
    orderType: OrderType;
    action: OrderAction;
    qty: number;
    price?: number;
    stopPrice?: number;
  }) => {
    send({
      event: "registerOrder",
      data: {
        ticker: params.ticker,
        orderType: params.orderType,
        action: params.action,
        qty: params.qty,
        ...(typeof params.price === "number" ? { price: params.price } : {}),
        ...(typeof params.stopPrice === "number"
          ? { stopPrice: params.stopPrice }
          : {}),
      },
    });
  };

  const sendPrivateMessage = (params: {
    recipientId: string;
    content: string;
  }) => {
    // senderId is no longer sent — server stamps it from the bound UID.
    send({
      event: "privateMessage",
      data: {
        recipientId: params.recipientId,
        content: params.content,
      },
    });
  };

  const sendFakeNews = (params: {
    ticker: string;
    content: string;
    delay: number;
  }) => {
    send({
      event: "fakeNews",
      data: {
        ticker: params.ticker,
        content: params.content,
        delay: params.delay,
      },
    });
  };

  const disconnect = () => {
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close();
    }
    ws = null;
  };

  const connect = (params: ConnectToRoomParams) => {
    const roomCode = params.roomCode.trim();
    if (roomCode.length === 0) {
      emit("serverError", {
        event: "connect",
        error: "Room code is required",
      });
      return;
    }

    userId = params.userId.trim();
    levelId = params.levelId?.trim() || DEFAULT_MULTIPLAYER_LEVEL_ID;

    if (userId.length === 0) {
      emit("serverError", {
        event: "connect",
        error: "User ID is required",
      });
      return;
    }

    if (
      ws &&
      (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const baseUrl = resolveMultiplayerWsBase();
    const socketUrl = `${baseUrl}/game/multiplayer/ws/${encodeURIComponent(
      roomCode
    )}`;
    ws = new WebSocket(socketUrl);

    ws.addEventListener("open", async () => {
      emit("open");
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          emit("serverError", {
            event: "connect",
            error: "Not signed in",
          });
          ws?.close();
          return;
        }
        sendAuth(token);
        sendStart();
        requestActivePlayers();
      } catch (err) {
        emit("serverError", {
          event: "connect",
          error: err instanceof Error ? err.message : "Failed to authenticate",
        });
        ws?.close();
      }
    });

    ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data) as MultiplayerEnvelope<unknown>;
        emit("rawMessage", msg);

        const eventName = typeof msg.event === "string" ? msg.event : null;

        if (eventName === "register_user") {
          emit(
            "registerUser",
            (msg.data as MultiplayerRegisterUserData | undefined) ?? {}
          );
          return;
        }

        if (eventName === "startResponse") {
          emit(
            "startResponse",
            (msg.data as MultiplayerStartResponseData | undefined) ?? {}
          );
          return;
        }

        if (eventName === "activePlayersResponse") {
          const payload =
            (msg.data as MultiplayerActivePlayersResponseData | undefined) ?? {};
          emit("activePlayers", {
            active_players: Array.isArray(payload.active_players)
              ? payload.active_players
              : [],
            active_player_names:
              payload.active_player_names &&
              typeof payload.active_player_names === "object"
                ? payload.active_player_names
                : undefined,
            host:
              typeof payload.host === "string"
                ? payload.host
                : payload.host === null
                  ? null
                  : undefined,
            host_name:
              typeof payload.host_name === "string"
                ? payload.host_name
                : payload.host_name === null
                  ? null
                  : undefined,
            room_features:
              payload.room_features && typeof payload.room_features === "object"
                ? payload.room_features
                : undefined,
          });
          return;
        }

        if (eventName === "game_start") {
          emit(
            "gameStarted",
            (msg.data as Record<string, unknown> | undefined) ?? {}
          );
          return;
        }

        if (eventName === "next_tick") {
          emit("nextTick", (msg.data as MultiplayerTickData | undefined) ?? {});
          return;
        }

        if (eventName === "no_npc_orderbook_update") {
          emit(
            "noNpcOrderbookUpdate",
            (msg.data as MultiplayerTickData | undefined) ?? {}
          );
          return;
        }

        if (eventName === "price_tick") {
          emit(
            "priceTick",
            (msg.data as MultiplayerPriceTickData | undefined) ?? {}
          );
          return;
        }

        if (eventName === "registerOrderResponse") {
          emit(
            "orderResp",
            (msg.data as RegisterOrderResp | undefined) ?? {
              result: "FAIL",
              order_id: "",
              reason: "Unknown multiplayer order response",
            }
          );
          return;
        }

        if (eventName === "orderFilled") {
          emit(
            "orderFilled",
            (msg.data as OrderFilledPayload | undefined) ??
              ({} as OrderFilledPayload)
          );
          return;
        }

        if (eventName === "game_over") {
          emit(
            "gameOver",
            (msg.data as GameEndRespPayload | undefined) ?? ({} as GameEndRespPayload)
          );
          return;
        }

        if (eventName && eventName.endsWith("Error")) {
          const payload = (msg.data as Record<string, unknown> | undefined) ?? {};
          emit("serverError", {
            event: eventName,
            error:
              typeof payload.error === "string"
                ? payload.error
                : "Unknown multiplayer socket error",
            raw: msg.data,
          });
          return;
        }

        if (!eventName && typeof msg.from === "string" && msg.from !== "server") {
          emit("directMessage", {
            from: msg.from,
            data: msg.data,
          });
        }
      } catch {
        emit("serverError", {
          event: "parse",
          error: "Failed to parse multiplayer socket message",
        });
      }
    });

    ws.addEventListener("error", (event) => {
      emit("error", event);
    });

    ws.addEventListener("close", (event) => {
      emit("close", event);
      ws = null;
    });
  };

  const on = <K extends MultiplayerSocketEventName>(
    event: K,
    handler: MultiplayerSocketEventMap[K]
  ) => {
    listeners[event].add(handler as MultiplayerSocketEventMap[K]);
  };

  const off = <K extends MultiplayerSocketEventName>(
    event: K,
    handler: MultiplayerSocketEventMap[K]
  ) => {
    listeners[event].delete(handler as MultiplayerSocketEventMap[K]);
  };

  return {
    connect,
    disconnect,
    isOpen,
    requestActivePlayers,
    sendStartGame,
    sendRegisterOrder,
    sendPrivateMessage,
    sendFakeNews,
    on,
    off,
  };
}
