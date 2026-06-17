import { useCallback, useEffect } from "react";

import type { InfoPopupType } from "../components/TradingInfoPopups";
import type {
  OrderAction,
  GameEndRespPayload,
  NextTickRespPayload,
  StartRespPayload,
  OrderType,
} from "../types/tradingTypes";
import { useTradingSessionState } from "./useTradingSessionState";
import { useMultiplayerSocket } from "../../multiplayer/hooks/useMultiplayerSocket";
import {
  sanitizeMultiplayerToolToggles,
} from "../../multiplayer/types/multiplayerTypes";

interface UseMultiplayerGameParams {
  moduleParam?: string;
  levelParam?: string;
  levelIdOverride?: string;
  sessionToken?: string | number;
  userId?: string;
  isResuming: boolean;
  clearTutorials: () => void;
  setPopupQueue: (order: InfoPopupType[]) => void;
}

export function useMultiplayerGame({
  userId,
  isResuming,
  clearTutorials,
  setPopupQueue,
}: UseMultiplayerGameParams) {
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
  const { setGameStarted, setIsConnecting } = stateActions;

  const multiplayer = useMultiplayerSocket();

  useEffect(() => {
    resetState();
  }, [resetState, multiplayer.roomCode]);

  useEffect(() => {
    if (!multiplayer.bootstrapPayload) return;
    handleStartPayload(multiplayer.bootstrapPayload as StartRespPayload);
  }, [handleStartPayload, multiplayer.bootstrapPayload]);

  useEffect(() => {
    if (!multiplayer.latestTick) return;
    handleNextTickPayload(multiplayer.latestTick as NextTickRespPayload);
  }, [handleNextTickPayload, multiplayer.latestTick]);

  useEffect(() => {
    if (!multiplayer.latestNoNpcOrderbookUpdate) return;
    // Can reuse same handler since payload structure is the same for now, just different event type
    handleNextTickPayload(
      multiplayer.latestNoNpcOrderbookUpdate as NextTickRespPayload
    );
  }, [handleNextTickPayload, multiplayer.latestNoNpcOrderbookUpdate]);

  useEffect(() => {
    if (!multiplayer.latestPriceTick) return;
    handlePriceTickPayload(multiplayer.latestPriceTick);
  }, [handlePriceTickPayload, multiplayer.latestPriceTick]);

  useEffect(() => {
    if (!multiplayer.latestOrderResponse) return;
    handleOrderResponse(multiplayer.latestOrderResponse);
  }, [handleOrderResponse, multiplayer.latestOrderResponse]);

  useEffect(() => {
    if (!multiplayer.latestOrderFilled) return;
    handleOrderFilled(multiplayer.latestOrderFilled);
  }, [handleOrderFilled, multiplayer.latestOrderFilled]);

  useEffect(() => {
    if (!multiplayer.latestGameOver) return;
    handleGameOverPayload(multiplayer.latestGameOver as GameEndRespPayload);
  }, [handleGameOverPayload, multiplayer.latestGameOver]);

  useEffect(() => {
    if (!multiplayer.gameStarted) return;
    setGameStarted(true);
    setIsConnecting(false);
  }, [multiplayer.gameStarted, setGameStarted, setIsConnecting]);

  const sendRegisterOrder = useCallback(
    (params: {
      qty: number;
      orderType: OrderType;
      action: OrderAction;
      price?: number;
      stopPrice?: number;
    }) => {
      if (!refs.selectedTickerRef.current) return;
      if (!multiplayer.isConnected) return;
      multiplayer.sendRegisterOrder({
        ticker: refs.selectedTickerRef.current,
        orderType: params.orderType,
        action: params.action,
        qty: params.qty,
        price: params.price,
        stopPrice: params.stopPrice,
      });
    },
    [multiplayer, refs.selectedTickerRef]
  );

  const bootstrapHasNpcOrders = (
    multiplayer.bootstrapPayload as { has_npc_orders?: unknown } | null
  )?.has_npc_orders;
  const fallbackHasNpcOrders =
    typeof bootstrapHasNpcOrders === "boolean" ? bootstrapHasNpcOrders : true;
  const resolvedRoomFeatures = multiplayer.roomFeatures ?? {
    has_npc_orders: fallbackHasNpcOrders,
    available_tools: sanitizeMultiplayerToolToggles(
      sessionState.availableTools,
      fallbackHasNpcOrders
    ),
  };

  return {
    sessionState,
    actions: {
      ...stateActions,
      sendNextTick: () => {},
      sendRegisterOrder,
    },
    capabilities: {
      ...stateController.capabilities,
      canManualAdvance: false,
    },
    multiplayerState: {
      roomCode: multiplayer.roomCode,
      userId: userId ?? multiplayer.userId ?? "guest",
      roomFeatures: resolvedRoomFeatures,
      players: multiplayer.players,
      privateMessages: multiplayer.privateMessages,
    },
    multiplayerActions: {
      requestActivePlayers: multiplayer.requestActivePlayers,
      sendPrivateMessage: multiplayer.sendPrivateMessage,
      sendFakeNews: multiplayer.sendFakeNews,
    },
  };
}
