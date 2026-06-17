import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { auth } from "../../../services/firebase";
import { toast } from "../../../shared/ui/toast/Toast";
import { createGameSocket } from "../services/gameSocket";
import { resolveWsUrl } from "../services/tradingPayloadMappers";
import type { InfoPopupType } from "../components/TradingInfoPopups";
import type { OrderAction, OrderType, StartRespPayload } from "../types/tradingTypes";
import { useTradingSessionState } from "./useTradingSessionState";

// Custom WS close codes — server-side defined in backend/services/game_service/router/router.py.
const WS_CLOSE_LEVEL_LOCKED = 4403;

interface UseSinglePlayerGameParams {
  moduleParam?: string;
  levelParam?: string;
  levelIdOverride?: string;
  sessionToken?: string | number;
  userId?: string;
  isResuming: boolean;
  clearTutorials: () => void;
  setPopupQueue: (order: InfoPopupType[]) => void;
}

export function useSinglePlayerGame({
  moduleParam,
  levelParam,
  levelIdOverride,
  sessionToken,
  userId,
  isResuming,
  clearTutorials,
  setPopupQueue,
}: UseSinglePlayerGameParams) {
  const isManualTickRef = useRef<boolean>(true);
  const wsRef = useRef<ReturnType<typeof createGameSocket> | null>(null);
  const stateController = useTradingSessionState({
    isResuming,
    clearTutorials,
    setPopupQueue,
  });
  const {
    sessionState,
    actions: stateActions,
    refs,
    resetState,
    handleStartPayload,
    handleNextTickPayload,
    handlePriceTickPayload,
    handleGameOverPayload,
    handleOrderResponse,
    handleOrderFilled,
  } = stateController;
  const { setIsConnecting, setGameStarted } = stateActions;
  const navigate = useNavigate();

  useEffect(() => {
    const socket = createGameSocket(resolveWsUrl());
    wsRef.current = socket;
    resetState();

    // Belt-and-suspenders for the URL-bypass case: if the FE gate is
    // stale (rare — user opened the tab before completing the gating
    // level, then state diverged), the BE rejects with close 4403 and
    // emits `levelLocked` before close. Either signal triggers the
    // same UX: toast + bounce back to the level-select page.
    const isPuzzleMode = !moduleParam;
    const bounceToLevelSelect = (errorMessage: string) => {
      toast({ variant: "danger", message: errorMessage });
      navigate(isPuzzleMode ? "/puzzleMode" : "/adventureMode", { replace: true });
    };
    socket.on("close", (event) => {
      if (event.code === WS_CLOSE_LEVEL_LOCKED) {
        bounceToLevelSelect("Level is locked. Complete prior levels first.");
      }
    });

    socket.on("open", async () => {
      const isPuzzleMode = !moduleParam;
      const levelId = isPuzzleMode
        ? levelIdOverride && levelIdOverride.trim().length > 0
          ? levelIdOverride.trim()
          : (levelParam ?? "").startsWith("puzzle-")
            ? (levelParam as string)
            : `puzzle-${Number(levelParam)}`
        : `module-${Number(moduleParam)}.${Number(levelParam)}`;
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          socket.close();
          return;
        }
        socket.sendAuth(token);
        socket.sendStart({
          levelId,
          mode: isPuzzleMode ? "Puzzle" : "Tutorial",
        });
      } catch (err) {
        console.error("[ws] failed to fetch Firebase ID token", err);
        socket.close();
      }
    });

    socket.connect();
    socket.on("startResp", (payload: StartRespPayload) => {
      const isManualTickFromPayload = payload?.tick_mode === "manual";
      const requiresManualStart =
        payload?.tick_mode === "auto" && payload?.manual_start === true;
      isManualTickRef.current = !!isManualTickFromPayload;
      handleStartPayload(payload);
      if (isManualTickRef.current) {
        const preloadedTickCount =
          typeof payload.preloaded_ticks === "number"
            ? payload.preloaded_ticks
            : Array.isArray(payload.preloaded_tick_data)
              ? payload.preloaded_tick_data.length
              : 0;
        setIsConnecting(false);
        setGameStarted(true);
        if (preloadedTickCount <= 0) {
          socket.sendNextTick();
        }
      } else {
        setIsConnecting(false);
        setGameStarted(!requiresManualStart);
      }
    });
    socket.on("nextTickResp", handleNextTickPayload);
    socket.on("priceTick", handlePriceTickPayload);
    socket.on("gameOverResp", handleGameOverPayload);
    socket.on("orderResp", handleOrderResponse);
    socket.on("orderFilled", handleOrderFilled);

    return () => {
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
    };
  }, [
    handleGameOverPayload,
    handleNextTickPayload,
    handleOrderFilled,
    handleOrderResponse,
    handlePriceTickPayload,
    handleStartPayload,
    isResuming,
    levelParam,
    moduleParam,
    navigate,
    resetState,
    sessionToken,
    setGameStarted,
    setIsConnecting,
    userId,
    levelIdOverride,
  ]);

  const sendNextTick = useCallback(() => {
    if (!wsRef.current || !wsRef.current.isOpen()) return;
    wsRef.current.sendNextTick();
  }, []);

  const sendStartTicking = useCallback(() => {
    if (!wsRef.current || !wsRef.current.isOpen()) return;
    wsRef.current.sendStartTicking();
  }, []);

  const sendRegisterOrder = useCallback(
    (params: {
      qty: number;
      orderType: OrderType;
      action: OrderAction;
      price?: number;
      stopPrice?: number;
    }) => {
      if (!wsRef.current || !wsRef.current.isOpen()) return;
      if (!refs.selectedTickerRef.current) return;
      wsRef.current.sendRegisterOrder({
        ticker: refs.selectedTickerRef.current,
        orderType: params.orderType,
        action: params.action,
        qty: params.qty,
        price: params.price,
        stopPrice: params.stopPrice,
      });
    },
    [refs.selectedTickerRef]
  );

  return {
    sessionState,
    actions: {
      ...stateActions,
      sendNextTick,
      sendStartTicking,
      sendRegisterOrder,
    },
    capabilities: {
      ...stateController.capabilities,
      canManualAdvance: sessionState.isManualTickMode,
    },
  };
}
