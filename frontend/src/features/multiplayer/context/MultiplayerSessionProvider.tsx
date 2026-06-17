import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

import {
  createMultiplayerSocketService,
  type MultiplayerSocketService,
} from "../services/multiplayerSocketService";
import type {
  ConnectToRoomParams,
  MultiplayerActivePlayersResponseData,
  MultiplayerDirectMessage,
  MultiplayerPriceTickData,
  MultiplayerRegisterUserData,
  MultiplayerRoomFeatures,
  MultiplayerSocketState,
  MultiplayerTickData,
} from "../types/multiplayerTypes";
import { sanitizeMultiplayerToolToggles } from "../types/multiplayerTypes";
import type {
  GameEndRespPayload,
  OrderAction,
  OrderFilledPayload,
  OrderType,
  RegisterOrderResp,
} from "../../trading/types/tradingTypes";

const POLL_INTERVAL_MS = 4000;

const createMessageId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const readRoomFeaturesFromStartPayload = (
  payload: MultiplayerRegisterUserData
): MultiplayerRoomFeatures | null => {
  const payloadObj = payload as Record<string, unknown>;
  const hasNpcOrdersRaw = payloadObj?.has_npc_orders;
  const tools = payloadObj?.available_tools;
  const inferredHasNpcOrders =
    typeof hasNpcOrdersRaw === "boolean" ? hasNpcOrdersRaw : true;

  return {
    has_npc_orders: inferredHasNpcOrders,
    available_tools: sanitizeMultiplayerToolToggles(tools, inferredHasNpcOrders),
  };
};

const INITIAL_STATE: MultiplayerSocketState = {
  status: "idle",
  roomCode: null,
  userId: null,
  levelId: null,
  roomFeatures: null,
  host: null,
  isHost: false,
  players: [],
  privateMessages: [],
  gameStarted: false,
  error: null,
  notice: null,
  lastServerEvent: null,
  bootstrapPayload: null,
  latestPriceTick: null,
  latestTick: null,
  latestNoNpcOrderbookUpdate: null,
  latestOrderResponse: null,
  latestOrderFilled: null,
  latestGameOver: null,
};

type MultiplayerSessionContextValue = MultiplayerSocketState & {
  isConnected: boolean;
  connectToRoom: (params: ConnectToRoomParams) => void;
  disconnect: () => void;
  requestActivePlayers: () => void;
  startGame: () => void;
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
  clearError: () => void;
  clearNotice: () => void;
};

const MultiplayerSessionContext =
  createContext<MultiplayerSessionContextValue | null>(null);

function MultiplayerSessionProviderInner({
  children,
}: {
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const socketRef = useRef<MultiplayerSocketService | null>(null);
  const navigateRef = useRef(navigate);
  const locationPathRef = useRef(location.pathname);
  const roomCodeRef = useRef<string | null>(null);
  const [state, setState] = useState<MultiplayerSocketState>(INITIAL_STATE);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    locationPathRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    roomCodeRef.current = state.roomCode;
  }, [state.roomCode]);

  useEffect(() => {
    const socket = createMultiplayerSocketService();
    socketRef.current = socket;

    const handleOpen = () => {
      setState((prev) => ({
        ...prev,
        status: "connected",
        error: null,
      }));
    };

    const handleClose = () => {
      setState((prev) => ({
        ...prev,
        status: "closed",
      }));
    };

    const handleError = () => {
      setState((prev) => ({
        ...prev,
        status: "error",
      }));
    };

    const applyHostUpdate = (
      payload: { host?: string | null },
      eventName: string
    ) => {
      setState((prev) => ({
        ...prev,
        host:
          typeof payload.host === "string"
            ? payload.host
            : payload.host === null
              ? null
              : prev.host,
        isHost:
          typeof payload.host === "string"
            ? prev.userId === payload.host
            : payload.host === null
              ? false
              : prev.isHost,
        lastServerEvent: eventName,
      }));
    };

    const handleRegisterUser = (payload: MultiplayerRegisterUserData) => {
      const roomFeaturesFromPayload = readRoomFeaturesFromStartPayload(payload);
      setState((prev) => ({
        ...prev,
        bootstrapPayload: payload,
        roomFeatures: roomFeaturesFromPayload ?? prev.roomFeatures,
        notice: null,
      }));
      applyHostUpdate(payload, "register_user");
    };

    const handleStartResponse = (payload: { host?: string | null; msg?: string }) => {
      setState((prev) => ({
        ...prev,
        notice: typeof payload.msg === "string" ? payload.msg : prev.notice,
        lastServerEvent: "startResponse",
      }));
      applyHostUpdate(payload, "startResponse");
    };

    const handleActivePlayers = (payload: MultiplayerActivePlayersResponseData) => {
      const normalizedRoomFeatures =
        payload.room_features && typeof payload.room_features === "object"
          ? (() => {
              const hasNpcOrders =
                typeof payload.room_features?.has_npc_orders === "boolean"
                  ? payload.room_features.has_npc_orders
                  : true;
              return {
                has_npc_orders: hasNpcOrders,
                available_tools: sanitizeMultiplayerToolToggles(
                  payload.room_features.available_tools,
                  hasNpcOrders
                ),
              };
            })()
          : null;

      setState((prev) => ({
        ...prev,
        players: Array.isArray(payload.active_players)
          ? payload.active_players
          : prev.players,
        host:
          typeof payload.host === "string"
            ? payload.host
            : payload.host === null
              ? null
              : prev.host,
        isHost:
          typeof payload.host === "string"
            ? prev.userId === payload.host
            : payload.host === null
              ? false
              : prev.isHost,
        roomFeatures: normalizedRoomFeatures ?? prev.roomFeatures,
        lastServerEvent: "activePlayersResponse",
      }));
    };

    const handleDirectMessage = (payload: MultiplayerDirectMessage) => {
      const data =
        payload.data && typeof payload.data === "object"
          ? (payload.data as Record<string, unknown>)
          : null;
      const content =
        typeof data?.content === "string" ? data.content.trim() : "";
      if (!content) return;

      setState((prev) => ({
        ...prev,
        privateMessages: [
          ...prev.privateMessages,
          {
            id: createMessageId(),
            from: payload.from,
            to: prev.userId ?? "",
            content,
            timestamp: new Date().toISOString(),
          },
        ],
        lastServerEvent: "directMessage",
      }));
    };

    const handleGameStarted = () => {
      setState((prev) => ({
        ...prev,
        gameStarted: true,
        notice: "Session is live. Moving everyone into the trading room.",
        lastServerEvent: "game_start",
      }));

      const activeRoomCode = roomCodeRef.current ?? "";
      if (activeRoomCode.length === 0) return;
      const targetPath = `/multiplayer/trading/${encodeURIComponent(activeRoomCode)}`;
      if (locationPathRef.current !== targetPath) {
        navigateRef.current(targetPath);
      }
    };

    const handleNextTick = (payload: MultiplayerTickData) => {
      setState((prev) => ({
        ...prev,
        latestTick: payload,
        lastServerEvent: "next_tick",
      }));
    };

    const handleNoNpcOrderbookUpdate = (payload: MultiplayerTickData) => {
      setState((prev) => ({
        ...prev,
        latestNoNpcOrderbookUpdate: payload,
        lastServerEvent: "no_npc_orderbook_update",
      }));
    };

    const handlePriceTick = (payload: MultiplayerPriceTickData) => {
      setState((prev) => ({
        ...prev,
        latestPriceTick: payload,
        lastServerEvent: "price_tick",
      }));
    };

    const handleOrderResp = (payload: RegisterOrderResp) => {
      setState((prev) => ({
        ...prev,
        latestOrderResponse: payload,
        lastServerEvent: "registerOrderResponse",
      }));
    };

    const handleOrderFilled = (payload: OrderFilledPayload) => {
      setState((prev) => ({
        ...prev,
        latestOrderFilled: payload,
        lastServerEvent: "orderFilled",
      }));
    };

    const handleGameOver = (payload: GameEndRespPayload) => {
      setState((prev) => ({
        ...prev,
        latestGameOver: payload,
        lastServerEvent: "game_over",
      }));
    };

    const handleServerError = (payload: { event: string; error: string }) => {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: payload.error,
        lastServerEvent: payload.event,
      }));
    };

    socket.on("open", handleOpen);
    socket.on("close", handleClose);
    socket.on("error", handleError);
    socket.on("registerUser", handleRegisterUser);
    socket.on("startResponse", handleStartResponse);
    socket.on("activePlayers", handleActivePlayers);
    socket.on("directMessage", handleDirectMessage);
    socket.on("gameStarted", handleGameStarted);
    socket.on("nextTick", handleNextTick);
    socket.on("noNpcOrderbookUpdate", handleNoNpcOrderbookUpdate);
    socket.on("priceTick", handlePriceTick);
    socket.on("orderResp", handleOrderResp);
    socket.on("orderFilled", handleOrderFilled);
    socket.on("gameOver", handleGameOver);
    socket.on("serverError", handleServerError);

    return () => {
      socket.off("open", handleOpen);
      socket.off("close", handleClose);
      socket.off("error", handleError);
      socket.off("registerUser", handleRegisterUser);
      socket.off("startResponse", handleStartResponse);
      socket.off("activePlayers", handleActivePlayers);
      socket.off("directMessage", handleDirectMessage);
      socket.off("gameStarted", handleGameStarted);
      socket.off("nextTick", handleNextTick);
      socket.off("noNpcOrderbookUpdate", handleNoNpcOrderbookUpdate);
      socket.off("priceTick", handlePriceTick);
      socket.off("orderResp", handleOrderResp);
      socket.off("orderFilled", handleOrderFilled);
      socket.off("gameOver", handleGameOver);
      socket.off("serverError", handleServerError);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  useEffect(() => {
    const shouldPollConnectedRoom =
      state.status === "connected" &&
      !!state.roomCode;

    if (!shouldPollConnectedRoom) return;

    socketRef.current?.requestActivePlayers();
    const intervalId = window.setInterval(() => {
      socketRef.current?.requestActivePlayers();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [state.roomCode, state.status]);

  const connectToRoom = useCallback((params: ConnectToRoomParams) => {
    roomCodeRef.current = params.roomCode;
    setState((prev) => ({
      ...prev,
      status: "connecting",
      roomCode: params.roomCode,
      userId: params.userId,
      levelId: params.levelId?.trim() || null,
      roomFeatures: params.roomFeatures ?? null,
      host: null,
      isHost: false,
      players: [],
      privateMessages: [],
      gameStarted: false,
      error: null,
      notice: null,
      lastServerEvent: null,
      bootstrapPayload: null,
      latestPriceTick: null,
      latestTick: null,
      latestNoNpcOrderbookUpdate: null,
      latestOrderResponse: null,
      latestOrderFilled: null,
      latestGameOver: null,
    }));
    socketRef.current?.connect(params);
  }, []);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    setState({
      ...INITIAL_STATE,
      status: "closed",
    });
    if (locationPathRef.current !== "/multiplayer") {
      navigate("/multiplayer", { replace: true });
    }
  }, [navigate]);

  const requestActivePlayers = useCallback(() => {
    socketRef.current?.requestActivePlayers();
  }, []);

  const startGame = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      notice: null,
    }));
    socketRef.current?.sendStartGame();
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
    }));
  }, []);

  const sendRegisterOrder = useCallback(
    (params: {
      ticker: string;
      orderType: OrderType;
      action: OrderAction;
      qty: number;
      price?: number;
      stopPrice?: number;
    }) => {
      socketRef.current?.sendRegisterOrder(params);
    },
    []
  );

  const sendPrivateMessage = useCallback(
    (params: {
      recipientId: string;
      content: string;
    }) => {
      const senderId = state.userId?.trim();
      const recipientId = params.recipientId.trim();
      const content = params.content.trim();
      if (!senderId || !recipientId || !content) return;

      setState((prev) => ({
        ...prev,
        privateMessages: [
          ...prev.privateMessages,
          {
            id: createMessageId(),
            from: senderId,
            to: recipientId,
            content,
            timestamp: new Date().toISOString(),
          },
        ],
      }));

      socketRef.current?.sendPrivateMessage({
        recipientId,
        content,
      });
    },
    [state.userId]
  );

  const sendFakeNews = useCallback(
    (params: {
      ticker: string;
      content: string;
      delay: number;
    }) => {
      const senderId = state.userId?.trim();
      const ticker = params.ticker.trim().toUpperCase();
      const content = params.content.trim();
      const delay = Number.isFinite(params.delay)
        ? Math.max(1, Math.floor(params.delay))
        : 1;
      if (!senderId || !ticker || !content) return;

      socketRef.current?.sendFakeNews({
        ticker,
        content,
        delay,
      });
    },
    [state.userId]
  );

  const clearNotice = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notice: null,
    }));
  }, []);

  const value = useMemo<MultiplayerSessionContextValue>(
    () => ({
      ...state,
      isConnected: state.status === "connected",
      connectToRoom,
      disconnect,
      requestActivePlayers,
      startGame,
      sendRegisterOrder,
      sendPrivateMessage,
      sendFakeNews,
      clearError,
      clearNotice,
    }),
    [
      state,
      connectToRoom,
      disconnect,
      requestActivePlayers,
      startGame,
      sendRegisterOrder,
      sendPrivateMessage,
      sendFakeNews,
      clearError,
      clearNotice,
    ]
  );

  return (
    <MultiplayerSessionContext.Provider value={value}>
      {children ?? <Outlet />}
    </MultiplayerSessionContext.Provider>
  );
}

export function MultiplayerSessionProvider() {
  return <MultiplayerSessionProviderInner />;
}

export function useMultiplayerSession() {
  const context = useContext(MultiplayerSessionContext);
  if (!context) {
    throw new Error(
      "useMultiplayerSession must be used within MultiplayerSessionProvider"
    );
  }
  return context;
}
