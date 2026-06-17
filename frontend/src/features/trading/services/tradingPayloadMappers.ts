import type { LogItem } from "../../../shared/ui/Log";
import type { InfoPopupType } from "../components/TradingInfoPopups";
import type { UnlockDisplayItem } from "../components/UnlocksPopup";
import type {
  AvailableTools,
  OrderAction,
  GameEndMissionProgress,
  GameEndMissionResult,
  GameEndRespPayload,
  MacroFactorDefinition,
  MissionDefinition,
  NextTickRespPayload,
  OrderLogbookEntry,
  OrderType,
  PassingCriteria,
  StartRespPayload,
  UnlockPayloadObject,
} from "../types/tradingTypes";
import { toTwoDp } from "../utils/tradingCalculations";

export interface PendingOrderSnapshot {
  orderId: string;
  ticker: string;
  action: OrderAction;
  orderType: OrderType;
  qty: number;
  qtyLeft: number;
  reservedFunds: number;
  ts?: string;
}

export const DEFAULT_AVAILABLE_TOOLS: AvailableTools = {
  news: true,
  market_order: true,
  short_selling: false,
  limit_order: true,
  stop_order: false,
  stop_limit_order: false,
  bid_ask_spread: false,
  moving_average: false,
  exponential_moving_average: false,
  interest_rate_panel: false,
  inflation_panel: false,
  drawdown_panel: false,
  portfolio_allocation_panel: false,
  sector_exposure_panel: false,
  fundamentals_panel: false,
  correlation_panel: false,
  beta_volatility_panel: false,
  benchmark_panel: false,
  rebalancing_prompt: false,
};

export const normalizeOrderType = (value: unknown): OrderType => {
  if (typeof value !== "string") return "Market";
  const normalized = value.trim().toLowerCase();
  if (normalized === "limit") return "Limit";
  if (normalized === "stop") return "Stop";
  if (
    normalized === "stoplimit" ||
    normalized === "stop_limit" ||
    normalized === "stop-limit" ||
    normalized === "stop limit"
  ) {
    return "StopLimit";
  }
  return "Market";
};

export interface ParsedStartMetadata {
  levelId: string | null;
  startingCash: number | null;
  startDate: string | null;
  totalTicks: number | null;
  levelContext: string | null;
  unlocks: UnlockDisplayItem[];
  availableTools: AvailableTools;
  passingCriteria: PassingCriteria | null;
  bonusMissions: MissionDefinition[];
  macroFactors: MacroFactorDefinition[];
  infoOrder: InfoPopupType[];
}

export const isMissionDefinition = (value: unknown): value is MissionDefinition => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.points === "number"
  );
};

export const isMacroFactorDefinition = (
  value: unknown
): value is MacroFactorDefinition => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.factor_key === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.current_value === "number" &&
    typeof candidate.market_stance_note === "string"
  );
};

export const isUnlockPayloadObject = (
  value: unknown
): value is UnlockPayloadObject => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.feature === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.description === "string"
  );
};

const resolveUnlockTutorialId = (
  unlockEntry: UnlockPayloadObject
): string | undefined => {
  if (
    typeof unlockEntry.tool_tutorial_id === "string" &&
    unlockEntry.tool_tutorial_id.trim().length > 0
  ) {
    return unlockEntry.tool_tutorial_id.trim();
  }
  return undefined;
};

export const parseStartMetadata = (
  payload: StartRespPayload | NextTickRespPayload
): ParsedStartMetadata => {
  const parsedUnlocks: UnlockDisplayItem[] = [];
  if (Array.isArray(payload.unlocks)) {
    for (const unlockEntry of payload.unlocks) {
      if (!isUnlockPayloadObject(unlockEntry)) continue;
      parsedUnlocks.push({
        feature: unlockEntry.feature,
        title: unlockEntry.title.trim(),
        description: unlockEntry.description.trim(),
        tutorialId: resolveUnlockTutorialId(unlockEntry),
      });
    }
  }

  const parsedPassingCriteria =
    payload.passing_criteria &&
    Array.isArray(payload.passing_criteria.missions)
      ? {
          ...payload.passing_criteria,
          missions: payload.passing_criteria.missions.filter(isMissionDefinition),
        }
      : null;

  const parsedBonus = Array.isArray(payload.bonus_missions)
    ? payload.bonus_missions.filter(isMissionDefinition)
    : [];
  const parsedMacroFactors = Array.isArray(payload.macro_factors)
    ? payload.macro_factors
        .filter(isMacroFactorDefinition)
        .map((factor) => ({
          ...factor,
          display_order:
            typeof factor.display_order === "number" ? factor.display_order : 1,
        }))
        .sort((a, b) => a.display_order - b.display_order)
    : [];

  const levelContext =
    typeof payload.context === "string" && payload.context.trim().length > 0
      ? payload.context.trim()
      : null;

  const levelId =
    typeof payload.level_id === "string" && payload.level_id.trim().length > 0
      ? payload.level_id.trim()
      : null;

  const infoOrder: InfoPopupType[] = [];
  if (parsedUnlocks.length > 0) infoOrder.push("unlocks");
  if (
    (parsedPassingCriteria?.missions.length ?? 0) > 0 ||
    parsedBonus.length > 0
  ) {
    infoOrder.push("missions");
  }
  if (levelContext) infoOrder.push("context");

  return {
    levelId,
    startingCash:
      typeof payload.starting_cash === "number"
        ? toTwoDp(payload.starting_cash)
        : null,
    startDate: typeof payload.start_date === "string" ? payload.start_date : null,
    totalTicks:
      typeof payload.total_ticks === "number" ? payload.total_ticks : null,
    levelContext,
    unlocks: parsedUnlocks,
    availableTools:
      payload.available_tools && typeof payload.available_tools === "object"
        ? {
            ...Object.fromEntries(
              Object.entries(payload.available_tools as Record<string, unknown>).map(
                ([toolKey, enabled]) => [toolKey, !!enabled]
              )
            ),
            news: !!(payload.available_tools as Record<string, unknown>).news,
            market_order: !!(payload.available_tools as Record<string, unknown>).market_order,
            short_selling: !!(payload.available_tools as Record<string, unknown>).short_selling,
            limit_order: !!(payload.available_tools as Record<string, unknown>).limit_order,
            stop_order: !!(payload.available_tools as Record<string, unknown>).stop_order,
            stop_limit_order: !!(payload.available_tools as Record<string, unknown>).stop_limit_order,
            bid_ask_spread: !!(payload.available_tools as Record<string, unknown>).bid_ask_spread,
            moving_average: !!(payload.available_tools as Record<string, unknown>).moving_average,
            exponential_moving_average: !!(payload.available_tools as Record<string, unknown>).exponential_moving_average,
            interest_rate_panel: !!(payload.available_tools as Record<string, unknown>).interest_rate_panel,
            inflation_panel: !!(payload.available_tools as Record<string, unknown>).inflation_panel,
            drawdown_panel: !!(payload.available_tools as Record<string, unknown>).drawdown_panel,
            portfolio_allocation_panel: !!(payload.available_tools as Record<string, unknown>).portfolio_allocation_panel,
            sector_exposure_panel: !!(payload.available_tools as Record<string, unknown>).sector_exposure_panel,
            fundamentals_panel: !!(payload.available_tools as Record<string, unknown>).fundamentals_panel,
            correlation_panel: !!(payload.available_tools as Record<string, unknown>).correlation_panel,
            beta_volatility_panel: !!(payload.available_tools as Record<string, unknown>).beta_volatility_panel,
            benchmark_panel: !!(payload.available_tools as Record<string, unknown>).benchmark_panel,
            rebalancing_prompt: !!(payload.available_tools as Record<string, unknown>).rebalancing_prompt,
          }
        : DEFAULT_AVAILABLE_TOOLS,
    passingCriteria: parsedPassingCriteria,
    bonusMissions: parsedBonus,
    macroFactors: parsedMacroFactors,
    infoOrder,
  };
};

export const getOrderActionLabel = (action: OrderAction): string => {
  if (action === "SellShort") return "Sell Short";
  if (action === "BuyToCover") return "Buy to Cover";
  if (action === "Sell") return "Sell";
  return "Buy";
};

export const getOrderActionLogType = (action: OrderAction): "sell" | "buy" => {
  return action === "Sell" || action === "SellShort" ? "sell" : "buy";
};

export const buildPendingTradeItem = (order: PendingOrderSnapshot): LogItem => ({
  id: order.orderId,
  type: getOrderActionLogType(order.action),
  title: `${getOrderActionLabel(order.action)} ${order.ticker}`,
  message: `${order.orderType} ${order.qtyLeft}/${order.qty} open`,
  timestamp: order.ts ?? new Date().toISOString(),
});

const getNumber = (...values: unknown[]): number | null => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return null;
};

export const buildGameEndPayload = (params: {
  rawPayload: any;
  fallbackGameState?: any;
  knownMissions: MissionDefinition[];
  passingMissionIds: Set<string>;
  currentCash: number | null;
  reservedCash: number;
}): GameEndRespPayload | null => {
  const {
    rawPayload,
    fallbackGameState,
    knownMissions,
    passingMissionIds,
    currentCash,
    reservedCash,
  } = params;
  const endPayload = rawPayload?.data ?? rawPayload;
  const endGameState = rawPayload?.gameState ?? fallbackGameState ?? rawPayload;
  if (typeof endPayload?.netWorth !== "number") return null;

  const missionLookup = new Map<string, MissionDefinition>(
    knownMissions.map((mission) => [mission.id, mission])
  );
  const progressMissions = (endPayload?.missionProgress?.missions ??
    {}) as Record<string, GameEndMissionProgress>;
  const missionResults: GameEndMissionResult[] = [];

  for (const mission of knownMissions) {
    const progress = progressMissions[mission.id];
    missionResults.push({
      id: mission.id,
      title: mission.title,
      description: mission.description,
      points: mission.points,
      isBonus: !passingMissionIds.has(mission.id),
      completed: !!progress?.completed,
      value: typeof progress?.value === "number" ? toTwoDp(progress.value) : null,
    });
  }

  for (const [id, progress] of Object.entries(progressMissions)) {
    if (missionLookup.has(id)) continue;
    missionResults.push({
      id,
      title: id,
      description: "",
      points: 0,
      isBonus: false,
      completed: !!progress?.completed,
      value: typeof progress?.value === "number" ? toTwoDp(progress.value) : null,
    });
  }

  return {
    netWorth: toTwoDp(endPayload.netWorth),
    pnl: toTwoDp(endPayload.pnl ?? endPayload.totalPL ?? 0),
    completed: endPayload.completed ?? 0,
    totalPoints: toTwoDp(endPayload.totalPoints ?? 0),
    finalCashPoints: toTwoDp(endPayload.finalCashPoints ?? 0),
    missionPoints: toTwoDp(endPayload.missionPoints ?? 0),
    bonusPoints: toTwoDp(endPayload.bonusPoints ?? 0),
    passingCash: toTwoDp(endPayload.passingCash ?? 0),
    endingCash: toTwoDp(
      getNumber(
        endPayload?.endingCash,
        endPayload?.ending_cash,
        rawPayload?.endingCash,
        rawPayload?.ending_cash
      ) ??
        ((getNumber(
          endPayload?.availCash,
          endPayload?.avail_cash,
          endGameState?.availCash,
          endGameState?.avail_cash,
          rawPayload?.availCash,
          rawPayload?.avail_cash,
          currentCash
        ) ?? 0) +
          (getNumber(
            endPayload?.reservedCash,
            endPayload?.reserved_cash,
            endGameState?.reservedCash,
            endGameState?.reserved_cash,
            rawPayload?.reservedCash,
            rawPayload?.reserved_cash,
            reservedCash
          ) ?? 0))
    ),
    missionResults,
  };
};

export const shouldShowResumeConfirm = (
  payload: StartRespPayload | NextTickRespPayload
): boolean => {
  try {
    const logbook = (payload as any).logbook;
    if (Array.isArray(logbook)) {
      if (logbook.length > 0) return true;
    } else if (logbook && typeof logbook === "object") {
      for (const date of Object.keys(logbook)) {
        const byTicker = (logbook as any)[date] || {};
        for (const entries of Object.values(byTicker)) {
          if (Array.isArray(entries) && entries.length > 0) {
            return true;
          }
        }
      }
    }

    const tick = (payload as any).tick;
    if (typeof tick === "number" && tick > 0) return true;

    const dataObj = (payload as any).data || {};
    let maxOpenDates = 0;
    for (const tk of Object.keys(dataObj)) {
      const openObj = (dataObj[tk]?.Open as Record<string, unknown>) || {};
      const numDates = Object.keys(openObj).length;
      if (numDates > maxOpenDates) maxOpenDates = numDates;
    }
    return maxOpenDates > 1;
  } catch {
    return true;
  }
};

export const resolveWsUrl = (): string => {
  const singlePlayerWsPath = "/game/single-player/ws";
  const normalizeSocketUrl = (rawUrl: string): string => {
    const trimmed = rawUrl.trim();
    if (trimmed.length === 0) return trimmed;

    if (/\/game\/ws\/?$/.test(trimmed)) {
      return trimmed.replace(/\/game\/ws\/?$/, singlePlayerWsPath);
    }
    if (/\/game\/single-player\/ws\/?$/.test(trimmed)) {
      return trimmed.replace(/\/$/, "");
    }
    if (/^wss?:\/\/[^/]+\/?$/.test(trimmed)) {
      return `${trimmed.replace(/\/$/, "")}${singlePlayerWsPath}`;
    }
    return trimmed;
  };

  const envUrl = import.meta.env.VITE_WS_URL;
  if (envUrl && envUrl.trim().length > 0) return normalizeSocketUrl(envUrl);
  if (typeof window !== "undefined" && window.location?.hostname) {
    return `ws://${window.location.hostname}:8000${singlePlayerWsPath}`;
  }
  return `ws://localhost:8000${singlePlayerWsPath}`;
};

export const mapLogbookEntries = (entries: OrderLogbookEntry[]) => {
  const pending = entries.filter(
    (entry) =>
      entry.status?.toLowerCase() === "open" ||
      entry.status?.toLowerCase() === "partially filled"
  );
  const filled = entries.filter(
    (entry) =>
      entry.status?.toLowerCase() !== "open" &&
      entry.status?.toLowerCase() !== "partially filled"
  );
  return { pending, filled };
};
