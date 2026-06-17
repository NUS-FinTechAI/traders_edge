import type {
  GameEndRespPayload,
  OrderFilledPayload,
  RegisterOrderResp,
} from "../../trading/types/tradingTypes";

export const MULTIPLAYER_MODE = "Multiplayer" as const;
export const DEFAULT_MULTIPLAYER_LEVEL_ID = "multiplayer-1";

export const MULTIPLAYER_TOOL_KEYS = [
  "news",
  "market_order",
  "short_selling",
  "limit_order",
  "stop_order",
  "stop_limit_order",
  "bid_ask_spread",
  "moving_average",
  "exponential_moving_average",
  "interest_rate_panel",
  "inflation_panel",
  "drawdown_panel",
  "portfolio_allocation_panel",
  "sector_exposure_panel",
  "fundamentals_panel",
  "correlation_panel",
  "beta_volatility_panel",
  "benchmark_panel",
  "rebalancing_prompt",
  "fake_news",
  "private_chat",
] as const;

export type MultiplayerToolKey = (typeof MULTIPLAYER_TOOL_KEYS)[number];

export type MultiplayerToolToggles = Record<MultiplayerToolKey, boolean>;

export const DEFAULT_MULTIPLAYER_TOOL_TOGGLES: MultiplayerToolToggles = {
  news: true,
  market_order: true,
  short_selling: true,
  limit_order: true,
  stop_order: true,
  stop_limit_order: true,
  bid_ask_spread: true,
  moving_average: true,
  exponential_moving_average: true,
  interest_rate_panel: true,
  inflation_panel: true,
  drawdown_panel: true,
  portfolio_allocation_panel: true,
  sector_exposure_panel: true,
  fundamentals_panel: true,
  correlation_panel: true,
  beta_volatility_panel: true,
  benchmark_panel: true,
  rebalancing_prompt: true,
  fake_news: true,
  private_chat: true,
};

export const sanitizeMultiplayerToolToggles = (
  raw: unknown,
  hasNpcOrders: boolean
): MultiplayerToolToggles => {
  const next: MultiplayerToolToggles = { ...DEFAULT_MULTIPLAYER_TOOL_TOGGLES };
  if (raw && typeof raw === "object") {
    const candidate = raw as Record<string, unknown>;
    for (const key of MULTIPLAYER_TOOL_KEYS) {
      if (key === "bid_ask_spread") continue;
      if (typeof candidate[key] === "boolean") {
        next[key] = candidate[key] as boolean;
      }
    }
  }

  next.bid_ask_spread = true;
  if (!hasNpcOrders) {
    next.market_order = false;
    next.limit_order = true;
  }

  return next;
};

export interface MultiplayerRoomFeatures {
  has_npc_orders: boolean;
  available_tools: MultiplayerToolToggles;
}

export type MultiplayerSocketStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "closed"
  | "error";

export interface ConnectToRoomParams {
  roomCode: string;
  userId: string;
  levelId?: string;
  roomFeatures?: MultiplayerRoomFeatures | null;
}

export interface MultiplayerStartData {
  // userId is no longer sent on the wire — server stamps it from the
  // verified Firebase token. Kept locally only for client bookkeeping.
  levelId: string;
  mode: typeof MULTIPLAYER_MODE;
}

export interface MultiplayerEnvelope<TData = unknown> {
  from?: string;
  event?: string;
  data?: TData;
}

export interface MultiplayerStartResponseData {
  msg?: string;
  host?: string | null;
}

export interface MultiplayerRegisterUserData {
  host?: string | null;
  [key: string]: unknown;
}

export interface MultiplayerTickData {
  [key: string]: unknown;
}

export interface MultiplayerPriceTickData {
  price?: number;
  [key: string]: unknown;
}

export interface MultiplayerActivePlayersResponseData {
  // Raw UIDs (Firebase, 28 chars). Useful for identity comparisons; for
  // display use `active_player_names`.
  active_players?: string[];
  active_player_names?: Record<string, string>;
  host?: string | null;
  host_name?: string | null;
  room_features?: MultiplayerRoomFeatures;
}

export interface MultiplayerServerError {
  event: string;
  error: string;
  raw?: unknown;
}

export interface MultiplayerDirectMessage {
  from: string;
  data: unknown;
}

export interface MultiplayerPrivateMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: string;
}

export interface MultiplayerSocketState {
  status: MultiplayerSocketStatus;
  roomCode: string | null;
  userId: string | null;
  levelId: string | null;
  roomFeatures: MultiplayerRoomFeatures | null;
  host: string | null;
  isHost: boolean;
  players: string[];
  privateMessages: MultiplayerPrivateMessage[];
  gameStarted: boolean;
  error: string | null;
  notice: string | null;
  lastServerEvent: string | null;
  bootstrapPayload: MultiplayerRegisterUserData | null;
  latestPriceTick: MultiplayerPriceTickData | null;
  latestTick: MultiplayerTickData | null;
  latestNoNpcOrderbookUpdate: MultiplayerTickData | null;
  latestOrderResponse: RegisterOrderResp | null;
  latestOrderFilled: OrderFilledPayload | null;
  latestGameOver: GameEndRespPayload | null;
}
