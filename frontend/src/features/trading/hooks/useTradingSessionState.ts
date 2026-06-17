import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";

import type { LogItem } from "../../../shared/ui/Log";
import { toast } from "../../../shared/ui/toast/Toast";
import type { InfoPopupType } from "../components/TradingInfoPopups";
import type { UnlockDisplayItem } from "../components/UnlocksPopup";
import {
  buildPendingTradeItem,
  DEFAULT_AVAILABLE_TOOLS,
  getOrderActionLabel,
  getOrderActionLogType,
  mapLogbookEntries,
  normalizeOrderType,
  parseStartMetadata,
  shouldShowResumeConfirm,
  type PendingOrderSnapshot,
} from "../services/tradingPayloadMappers";
import type {
  AvailableTools,
  GameEndRespPayload,
  MacroFactorDefinition,
  MissionDefinition,
  NewsFeedItem,
  NextTickRespPayload,
  OrderBookLevel,
  OrderAction,
  OrderFillEntry,
  OrderFilledPayload,
  OrderLogbookEntry,
  PassingCriteria,
  PortfolioAnalytics,
  PriceTickPayload,
  ReferencePortfolioDefinition,
  RegisterOrderResp,
  StartRespPayload,
  TickerMetadataDefinition,
  TickerGlanceData,
} from "../types/tradingTypes";
import {
  addDaysToYmd,
  computeAssetPriceMetrics,
  toBusinessDay,
  toTwoDp,
  type CandlePoint,
} from "../utils/tradingCalculations";
import { useGameEndPayload } from "./useGameEndPayload";
import { usePortfolioState } from "./usePortfolioState";

interface UseTradingSessionStateParams {
  isResuming: boolean;
  clearTutorials: () => void;
  setPopupQueue: (order: InfoPopupType[]) => void;
}

export interface TradingSessionStateShape {
  allPoints: CandlePoint[];
  livePrice: number | null;
  startingTicker: string | null;
  availableTickers: string[];
  tickerGlance: TickerGlanceData[];
  gameStarted: boolean;
  pastTrades: LogItem[];
  pendingTrades: LogItem[];
  newsFeed: NewsFeedItem[];
  readNewsById: Record<string, true>;
  hasUnreadNews: boolean;
  levelId: string | null;
  levelContext: string | null;
  unlocks: UnlockDisplayItem[];
  availableTools: AvailableTools;
  macroFactors: MacroFactorDefinition[];
  passingCriteria: PassingCriteria | null;
  bonusMissions: MissionDefinition[];
  gameEnd: GameEndRespPayload | null;
  showGameEnd: boolean;
  isConnecting: boolean;
  turnKey: number;
  timerArmed: boolean;
  forceNextTurnOpen: boolean;
  isResumeConfirmOpen: boolean;
  isManualTickMode: boolean;
  manualStartRequired: boolean;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  orderBookBids: OrderBookLevel[];
  orderBookAsks: OrderBookLevel[];
  portfolio: ReturnType<typeof usePortfolioState>;
}

export interface TradingSessionActionsShape {
  setShowGameEnd: (value: boolean) => void;
  setTurnKey: Dispatch<SetStateAction<number>>;
  setTimerArmed: (value: boolean) => void;
  setForceNextTurnOpen: (value: boolean) => void;
  setIsResumeConfirmOpen: (value: boolean) => void;
  setGameStarted: (value: boolean) => void;
  setIsConnecting: (value: boolean) => void;
  setSelectedTicker: (ticker: string) => void;
  markNewsAsRead: (newsId: string) => void;
}

export interface TradingSessionCapabilities {
  canManualAdvance: boolean;
}

export interface TradingSessionStateController {
  sessionState: TradingSessionStateShape;
  actions: TradingSessionActionsShape;
  capabilities: TradingSessionCapabilities;
  refs: {
    selectedTickerRef: MutableRefObject<string | null>;
    startingTickerRef: MutableRefObject<string | null>;
  };
  resetState: () => void;
  handleStartPayload: (payload: StartRespPayload) => void;
  handleNextTickPayload: (payload: NextTickRespPayload) => void;
  handlePriceTickPayload: (payload: PriceTickPayload) => void;
  handleGameOverPayload: (payload: unknown) => void;
  handleOrderResponse: (payload: RegisterOrderResp) => void;
  handleOrderFilled: (payload: OrderFilledPayload) => void;
}

const GLOBAL_NEWS_KEY = "__global__";
const NON_TICKER_DATA_KEYS = new Set(["news", "macro_events"]);

interface ParsedTickerSnapshot {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface ParsedOrderBookSnapshot {
  bestBid: number | null;
  bestAsk: number | null;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
}

const normalizeTicker = (ticker: unknown): string =>
  typeof ticker === "string" ? ticker.trim().toUpperCase() : "";

const normalizeTickerList = (tickers: unknown): string[] => {
  if (!Array.isArray(tickers)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const ticker of tickers) {
    const parsed = normalizeTicker(ticker);
    if (!parsed || seen.has(parsed)) continue;
    seen.add(parsed);
    normalized.push(parsed);
  }
  return normalized;
};

const parseTickerSnapshot = (value: unknown): ParsedTickerSnapshot | null => {
  if (!value || typeof value !== "object") return null;
  const normalized = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key.toLowerCase(),
      entry,
    ])
  ) as Record<string, unknown>;
  const open = normalized.open;
  const high = normalized.high;
  const low = normalized.low;
  const close = normalized.close;
  if (
    typeof open !== "number" ||
    typeof high !== "number" ||
    typeof low !== "number" ||
    typeof close !== "number" ||
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close)
  ) {
    return null;
  }
  return {
    open: toTwoDp(open),
    high: toTwoDp(high),
    low: toTwoDp(low),
    close: toTwoDp(close),
  };
};

const parseOrderBookLevels = (
  sideValue: unknown,
  side: "bids" | "asks"
): OrderBookLevel[] => {
  if (!Array.isArray(sideValue)) return [];
  const levels: OrderBookLevel[] = [];
  for (const entry of sideValue) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const rawPrice = row.price;
    const rawQuantity =
      row.qty ?? row.quantity ?? row.size ?? row.volume ?? row.vol ?? null;
    const parsedPrice =
      typeof rawPrice === "number"
        ? rawPrice
        : typeof rawPrice === "string"
          ? Number(rawPrice)
          : NaN;
    if (!Number.isFinite(parsedPrice)) continue;
    const parsedQuantity =
      typeof rawQuantity === "number"
        ? rawQuantity
        : typeof rawQuantity === "string"
          ? Number(rawQuantity)
          : NaN;
    const quantity =
      Number.isFinite(parsedQuantity)
        ? toTwoDp(parsedQuantity)
        : null;
    levels.push({
      price: toTwoDp(parsedPrice),
      quantity,
    });
  }
  levels.sort((a, b) => {
    if (side === "bids") return b.price - a.price;
    return a.price - b.price;
  });
  return levels;
};

const parseOrderBookSnapshot = (value: unknown): ParsedOrderBookSnapshot => {
  if (!value || typeof value !== "object") {
    return { bestBid: null, bestAsk: null, bids: [], asks: [] };
  }

  const candidate = value as Record<string, unknown>;
  const bids = parseOrderBookLevels(candidate.bids, "bids");
  const asks = parseOrderBookLevels(candidate.asks, "asks");
  const topBid = bids.length > 0 ? bids[0].price : null;
  const topAsk = asks.length > 0 ? asks[0].price : null;

  return {
    bestBid: topBid,
    bestAsk: topAsk,
    bids,
    asks,
  };
};

const hasPointForDate = (points: CandlePoint[], dateYmd: string): boolean => {
  const date = toBusinessDay(dateYmd);
  return points.some((point) => {
    const pointTime = (point as { time?: unknown }).time;
    if (!pointTime || typeof pointTime !== "object") return false;
    const typedPointTime = pointTime as {
      year?: unknown;
      month?: unknown;
      day?: unknown;
    };
    return (
      typedPointTime.year === date.year &&
      typedPointTime.month === date.month &&
      typedPointTime.day === date.day
    );
  });
};

const getNewsSequence = (id: string): number => {
  const parts = id.split("-");
  const maybe = Number(parts[parts.length - 1]);
  return Number.isFinite(maybe) ? maybe : 0;
};

interface ParsedNewsEntry {
  headline: string;
  content: string;
  ticker: string | null;
}

const parseNewsEntry = (entry: unknown): ParsedNewsEntry | null => {
  if (typeof entry === "string") {
    const headline = entry.trim();
    if (!headline) return null;
    return { headline, content: headline, ticker: null };
  }

  if (Array.isArray(entry)) {
    const rawHeadline = entry[0];
    const rawContent = entry[1];
    if (typeof rawHeadline !== "string" || rawHeadline.trim().length === 0) {
      return null;
    }
    const headline = rawHeadline.trim();
    const content =
      typeof rawContent === "string" && rawContent.trim().length > 0
        ? rawContent.trim()
        : headline;
    return { headline, content, ticker: null };
  }

  if (!entry || typeof entry !== "object") return null;
  const candidate = entry as Record<string, unknown>;
  const rawHeadline =
    (typeof candidate.headline === "string" && candidate.headline) ||
    (typeof candidate.title === "string" && candidate.title) ||
    (typeof candidate.message === "string" && candidate.message) ||
    (typeof candidate.content === "string" && candidate.content) ||
    null;
  if (!rawHeadline) return null;

  const headline = rawHeadline.trim();
  if (!headline) return null;

  const rawContent =
    (typeof candidate.content === "string" && candidate.content) ||
    (typeof candidate.body === "string" && candidate.body) ||
    (typeof candidate.message === "string" && candidate.message) ||
    headline;
  const content = rawContent.trim() || headline;

  const ticker = normalizeTicker(candidate.ticker) || null;
  return { headline, content, ticker };
};

const parsePortfolioAnalytics = (value: unknown): PortfolioAnalytics | null => {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const allocation = Array.isArray(raw.allocation)
    ? raw.allocation
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const row = entry as Record<string, unknown>;
          return {
            ticker: normalizeTicker(row.ticker),
            weight: typeof row.weight === "number" ? row.weight : 0,
            value: typeof row.value === "number" ? row.value : 0,
            qty: typeof row.qty === "number" ? row.qty : undefined,
            long_qty:
              typeof row.long_qty === "number" ? row.long_qty : undefined,
            short_qty:
              typeof row.short_qty === "number" ? row.short_qty : undefined,
          };
        })
        .filter((entry) => entry.ticker.length > 0)
    : [];

  const sectors = Array.isArray(raw.sectors)
    ? raw.sectors
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const row = entry as Record<string, unknown>;
          return {
            sector_key:
              typeof row.sector_key === "string" && row.sector_key.trim().length > 0
                ? row.sector_key.trim()
                : "unknown",
            weight: typeof row.weight === "number" ? row.weight : 0,
            value: typeof row.value === "number" ? row.value : 0,
          };
        })
    : [];

  const riskRaw =
    raw.risk && typeof raw.risk === "object"
      ? (raw.risk as Record<string, unknown>)
      : {};
  const benchmarkRaw =
    raw.benchmark && typeof raw.benchmark === "object"
      ? (raw.benchmark as Record<string, unknown>)
      : {};
  const warningsRaw =
    raw.warnings && typeof raw.warnings === "object"
      ? (raw.warnings as Record<string, unknown>)
      : {};

  const references = Array.isArray(raw.references)
    ? raw.references
        .filter((entry) => entry && typeof entry === "object")
        .map((entry) => {
          const row = entry as Record<string, unknown>;
          const role: "benchmark" | "reference" =
            row.role === "benchmark" ? "benchmark" : "reference";
          return {
            reference_key:
              typeof row.reference_key === "string" ? row.reference_key : "",
            role,
            title: typeof row.title === "string" ? row.title : "",
            return_pct: typeof row.return_pct === "number" ? row.return_pct : 0,
            excess_return:
              typeof row.excess_return === "number" ? row.excess_return : 0,
          };
        })
        .filter((entry) => entry.reference_key.length > 0)
    : [];

  return {
    allocation,
    sectors,
    risk: {
      invested_value:
        typeof riskRaw.invested_value === "number" ? riskRaw.invested_value : 0,
      largest_position_weight:
        typeof riskRaw.largest_position_weight === "number"
          ? riskRaw.largest_position_weight
          : 0,
      largest_sector_weight:
        typeof riskRaw.largest_sector_weight === "number"
          ? riskRaw.largest_sector_weight
          : 0,
      hhi: typeof riskRaw.hhi === "number" ? riskRaw.hhi : 0,
      beta: typeof riskRaw.beta === "number" ? riskRaw.beta : null,
      volatility:
        typeof riskRaw.volatility === "number" ? riskRaw.volatility : null,
      average_correlation:
        typeof riskRaw.average_correlation === "number"
          ? riskRaw.average_correlation
          : null,
      min_avg_abs_correlation:
        typeof riskRaw.min_avg_abs_correlation === "number"
          ? riskRaw.min_avg_abs_correlation
          : null,
    },
    benchmark: {
      benchmark_key:
        typeof benchmarkRaw.benchmark_key === "string"
          ? benchmarkRaw.benchmark_key
          : null,
      portfolio_return:
        typeof benchmarkRaw.portfolio_return === "number"
          ? benchmarkRaw.portfolio_return
          : null,
      benchmark_return:
        typeof benchmarkRaw.benchmark_return === "number"
          ? benchmarkRaw.benchmark_return
          : null,
      excess_return:
        typeof benchmarkRaw.excess_return === "number"
          ? benchmarkRaw.excess_return
          : null,
    },
    references,
    warnings: {
      rebalance_due: Boolean(warningsRaw.rebalance_due),
      messages: Array.isArray(warningsRaw.messages)
        ? warningsRaw.messages
            .filter((entry) => typeof entry === "string")
            .map((entry) => String(entry))
        : [],
    },
  };
};

const toPendingLogItem = (
  entry: OrderLogbookEntry,
  messagePrefix?: string
): LogItem => {
  const price = entry.price_filled ?? entry.price;
  const priceStr = typeof price === "number" ? toTwoDp(price).toFixed(2) : "MKT";
  const action: OrderAction = entry.action;
  return {
    id: entry.order_id,
    type: getOrderActionLogType(action),
    title: `${getOrderActionLabel(action)} ${entry.ticker}`,
    message: `${messagePrefix ?? entry.status} ${entry.qty} @ ${priceStr}`,
    timestamp: entry.ts,
  };
};

const toPastTradeLogItem = (fill: OrderFillEntry): LogItem => ({
  id: fill.fill_id,
  type: getOrderActionLogType(fill.action),
  title: `${getOrderActionLabel(fill.action)} ${fill.ticker}`,
  message: `Filled ${fill.qty} @ ${toTwoDp(fill.price).toFixed(2)}`,
  timestamp: fill.ts,
});

export function useTradingSessionState({
  isResuming,
  clearTutorials,
  setPopupQueue,
}: UseTradingSessionStateParams): TradingSessionStateController {
  const [allPoints, setAllPoints] = useState<CandlePoint[]>([]);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [startingTicker, setStartingTicker] = useState<string | null>(null);
  const [availableTickers, setAvailableTickers] = useState<string[]>([]);
  const [allPointsByTicker, setAllPointsByTicker] = useState<
    Record<string, CandlePoint[]>
  >({});
  const [livePriceByTicker, setLivePriceByTicker] = useState<
    Record<string, number | null>
  >({});
  const [newsFeedByTicker, setNewsFeedByTicker] = useState<
    Record<string, NewsFeedItem[]>
  >({});
  const [readNewsById, setReadNewsById] = useState<Record<string, true>>({});
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [pastTrades, setPastTrades] = useState<LogItem[]>([]);
  const [pendingTrades, setPendingTrades] = useState<LogItem[]>([]);
  const [newsFeed, setNewsFeed] = useState<NewsFeedItem[]>([]);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [levelContext, setLevelContext] = useState<string | null>(null);
  const [unlocks, setUnlocks] = useState<UnlockDisplayItem[]>([]);
  const [availableTools, setAvailableTools] = useState<AvailableTools>(
    DEFAULT_AVAILABLE_TOOLS
  );
  const [macroFactors, setMacroFactors] = useState<MacroFactorDefinition[]>([]);
  const [passingCriteria, setPassingCriteria] = useState<PassingCriteria | null>(
    null
  );
  const [bonusMissions, setBonusMissions] = useState<MissionDefinition[]>([]);
  const [gameEnd, setGameEnd] = useState<GameEndRespPayload | null>(null);
  const [showGameEnd, setShowGameEnd] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [turnKey, setTurnKey] = useState<number>(0);
  const [timerArmed, setTimerArmed] = useState<boolean>(false);
  const [forceNextTurnOpen, setForceNextTurnOpen] = useState<boolean>(false);
  const [isResumeConfirmOpen, setIsResumeConfirmOpen] = useState<boolean>(false);
  const [isManualTickMode, setIsManualTickMode] = useState<boolean>(true);
  const [manualStartRequired, setManualStartRequired] = useState<boolean>(false);
  const [bestBidByTicker, setBestBidByTicker] = useState<
    Record<string, number | null>
  >({});
  const [bestAskByTicker, setBestAskByTicker] = useState<
    Record<string, number | null>
  >({});
  const [orderBookByTicker, setOrderBookByTicker] = useState<
    Record<string, { bids: OrderBookLevel[]; asks: OrderBookLevel[] }>
  >({});

  const portfolio = usePortfolioState();
  const {
    setCurrentCash,
    setStartingCash,
    setStartingNetWorth,
    setHoldingsQty,
    setHoldingsValue,
    setLongQty,
    setShortQty,
    setLongValue,
    setShortLiability,
    setReservedCash,
    setDrawdownPct,
    setMaxDrawdownPct,
    setPortfolioAnalytics,
    setTickerMetadata,
    setReferencePortfolios,
    currentCashRef,
    reservedCashRef,
  } = portfolio;

  const startingTickerRef = useRef<string | null>(null);
  const availableTickersRef = useRef<string[]>([]);
  const startDateRef = useRef<string | null>(null);
  const totalTicksRef = useRef<number | null>(null);
  const initialTickHandledRef = useRef<boolean>(false);
  const missionsRef = useRef<MissionDefinition[]>([]);
  const passingMissionIdsRef = useRef<Set<string>>(new Set());
  const pendingOrderStateRef = useRef<Map<string, PendingOrderSnapshot>>(
    new Map()
  );
  const processedOrderFillEventsRef = useRef<Set<string>>(new Set());
  const newsSequenceRef = useRef<number>(0);

  useEffect(() => {
    startingTickerRef.current = startingTicker;
  }, [startingTicker]);

  useEffect(() => {
    availableTickersRef.current = availableTickers;
  }, [availableTickers]);

  useEffect(() => {
    missionsRef.current = [...(passingCriteria?.missions ?? []), ...bonusMissions];
    passingMissionIdsRef.current = new Set(
      (passingCriteria?.missions ?? []).map((mission) => mission.id)
    );
  }, [passingCriteria, bonusMissions]);

  const buildGameEnd = useGameEndPayload({
    missionsRef,
    passingMissionIdsRef,
    currentCashRef,
    reservedCashRef,
  });

  const syncTickerRegistry = useCallback((tickers: string[]) => {
    const incoming = normalizeTickerList(tickers);
    if (incoming.length === 0) return;

    const merged = normalizeTickerList([
      ...availableTickersRef.current,
      ...incoming,
    ]);
    availableTickersRef.current = merged;
    setAvailableTickers(merged);

    setAllPointsByTicker((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const ticker of merged) {
        if (!next[ticker]) {
          next[ticker] = [];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setLivePriceByTicker((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const ticker of merged) {
        if (!(ticker in next)) {
          next[ticker] = null;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setNewsFeedByTicker((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const ticker of merged) {
        if (!next[ticker]) {
          next[ticker] = [];
          changed = true;
        }
      }
      if (!next[GLOBAL_NEWS_KEY]) {
        next[GLOBAL_NEWS_KEY] = [];
        changed = true;
      }
      return changed ? next : prev;
    });
    setBestBidByTicker((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const ticker of merged) {
        if (!(ticker in next)) {
          next[ticker] = null;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setBestAskByTicker((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const ticker of merged) {
        if (!(ticker in next)) {
          next[ticker] = null;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    setOrderBookByTicker((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const ticker of merged) {
        if (!(ticker in next)) {
          next[ticker] = { bids: [], asks: [] };
          changed = true;
        }
      }
      return changed ? next : prev;
    });

    if (!startingTickerRef.current || !merged.includes(startingTickerRef.current)) {
      startingTickerRef.current = merged[0] ?? null;
      setStartingTicker(startingTickerRef.current);
    }
  }, []);

  const setSelectedTicker = useCallback((ticker: string) => {
    const normalized = normalizeTicker(ticker);
    if (!normalized) return;
    if (!availableTickersRef.current.includes(normalized)) return;
    startingTickerRef.current = normalized;
    setStartingTicker(normalized);
  }, []);

  const markNewsAsRead = useCallback((newsId: string) => {
    if (!newsId) return;
    setReadNewsById((prev) => (prev[newsId] ? prev : { ...prev, [newsId]: true }));
  }, []);

  useEffect(() => {
    const selected = startingTickerRef.current;
    if (!selected) {
      setAllPoints([]);
      setLivePrice(null);
    } else {
      setAllPoints(allPointsByTicker[selected] ?? []);
      setLivePrice(livePriceByTicker[selected] ?? null);
    }

    // News feed is intentionally unified across all tickers so players infer impact.
    const unifiedNews: NewsFeedItem[] = [];
    for (const [bucket, items] of Object.entries(newsFeedByTicker)) {
      if (bucket === GLOBAL_NEWS_KEY) continue;
      unifiedNews.push(...items);
    }
    unifiedNews.push(...(newsFeedByTicker[GLOBAL_NEWS_KEY] ?? []));
    unifiedNews.sort((a, b) => getNewsSequence(b.id) - getNewsSequence(a.id));
    setNewsFeed(unifiedNews);
  }, [allPointsByTicker, livePriceByTicker, newsFeedByTicker, startingTicker]);

  const hasUnreadNews = useMemo(
    () => newsFeed.some((entry) => !readNewsById[entry.id]),
    [newsFeed, readNewsById]
  );

  const applyStartMetadata = useCallback(
    (payload: StartRespPayload | NextTickRespPayload) => {
      const parsed = parseStartMetadata(payload);
      if (parsed.startingCash != null) {
        setStartingCash(parsed.startingCash);
      }
      if (typeof (payload as any)?.starting_net_worth === "number") {
        setStartingNetWorth(toTwoDp((payload as any).starting_net_worth));
      }
      if (parsed.startDate) {
        startDateRef.current = parsed.startDate;
      }
      if (parsed.totalTicks != null) {
        totalTicksRef.current = parsed.totalTicks;
      }
      const payloadTickMode =
        typeof (payload as any)?.tick_mode === "string"
          ? ((payload as any).tick_mode as string).toLowerCase()
          : null;
      if (payloadTickMode === "manual") {
        setIsManualTickMode(true);
      } else if (payloadTickMode === "auto") {
        setIsManualTickMode(false);
      }
      setManualStartRequired(
        payloadTickMode === "auto" && (payload as any)?.manual_start === true
      );
      setLevelId(parsed.levelId);
      setLevelContext(parsed.levelContext);
      setUnlocks(parsed.unlocks);
      setAvailableTools(parsed.availableTools);
      const rawTickerMetadata = (payload as any)?.ticker_metadata;
      if (rawTickerMetadata && typeof rawTickerMetadata === "object") {
        const nextMetadata: Record<string, TickerMetadataDefinition> = {};
        for (const [rawTicker, rawMeta] of Object.entries(
          rawTickerMetadata as Record<string, unknown>
        )) {
          if (!rawMeta || typeof rawMeta !== "object") continue;
          const ticker = normalizeTicker(rawTicker);
          if (!ticker) continue;
          const metadata = rawMeta as Record<string, unknown>;
          nextMetadata[ticker] = {
            company_name:
              typeof metadata.company_name === "string"
                ? metadata.company_name
                : "",
            company_description:
              typeof metadata.company_description === "string"
                ? metadata.company_description
                : "",
            sector_key:
              typeof metadata.sector_key === "string" && metadata.sector_key.trim()
                ? metadata.sector_key.trim()
                : "unknown",
            pe_ratio:
              typeof metadata.pe_ratio === "number" ? metadata.pe_ratio : null,
            roe_pct: typeof metadata.roe_pct === "number" ? metadata.roe_pct : null,
            debt_to_equity:
              typeof metadata.debt_to_equity === "number"
                ? metadata.debt_to_equity
                : null,
            beta: typeof metadata.beta === "number" ? metadata.beta : null,
            volatility_hint:
              typeof metadata.volatility_hint === "number"
                ? metadata.volatility_hint
                : null,
            ticker_tags: Array.isArray(metadata.ticker_tags)
              ? metadata.ticker_tags
                  .filter((tag) => typeof tag === "string")
                  .map((tag) => String(tag))
              : [],
          };
        }
        setTickerMetadata(nextMetadata);
      } else {
        setTickerMetadata({});
      }

      const rawReferencePortfolios = (payload as any)?.reference_portfolios;
      if (Array.isArray(rawReferencePortfolios)) {
        const references: ReferencePortfolioDefinition[] = rawReferencePortfolios
          .filter((entry) => entry && typeof entry === "object")
          .map((entry) => entry as Record<string, unknown>)
          .map((entry) => {
            const role =
              entry.reference_role === "benchmark" || entry.reference_role === "reference"
                ? entry.reference_role
                : "reference";
            const components = Array.isArray(entry.components)
              ? entry.components
                  .filter((component) => component && typeof component === "object")
                  .map((component) => component as Record<string, unknown>)
                  .map((component) => ({
                    ticker: normalizeTicker(component.ticker),
                    weight:
                      typeof component.weight === "number" ? component.weight : 0,
                    display_order:
                      typeof component.display_order === "number"
                        ? component.display_order
                        : 1,
                  }))
                  .filter((component) => component.ticker.length > 0)
              : [];
            return {
              reference_key:
                typeof entry.reference_key === "string" ? entry.reference_key : "",
              reference_role: role,
              title: typeof entry.title === "string" ? entry.title : "",
              description:
                typeof entry.description === "string" ? entry.description : "",
              display_order:
                typeof entry.display_order === "number" ? entry.display_order : 1,
              components,
            } as ReferencePortfolioDefinition;
          })
          .filter((entry) => entry.reference_key.length > 0);
        setReferencePortfolios(references);
      } else {
        setReferencePortfolios([]);
      }

      const startAnalytics = parsePortfolioAnalytics(
        (payload as any)?.portfolio_analytics ??
          (payload as any)?.gameState?.portfolio_analytics
      );
      setPortfolioAnalytics(startAnalytics ?? null);
      setMacroFactors(parsed.macroFactors);
      setPassingCriteria(parsed.passingCriteria);
      setBonusMissions(parsed.bonusMissions);
      setPopupQueue(parsed.infoOrder);
    },
    [
      setPopupQueue,
      setPortfolioAnalytics,
      setReferencePortfolios,
      setStartingCash,
      setTickerMetadata,
    ]
  );

  const applyGameEndPayload = useCallback(
    (rawPayload: unknown, fallbackGameState?: any) => {
      const sanitized = buildGameEnd(rawPayload, fallbackGameState);
      if (!sanitized) return;
      setGameEnd(sanitized);
      setShowGameEnd(true);
    },
    [buildGameEnd]
  );

  const applyPortfolioFromGameState = useCallback(
    (
      rawGameState: Record<string, unknown> | null | undefined,
      options?: { drawdownToolEnabled?: boolean | null }
    ) => {
      if (!rawGameState || typeof rawGameState !== "object") return;
      const gameState = rawGameState as Record<string, unknown>;

      const availCash =
        typeof gameState.availCash === "number"
          ? gameState.availCash
          : typeof gameState.avail_cash === "number"
            ? gameState.avail_cash
            : null;
      if (availCash != null) setCurrentCash(toTwoDp(availCash));

      const reservedCash =
        typeof gameState.reservedCash === "number"
          ? gameState.reservedCash
          : typeof gameState.reserved_cash === "number"
            ? gameState.reserved_cash
            : null;
      if (reservedCash != null) setReservedCash(toTwoDp(reservedCash));

      const drawdownPctValue =
        typeof gameState.drawdown_pct === "number"
          ? gameState.drawdown_pct
          : typeof gameState.drawdownPct === "number"
            ? gameState.drawdownPct
            : null;
      const maxDrawdownPctValue =
        typeof gameState.max_drawdown_pct === "number"
          ? gameState.max_drawdown_pct
          : typeof gameState.maxDrawdownPct === "number"
            ? gameState.maxDrawdownPct
            : null;
      if (drawdownPctValue != null) {
        setDrawdownPct(toTwoDp(drawdownPctValue * 100));
      } else if (options?.drawdownToolEnabled === false) {
        setDrawdownPct(null);
      }
      if (maxDrawdownPctValue != null) {
        setMaxDrawdownPct(toTwoDp(maxDrawdownPctValue * 100));
      } else if (options?.drawdownToolEnabled === false) {
        setMaxDrawdownPct(null);
      }

      const parsedPortfolioAnalytics = parsePortfolioAnalytics(
        gameState.portfolio_analytics
      );
      if (parsedPortfolioAnalytics) {
        setPortfolioAnalytics(parsedPortfolioAnalytics);
      }

      let qtySum = 0;
      let valueSum = 0;
      let totalLongQty = 0;
      let totalShortQty = 0;
      let totalLongValue = 0;
      let totalShortLiability = 0;
      let sawPositionRow = false;

      const gsEntries = Object.entries(gameState).filter(
        ([key, value]) =>
          value &&
          typeof value === "object" &&
          key !== "positions" &&
          key !== "portfolio_analytics"
      );
      for (const [, pos] of gsEntries) {
        const longTotalQty =
          Number((pos as any)?.longTotalQty ?? (pos as any)?.long_total_qty) || 0;
        const shortTotalQty =
          Number((pos as any)?.shortTotalQty ?? (pos as any)?.short_total_qty) || 0;
        const netPositionValue = Number(
          (pos as any)?.netPositionValue ?? (pos as any)?.net_position_value
        );
        if (longTotalQty <= 0 && shortTotalQty <= 0 && !Number.isFinite(netPositionValue)) {
          continue;
        }
        sawPositionRow = true;
        const grossQty = longTotalQty + shortTotalQty;
        qtySum += grossQty;
        totalLongQty += longTotalQty;
        totalShortQty += shortTotalQty;
        const longValue = Number((pos as any)?.longValue ?? (pos as any)?.long_value);
        if (Number.isFinite(longValue)) totalLongValue += longValue;
        const shortLiability = Number(
          (pos as any)?.shortLiability ?? (pos as any)?.short_liability
        );
        if (Number.isFinite(shortLiability)) totalShortLiability += shortLiability;
        if (Number.isFinite(netPositionValue)) valueSum += netPositionValue;
      }
      const totalValueAll = Number(gameState.totalValueAllStocks ?? gameState.total_value_all_stocks);
      if (Number.isFinite(totalValueAll)) {
        valueSum = totalValueAll;
        sawPositionRow = true;
      }

      if (sawPositionRow) {
        setHoldingsQty(qtySum);
        setHoldingsValue(toTwoDp(valueSum));
        setLongQty(totalLongQty);
        setShortQty(totalShortQty);
        setLongValue(toTwoDp(totalLongValue));
        setShortLiability(toTwoDp(totalShortLiability));
        return;
      }

      const rawPositions = gameState.positions;
      if (!rawPositions || typeof rawPositions !== "object") return;

      qtySum = 0;
      valueSum = 0;
      totalLongQty = 0;
      totalShortQty = 0;
      totalLongValue = 0;
      totalShortLiability = 0;
      for (const pos of Object.values(rawPositions as Record<string, unknown>)) {
        const longAvailQty =
          Number((pos as any)?.long_avail_qty ?? (pos as any)?.longAvailQty) || 0;
        const longReservedQty =
          Number((pos as any)?.long_reserved_qty ?? (pos as any)?.longReservedQty) || 0;
        const shortAvailQty =
          Number((pos as any)?.short_avail_qty ?? (pos as any)?.shortAvailQty) || 0;
        const shortReservedQty =
          Number((pos as any)?.short_reserved_qty ?? (pos as any)?.shortReservedQty) || 0;
        const longCostBasis =
          Number((pos as any)?.long_cost_basis ?? (pos as any)?.longCostBasis) || 0;
        const shortEntryPrice =
          Number((pos as any)?.short_entry_price ?? (pos as any)?.shortEntryPrice) || 0;

        const longQty = longAvailQty + longReservedQty;
        const shortQty = shortAvailQty + shortReservedQty;
        totalLongQty += longQty;
        totalShortQty += shortQty;
        qtySum += longQty + shortQty;
        const longLegValue = longQty * longCostBasis;
        const shortLegLiability = shortQty * shortEntryPrice;
        totalLongValue += longLegValue;
        totalShortLiability += shortLegLiability;
        valueSum += longLegValue - shortLegLiability;
      }
      setHoldingsQty(qtySum);
      setHoldingsValue(toTwoDp(valueSum));
      setLongQty(totalLongQty);
      setShortQty(totalShortQty);
      setLongValue(toTwoDp(totalLongValue));
      setShortLiability(toTwoDp(totalShortLiability));
    },
    [
      setCurrentCash,
      setDrawdownPct,
      setHoldingsQty,
      setHoldingsValue,
      setLongQty,
      setLongValue,
      setMaxDrawdownPct,
      setPortfolioAnalytics,
      setReservedCash,
      setShortLiability,
      setShortQty,
    ]
  );

  const applyPreloadedTickData = useCallback(
    (payload: StartRespPayload) => {
      const preloadedData = Array.isArray(payload.preloaded_tick_data)
        ? payload.preloaded_tick_data
        : [];
      if (preloadedData.length === 0) return;

      const baseDate = startDateRef.current ?? payload.start_date;
      if (typeof baseDate !== "string" || baseDate.trim().length === 0) return;

      const snapshotEntries: Array<{
        ticker: string;
        dateStr: string;
        snapshot: ParsedTickerSnapshot;
      }> = [];
      const latestCloseByTicker: Record<string, number> = {};
      const latestBestBidByTicker: Record<string, number | null> = {};
      const latestBestAskByTicker: Record<string, number | null> = {};
      const latestOrderBookByTicker: Record<
        string,
        { bids: OrderBookLevel[]; asks: OrderBookLevel[] }
      > = {};
      const discoveredTickers = new Set<string>();
      const parsedNewsByTicker: Record<string, NewsFeedItem[]> = {};

      const appendNews = (
        tickNum: number,
        tickerBucket: string,
        parsedEntry: ParsedNewsEntry
      ) => {
        const bucket = tickerBucket || GLOBAL_NEWS_KEY;
        if (bucket !== GLOBAL_NEWS_KEY) discoveredTickers.add(bucket);
        if (!parsedNewsByTicker[bucket]) parsedNewsByTicker[bucket] = [];
        newsSequenceRef.current += 1;
        parsedNewsByTicker[bucket].push({
          id: `${tickNum}-news-${bucket}-${newsSequenceRef.current}`,
          headline: parsedEntry.headline,
          content: parsedEntry.content,
          ticker: bucket === GLOBAL_NEWS_KEY ? null : bucket,
          timestamp: addDaysToYmd(baseDate, tickNum),
        });
      };

      for (const entry of preloadedData) {
        const tickNum = Number(entry.tick);
        if (!Number.isFinite(tickNum)) continue;
        const dateStr = addDaysToYmd(baseDate, tickNum);
        const dataObj = entry.data;
        if (!dataObj || typeof dataObj !== "object") continue;

        for (const [key, value] of Object.entries(dataObj as Record<string, unknown>)) {
          if (NON_TICKER_DATA_KEYS.has(key.toLowerCase())) continue;
          const ticker = normalizeTicker(key);
          if (!ticker) continue;
          const topOfBook = parseOrderBookSnapshot(value);
          if (topOfBook.bestBid != null) {
            latestBestBidByTicker[ticker] = topOfBook.bestBid;
          }
          if (topOfBook.bestAsk != null) {
            latestBestAskByTicker[ticker] = topOfBook.bestAsk;
          }
          if (topOfBook.bids.length > 0 || topOfBook.asks.length > 0) {
            latestOrderBookByTicker[ticker] = {
              bids: topOfBook.bids,
              asks: topOfBook.asks,
            };
          }
          const snapshot = parseTickerSnapshot(value);
          if (snapshot) {
            discoveredTickers.add(ticker);
          }
          if (!snapshot) continue;
          snapshotEntries.push({ ticker, dateStr, snapshot });
          latestCloseByTicker[ticker] = snapshot.close;
        }

        const rawNews = (dataObj as Record<string, unknown>).news;
        if (Array.isArray(rawNews)) {
          for (const newsEntry of rawNews) {
            const parsedEntry = parseNewsEntry(newsEntry);
            if (!parsedEntry) continue;
            appendNews(tickNum, parsedEntry.ticker ?? GLOBAL_NEWS_KEY, parsedEntry);
          }
          continue;
        }
        if (rawNews && typeof rawNews === "object") {
          const singleNewsEntry = parseNewsEntry(rawNews);
          if (singleNewsEntry) {
            appendNews(
              tickNum,
              singleNewsEntry.ticker ?? GLOBAL_NEWS_KEY,
              singleNewsEntry
            );
            continue;
          }
          for (const [rawTicker, entries] of Object.entries(
            rawNews as Record<string, unknown>
          )) {
            const ticker = normalizeTicker(rawTicker) || GLOBAL_NEWS_KEY;
            if (Array.isArray(entries)) {
              for (const item of entries) {
                const parsedEntry = parseNewsEntry(item);
                if (!parsedEntry) continue;
                appendNews(tickNum, ticker, parsedEntry);
              }
              continue;
            }
            const parsedEntry = parseNewsEntry(entries);
            if (!parsedEntry) continue;
            appendNews(tickNum, ticker, parsedEntry);
          }
          continue;
        }
        if (typeof rawNews === "string") {
          const parsedEntry = parseNewsEntry(rawNews);
          if (parsedEntry) appendNews(tickNum, GLOBAL_NEWS_KEY, parsedEntry);
        }
      }

      if (discoveredTickers.size > 0) {
        syncTickerRegistry(Array.from(discoveredTickers));
      }

      if (snapshotEntries.length > 0) {
        setAllPointsByTicker((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const { ticker, dateStr, snapshot } of snapshotEntries) {
            const existingPoints = next[ticker] ?? [];
            if (hasPointForDate(existingPoints, dateStr)) continue;
            const nextPoint: CandlePoint = {
              time: toBusinessDay(dateStr) as any,
              open: snapshot.open,
              high: snapshot.high,
              low: snapshot.low,
              close: snapshot.close,
            };
            next[ticker] = [...existingPoints, nextPoint];
            changed = true;
          }
          return changed ? next : prev;
        });

        setLivePriceByTicker((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [ticker, close] of Object.entries(latestCloseByTicker)) {
            if (next[ticker] === close) continue;
            next[ticker] = close;
            changed = true;
          }
          return changed ? next : prev;
        });
      }

      if (Object.keys(latestBestBidByTicker).length > 0) {
        setBestBidByTicker((prev) => ({ ...prev, ...latestBestBidByTicker }));
      }
      if (Object.keys(latestBestAskByTicker).length > 0) {
        setBestAskByTicker((prev) => ({ ...prev, ...latestBestAskByTicker }));
      }
      if (Object.keys(latestOrderBookByTicker).length > 0) {
        setOrderBookByTicker((prev) => ({ ...prev, ...latestOrderBookByTicker }));
      }

      if (Object.keys(parsedNewsByTicker).length > 0) {
        setAvailableTools((prev) =>
          prev.news ? prev : { ...prev, news: true }
        );
        setNewsFeedByTicker((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [ticker, items] of Object.entries(parsedNewsByTicker)) {
            if (items.length === 0) continue;
            next[ticker] = [...items, ...(next[ticker] ?? [])];
            changed = true;
          }
          return changed ? next : prev;
        });
      }
    },
    [syncTickerRegistry]
  );

  const resetState = useCallback(() => {
    setPastTrades([]);
    setPendingTrades([]);
    setNewsFeed([]);
    setNewsFeedByTicker({});
    setReadNewsById({});
    setAllPoints([]);
    setAllPointsByTicker({});
    setLivePrice(null);
    setLivePriceByTicker({});
    setBestBidByTicker({});
    setBestAskByTicker({});
    setOrderBookByTicker({});
    setStartingTicker(null);
    setAvailableTickers([]);
    startingTickerRef.current = null;
    availableTickersRef.current = [];
    startDateRef.current = null;
    totalTicksRef.current = null;
    pendingOrderStateRef.current.clear();
    processedOrderFillEventsRef.current.clear();
    newsSequenceRef.current = 0;
    missionsRef.current = [];
    passingMissionIdsRef.current = new Set();
    clearTutorials();
    setPopupQueue([]);
    setLevelId(null);
    setLevelContext(null);
    setUnlocks([]);
    setAvailableTools(DEFAULT_AVAILABLE_TOOLS);
    setMacroFactors([]);
    setPassingCriteria(null);
    setBonusMissions([]);
    setGameEnd(null);
    setShowGameEnd(false);
    setCurrentCash(null);
    setStartingCash(null);
    setStartingNetWorth(null);
    setHoldingsQty(0);
    setHoldingsValue(0);
    setLongQty(0);
    setShortQty(0);
    setLongValue(0);
    setShortLiability(0);
    setReservedCash(0);
    setDrawdownPct(null);
    setMaxDrawdownPct(null);
    setPortfolioAnalytics(null);
    setTickerMetadata({});
    setReferencePortfolios([]);
    initialTickHandledRef.current = false;
    setIsResumeConfirmOpen(false);
    setGameStarted(false);
    setTimerArmed(false);
    setTurnKey(0);
    setForceNextTurnOpen(false);
    setIsConnecting(true);
    setIsManualTickMode(true);
    setManualStartRequired(false);
  }, [
    clearTutorials,
    setPopupQueue,
    setCurrentCash,
    setStartingCash,
    setStartingNetWorth,
    setHoldingsQty,
    setHoldingsValue,
    setLongQty,
    setShortQty,
    setLongValue,
    setShortLiability,
    setReservedCash,
    setDrawdownPct,
    setMaxDrawdownPct,
    setPortfolioAnalytics,
    setTickerMetadata,
    setReferencePortfolios,
  ]);

  const handleStartPayload = useCallback(
    (payload: StartRespPayload) => {
      applyStartMetadata(payload);
      const startAvailCash =
        typeof payload.avail_cash === "number" ? toTwoDp(payload.avail_cash) : null;
      const startReservedCash =
        typeof payload.reserved_cash === "number"
          ? toTwoDp(payload.reserved_cash)
          : null;
      let startHoldingsValue = 0;
      if (typeof payload.avail_cash === "number") {
        setCurrentCash(toTwoDp(payload.avail_cash));
      }
      if (typeof payload.reserved_cash === "number") {
        setReservedCash(toTwoDp(payload.reserved_cash));
      }
      if (payload.positions && typeof payload.positions === "object") {
        let qtySum = 0;
        let valueSum = 0;
        let totalLongQty = 0;
        let totalShortQty = 0;
        let totalLongValue = 0;
        let totalShortLiability = 0;
        for (const pos of Object.values(payload.positions)) {
          const longAvailQty =
            Number((pos as any)?.long_avail_qty ?? (pos as any)?.longAvailQty) || 0;
          const longReservedQty =
            Number((pos as any)?.long_reserved_qty ?? (pos as any)?.longReservedQty) || 0;
          const shortAvailQty =
            Number((pos as any)?.short_avail_qty ?? (pos as any)?.shortAvailQty) || 0;
          const shortReservedQty =
            Number((pos as any)?.short_reserved_qty ?? (pos as any)?.shortReservedQty) || 0;
          const longCostBasis =
            Number((pos as any)?.long_cost_basis ?? (pos as any)?.longCostBasis) || 0;
          const shortEntryPrice =
            Number((pos as any)?.short_entry_price ?? (pos as any)?.shortEntryPrice) || 0;

          const longQty = longAvailQty + longReservedQty;
          const shortQty = shortAvailQty + shortReservedQty;
          qtySum += longQty + shortQty;
          const longLegValue = longQty * longCostBasis;
          const shortLegLiability = shortQty * shortEntryPrice;
          totalLongQty += longQty;
          totalShortQty += shortQty;
          totalLongValue += longLegValue;
          totalShortLiability += shortLegLiability;
          valueSum += longLegValue - shortLegLiability;
        }
        startHoldingsValue = toTwoDp(valueSum);
        setHoldingsQty(qtySum);
        setHoldingsValue(startHoldingsValue);
        setLongQty(totalLongQty);
        setShortQty(totalShortQty);
        setLongValue(toTwoDp(totalLongValue));
        setShortLiability(toTwoDp(totalShortLiability));
      }
      if (
        typeof (payload as any)?.starting_net_worth !== "number" &&
        startAvailCash != null
      ) {
        const baselineNetWorth = toTwoDp(
          startAvailCash + (startReservedCash ?? 0) + startHoldingsValue
        );
        setStartingNetWorth(baselineNetWorth);
      }
      const tickers = Array.isArray(payload.starting_tickers)
        ? payload.starting_tickers
        : [];
      const positionTickers =
        payload.positions && typeof payload.positions === "object"
          ? Object.keys(payload.positions)
          : [];
      syncTickerRegistry([...tickers, ...positionTickers]);

      if (Array.isArray(payload.logbook)) {
        const entries = payload.logbook as OrderLogbookEntry[];
        const { pending } = mapLogbookEntries(entries);
        setPendingTrades(
          pending
            .slice()
            .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0))
            .map((entry) => toPendingLogItem(entry, "Open"))
        );

        const pendingMap = new Map<string, PendingOrderSnapshot>();
        let nextReservedCash = 0;
        for (const entry of pending) {
          const qty = Number(entry.qty) || 0;
          const qtyLeft = Number(entry.qty_left) || 0;
          const reservedFunds = Number(entry.reserved_funds) || 0;
          const snapshot: PendingOrderSnapshot = {
            orderId: entry.order_id,
            ticker: entry.ticker,
            action: entry.action,
            orderType: normalizeOrderType(entry.order_type),
            qty,
            qtyLeft,
            reservedFunds,
            ts: entry.ts,
          };
          pendingMap.set(entry.order_id, snapshot);
          nextReservedCash += reservedFunds;
        }
        pendingOrderStateRef.current = pendingMap;
        setReservedCash(toTwoDp(nextReservedCash));
      }
      if (Array.isArray(payload.fills)) {
        const fills = (payload.fills as OrderFillEntry[])
          .slice()
          .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
        setPastTrades(fills.map((fill) => toPastTradeLogItem(fill)));
        for (const fill of fills) {
          if (typeof fill.fill_id === "string" && fill.fill_id.length > 0) {
            processedOrderFillEventsRef.current.add(fill.fill_id);
          }
        }
      }

      applyPreloadedTickData(payload);
    },
    [
      applyPreloadedTickData,
      applyStartMetadata,
      setCurrentCash,
      setHoldingsQty,
      setHoldingsValue,
      setLongQty,
      setShortQty,
      setLongValue,
      setShortLiability,
      setReservedCash,
      setStartingNetWorth,
      syncTickerRegistry,
    ]
  );

  const handleNextTickPayload = useCallback(
    (payload: NextTickRespPayload) => {
      const raw = payload as any;
      const data = raw?.data ?? raw;
      const gameState = raw?.gameState ?? raw;
      if (raw?.available_tools && typeof raw.available_tools === "object") {
        const tools = raw.available_tools as Record<string, unknown>;
        setAvailableTools({
          ...Object.fromEntries(
            Object.entries(tools).map(([toolKey, enabled]) => [toolKey, !!enabled])
          ),
          news: !!tools.news,
          market_order: !!tools.market_order,
          short_selling: !!tools.short_selling,
          limit_order: !!tools.limit_order,
          stop_order: !!tools.stop_order,
          stop_limit_order: !!tools.stop_limit_order,
          bid_ask_spread: !!tools.bid_ask_spread,
          moving_average: !!tools.moving_average,
          exponential_moving_average: !!tools.exponential_moving_average,
          interest_rate_panel: !!tools.interest_rate_panel,
          inflation_panel: !!tools.inflation_panel,
          drawdown_panel: !!tools.drawdown_panel,
          portfolio_allocation_panel: !!tools.portfolio_allocation_panel,
          sector_exposure_panel: !!tools.sector_exposure_panel,
          fundamentals_panel: !!tools.fundamentals_panel,
          correlation_panel: !!tools.correlation_panel,
          beta_volatility_panel: !!tools.beta_volatility_panel,
          benchmark_panel: !!tools.benchmark_panel,
          rebalancing_prompt: !!tools.rebalancing_prompt,
        });
      }

      const tickNum =
        typeof raw?.tick === "number"
          ? raw.tick
          : typeof gameState?.tick === "number"
            ? gameState.tick
            : null;
      const baseDate = startDateRef.current ?? raw.start_date;
      const dateStr =
        typeof baseDate === "string" && tickNum != null
          ? addDaysToYmd(baseDate, tickNum)
          : null;

      if (!initialTickHandledRef.current) {
        initialTickHandledRef.current = true;
        setIsConnecting(false);
        setGameStarted(true);
        setTimerArmed(false);
        if (isResuming && shouldShowResumeConfirm(payload)) {
          setIsResumeConfirmOpen(true);
        }
      }

      const drawdownToolEnabled =
        typeof raw?.available_tools?.drawdown_panel === "boolean"
          ? Boolean(raw.available_tools.drawdown_panel)
          : null;
      if (gameState && typeof gameState === "object") {
        applyPortfolioFromGameState(gameState as Record<string, unknown>, {
          drawdownToolEnabled,
        });
      } else if (raw.positions && typeof raw.positions === "object") {
        applyPortfolioFromGameState(raw as Record<string, unknown>, {
          drawdownToolEnabled,
        });
      }
      if (typeof raw.avail_cash === "number") {
        setCurrentCash(toTwoDp(raw.avail_cash));
      }
      if (typeof raw.reserved_cash === "number") {
        setReservedCash(toTwoDp(raw.reserved_cash));
      }

      setTurnKey((prev) => prev + 1);

      const nextTickers = normalizeTickerList(raw.starting_tickers);
      if (typeof raw.starting_cash === "number") {
        setStartingCash(toTwoDp(raw.starting_cash));
      }
      if (typeof raw.reserved_cash === "number") {
        setReservedCash(toTwoDp(raw.reserved_cash));
      }

      const snapshotByTicker: Record<string, ParsedTickerSnapshot> = {};
      const bestBidByTickerUpdate: Record<string, number | null> = {};
      const bestAskByTickerUpdate: Record<string, number | null> = {};
      const orderBookByTickerUpdate: Record<
        string,
        { bids: OrderBookLevel[]; asks: OrderBookLevel[] }
      > = {};
      const parsedDataObject =
        data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      if (parsedDataObject) {
        for (const [key, value] of Object.entries(parsedDataObject)) {
          if (NON_TICKER_DATA_KEYS.has(key.toLowerCase())) continue;
          const ticker = normalizeTicker(key);
          if (!ticker) continue;
          const topOfBook = parseOrderBookSnapshot(value);
          bestBidByTickerUpdate[ticker] = topOfBook.bestBid;
          bestAskByTickerUpdate[ticker] = topOfBook.bestAsk;
          orderBookByTickerUpdate[ticker] = {
            bids: topOfBook.bids,
            asks: topOfBook.asks,
          };
          const snapshot = parseTickerSnapshot(value);
          if (!snapshot) continue;
          snapshotByTicker[ticker] = snapshot;
        }
      }
      const snapshotTickers = Object.keys(snapshotByTicker);
      syncTickerRegistry([...nextTickers, ...snapshotTickers]);

      if (dateStr && snapshotTickers.length > 0) {
        setAllPointsByTicker((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const ticker of snapshotTickers) {
            const existingPoints = next[ticker] ?? [];
            if (hasPointForDate(existingPoints, dateStr)) continue;
            const snapshot = snapshotByTicker[ticker];
            const nextPoint: CandlePoint = {
              time: toBusinessDay(dateStr) as any,
              open: snapshot.open,
              high: snapshot.high,
              low: snapshot.low,
              close: snapshot.close,
            };
            next[ticker] = [...existingPoints, nextPoint];
            changed = true;
          }
          return changed ? next : prev;
        });
      }

      if (snapshotTickers.length > 0) {
        setLivePriceByTicker((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const ticker of snapshotTickers) {
            const close = snapshotByTicker[ticker].close;
            if (next[ticker] === close) continue;
            next[ticker] = close;
            changed = true;
          }
          return changed ? next : prev;
        });
      }
      if (Object.keys(bestBidByTickerUpdate).length > 0) {
        setBestBidByTicker((prev) => ({ ...prev, ...bestBidByTickerUpdate }));
      }
      if (Object.keys(bestAskByTickerUpdate).length > 0) {
        setBestAskByTicker((prev) => ({ ...prev, ...bestAskByTickerUpdate }));
      }
      if (Object.keys(orderBookByTickerUpdate).length > 0) {
        setOrderBookByTicker((prev) => ({ ...prev, ...orderBookByTickerUpdate }));
      }

      const parsedNewsByTicker: Record<string, NewsFeedItem[]> = {};
      const discoveredNewsTickers = new Set<string>();
      const rawNews = (data as any)?.news ?? raw.news;
      const tickKey = String(tickNum ?? "unknown");
      const newsTimestamp = dateStr ?? tickKey;
      const appendNews = (
        tickerBucket: string,
        parsedEntry: ParsedNewsEntry
      ) => {
        const bucket = tickerBucket || GLOBAL_NEWS_KEY;
        if (bucket !== GLOBAL_NEWS_KEY) discoveredNewsTickers.add(bucket);
        if (!parsedNewsByTicker[bucket]) parsedNewsByTicker[bucket] = [];
        newsSequenceRef.current += 1;
        parsedNewsByTicker[bucket].push({
          id: `${tickKey}-news-${bucket}-${newsSequenceRef.current}`,
          headline: parsedEntry.headline,
          content: parsedEntry.content,
          ticker: bucket === GLOBAL_NEWS_KEY ? null : bucket,
          timestamp: newsTimestamp,
        });
      };

      if (Array.isArray(rawNews)) {
        for (const entry of rawNews) {
          const parsedEntry = parseNewsEntry(entry);
          if (!parsedEntry) continue;
          appendNews(parsedEntry.ticker ?? GLOBAL_NEWS_KEY, parsedEntry);
        }
      } else if (rawNews && typeof rawNews === "object") {
        const singleNewsEntry = parseNewsEntry(rawNews);
        if (singleNewsEntry) {
          appendNews(singleNewsEntry.ticker ?? GLOBAL_NEWS_KEY, singleNewsEntry);
        } else {
        for (const [rawTicker, entries] of Object.entries(
          rawNews as Record<string, unknown>
        )) {
          const ticker = normalizeTicker(rawTicker) || GLOBAL_NEWS_KEY;
          if (Array.isArray(entries)) {
            for (const entry of entries) {
              const parsedEntry = parseNewsEntry(entry);
              if (!parsedEntry) continue;
              appendNews(ticker, parsedEntry);
            }
            continue;
          }
          const parsedEntry = parseNewsEntry(entries);
          if (!parsedEntry) continue;
          appendNews(ticker, parsedEntry);
        }
        }
      } else if (typeof rawNews === "string") {
        const parsedEntry = parseNewsEntry(rawNews);
        if (parsedEntry) appendNews(GLOBAL_NEWS_KEY, parsedEntry);
      }

      if (discoveredNewsTickers.size > 0) {
        syncTickerRegistry(Array.from(discoveredNewsTickers));
      }
      if (Object.keys(parsedNewsByTicker).length > 0) {
        setAvailableTools((prev) =>
          prev.news ? prev : { ...prev, news: true }
        );
        setNewsFeedByTicker((prev) => {
          let changed = false;
          const next = { ...prev };
          for (const [ticker, items] of Object.entries(parsedNewsByTicker)) {
            if (items.length === 0) continue;
            next[ticker] = [...items, ...(next[ticker] ?? [])];
            changed = true;
          }
          return changed ? next : prev;
        });
      }

      const rawMacroEvents = (data as any)?.macro_events ?? raw.macro_events;
      if (Array.isArray(rawMacroEvents) && rawMacroEvents.length > 0) {
        const parsedMacroEvents = rawMacroEvents
          .filter((entry) => entry && typeof entry === "object")
          .map((entry) => entry as Record<string, unknown>)
          .filter(
            (entry) =>
              typeof entry.factor_key === "string" &&
              typeof entry.title === "string" &&
              typeof entry.content === "string"
          )
          .map((entry) => ({
            factor_key: String(entry.factor_key),
            title: String(entry.title),
            content: String(entry.content),
          }));

        if (parsedMacroEvents.length > 0) {
          const latestByFactor = new Map<string, { title: string; content: string }>();
          for (const event of parsedMacroEvents) {
            latestByFactor.set(event.factor_key, {
              title: event.title,
              content: event.content,
            });
          }
          setMacroFactors((prev) => {
            if (prev.length === 0) return prev;
            let changed = false;
            const next = prev.map((factor) => {
              const latest = latestByFactor.get(factor.factor_key);
              if (!latest) return factor;
              changed = true;
              return {
                ...factor,
                latest_event_title: latest.title,
                latest_event_content: latest.content,
                last_event_tick: tickNum ?? null,
              };
            });
            return changed ? next : prev;
          });
        }
      }

      const totalTicks = totalTicksRef.current;
      if (
        typeof totalTicks === "number" &&
        tickNum != null &&
        tickNum >= totalTicks
      ) {
        applyGameEndPayload(raw, gameState);
      }

      if (Array.isArray(payload.logbook)) {
        const entries = payload.logbook as OrderLogbookEntry[];
        const { pending } = mapLogbookEntries(entries);
        setPendingTrades(
          pending
            .slice()
            .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0))
            .map((entry) => toPendingLogItem(entry, "Open"))
        );

        const pendingMap = new Map<string, PendingOrderSnapshot>();
        let nextReservedCash = 0;
        for (const entry of pending) {
          const qty = Number(entry.qty) || 0;
          const qtyLeft = Number(entry.qty_left) || 0;
          const reservedFunds = Number(entry.reserved_funds) || 0;
          const snapshot: PendingOrderSnapshot = {
            orderId: entry.order_id,
            ticker: entry.ticker,
            action: entry.action,
            orderType: normalizeOrderType(entry.order_type),
            qty,
            qtyLeft,
            reservedFunds,
            ts: entry.ts,
          };
          pendingMap.set(entry.order_id, snapshot);
          nextReservedCash += reservedFunds;
        }
        pendingOrderStateRef.current = pendingMap;
        setReservedCash(toTwoDp(nextReservedCash));
      }

      if (Array.isArray(payload.fills)) {
        const fills = (payload.fills as OrderFillEntry[])
          .slice()
          .sort((a, b) => (a.ts < b.ts ? 1 : a.ts > b.ts ? -1 : 0));
        setPastTrades(fills.map((fill) => toPastTradeLogItem(fill)));
        for (const fill of fills) {
          if (typeof fill.fill_id === "string" && fill.fill_id.length > 0) {
            processedOrderFillEventsRef.current.add(fill.fill_id);
          }
        }
      }
    },
    [
      applyPortfolioFromGameState,
      applyGameEndPayload,
      isResuming,
      setCurrentCash,
      setAllPointsByTicker,
      setLivePriceByTicker,
      setMacroFactors,
      setNewsFeedByTicker,
      setReservedCash,
      setStartingCash,
      syncTickerRegistry,
    ]
  );

  const handlePriceTickPayload = useCallback(
    (payload: PriceTickPayload) => {
      if (typeof payload.price !== "number") return;
      const parsedTicker = normalizeTicker(payload.ticker);

      if (parsedTicker) {
        syncTickerRegistry([parsedTicker]);
        setLivePriceByTicker((prev) => ({
          ...prev,
          [parsedTicker]: toTwoDp(payload.price as number),
        }));
        return;
      }

      const selected = startingTickerRef.current;
      if (!selected) return;
      if (availableTickersRef.current.length > 1) return;
      setLivePriceByTicker((prev) => ({
        ...prev,
        [selected]: toTwoDp(payload.price as number),
      }));
    },
    [setLivePriceByTicker, syncTickerRegistry]
  );

  const handleOrderResponse = useCallback(
    (payload: RegisterOrderResp) => {
      if (payload.result === "PASS") {
        const nextPendingOrder: PendingOrderSnapshot = {
          orderId: payload.order_id,
          ticker: payload.ticker,
          action: payload.action,
          orderType: normalizeOrderType(payload.order_type),
          qty: 0,
          qtyLeft: 0,
          reservedFunds: toTwoDp(payload.reserved),
          ts: new Date().toISOString(),
        };
        pendingOrderStateRef.current.set(payload.order_id, nextPendingOrder);
        const reservedNow = Array.from(
          pendingOrderStateRef.current.values()
        ).reduce((sum, order) => sum + order.reservedFunds, 0);
        setReservedCash(toTwoDp(reservedNow));
        toast({
          title: "Order Registered",
          message: `Order ${payload.order_id} reserved $${toTwoDp(payload.reserved).toFixed(2)}`,
          variant: "success",
          durationMs: 5000,
        });
        setPendingTrades((prev) => {
          if (prev.some((item) => item.id === payload.order_id)) return prev;
          return [
            {
              id: payload.order_id,
              type: getOrderActionLogType(nextPendingOrder.action),
              title: `${getOrderActionLabel(nextPendingOrder.action)} ${nextPendingOrder.ticker}`,
              message: `${nextPendingOrder.orderType} pending`,
              timestamp: nextPendingOrder.ts,
            },
            ...prev,
          ];
        });
      } else {
        toast({
          title: "Order Failed",
          message: payload.reason,
          variant: "danger",
          durationMs: 5000,
        });
      }
    },
    [setReservedCash]
  );

  const handleOrderFilled = useCallback(
    (payload: OrderFilledPayload) => {
      if (!payload || typeof payload !== "object") return;
      const order = payload.order;
      const fill = payload.fill;
      if (!order || !fill) return;

      const fillId =
        typeof fill.fill_id === "string" ? fill.fill_id.trim() : "";
      if (!fillId) return;
      if (processedOrderFillEventsRef.current.has(fillId)) return;
      processedOrderFillEventsRef.current.add(fillId);

      const qty = Number(order.qty) || 0;
      const qtyLeft = Math.max(0, Number(order.qty_left) || 0);
      const reservedFunds = Math.max(0, Number(order.reserved_funds) || 0);
      const action: OrderAction = order.action;

      const snapshot: PendingOrderSnapshot = {
        orderId: order.order_id,
        ticker: order.ticker,
        action,
        orderType: normalizeOrderType(order.order_type),
        qty,
        qtyLeft,
        reservedFunds,
        ts: order.ts,
      };

      if (qtyLeft > 0 || reservedFunds > 0) {
        pendingOrderStateRef.current.set(order.order_id, snapshot);
      } else {
        pendingOrderStateRef.current.delete(order.order_id);
      }

      const reservedNow = Array.from(
        pendingOrderStateRef.current.values()
      ).reduce((sum, pendingOrder) => sum + pendingOrder.reservedFunds, 0);
      setReservedCash(toTwoDp(reservedNow));

      setPendingTrades((prev) => {
        if (qtyLeft <= 0) return prev.filter((item) => item.id !== order.order_id);
        const nextItem = buildPendingTradeItem(snapshot);
        const next = prev.filter((item) => item.id !== order.order_id);
        return [nextItem, ...next];
      });

      const filledNow = Math.max(0, Number(fill.qty) || 0);
      if (filledNow > 0) {
        const nextPastTrade = toPastTradeLogItem(fill);
        setPastTrades((prev) => {
          if (prev.some((item) => item.id === nextPastTrade.id)) return prev;
          return [nextPastTrade, ...prev];
        });
      }

      if (payload.gameState && typeof payload.gameState === "object") {
        applyPortfolioFromGameState(payload.gameState as Record<string, unknown>);
      }

      const statusText =
        qtyLeft > 0
          ? `Filled ${filledNow}, ${qtyLeft} left`
          : `Filled ${filledNow}, order complete`;
      toast({
        title: `${getOrderActionLabel(action)} ${order.ticker} filled`,
        message: statusText,
        variant: "success",
        durationMs: 5000,
      });
    },
    [applyPortfolioFromGameState, setReservedCash]
  );

  const tickerGlance = useMemo<TickerGlanceData[]>(() => {
    const globalNews = newsFeedByTicker[GLOBAL_NEWS_KEY] ?? [];
    return availableTickers.map((ticker) => {
      const points = allPointsByTicker[ticker] ?? [];
      const metrics = computeAssetPriceMetrics(points, livePriceByTicker[ticker]);
      const tickerNews = newsFeedByTicker[ticker] ?? [];
      return {
        ticker,
        currentPrice: metrics.currentAssetPrice,
        priceDelta: metrics.assetPriceDelta,
        latestNewsHeadline:
          tickerNews[0]?.headline ?? globalNews[0]?.headline ?? null,
        hasNews: tickerNews.length > 0 || globalNews.length > 0,
        newsCount: tickerNews.length + globalNews.length,
      };
    });
  }, [allPointsByTicker, availableTickers, livePriceByTicker, newsFeedByTicker]);

  const selectedBestBid = useMemo(() => {
    const ticker = startingTicker;
    if (!ticker) return null;
    return bestBidByTicker[ticker] ?? null;
  }, [bestBidByTicker, startingTicker]);

  const selectedBestAsk = useMemo(() => {
    const ticker = startingTicker;
    if (!ticker) return null;
    return bestAskByTicker[ticker] ?? null;
  }, [bestAskByTicker, startingTicker]);

  const selectedSpread = useMemo(() => {
    if (selectedBestBid == null || selectedBestAsk == null) return null;
    return toTwoDp(Math.max(0, selectedBestAsk - selectedBestBid));
  }, [selectedBestAsk, selectedBestBid]);

  const selectedOrderBook = useMemo(() => {
    const ticker = startingTicker;
    if (!ticker) return { bids: [], asks: [] } as {
      bids: OrderBookLevel[];
      asks: OrderBookLevel[];
    };
    return orderBookByTicker[ticker] ?? { bids: [], asks: [] };
  }, [orderBookByTicker, startingTicker]);

  return {
    sessionState: {
      allPoints,
      livePrice,
      startingTicker,
      availableTickers,
      tickerGlance,
      gameStarted,
      pastTrades,
      pendingTrades,
      newsFeed,
      readNewsById,
      hasUnreadNews,
      levelId,
      levelContext,
      unlocks,
      availableTools,
      macroFactors,
      passingCriteria,
      bonusMissions,
      gameEnd,
      showGameEnd,
      isConnecting,
      turnKey,
      timerArmed,
      forceNextTurnOpen,
      isResumeConfirmOpen,
      isManualTickMode,
      manualStartRequired,
      bestBid: selectedBestBid,
      bestAsk: selectedBestAsk,
      spread: selectedSpread,
      orderBookBids: selectedOrderBook.bids,
      orderBookAsks: selectedOrderBook.asks,
      portfolio,
    },
    actions: {
      setShowGameEnd,
      setTurnKey,
      setTimerArmed,
      setForceNextTurnOpen,
      setIsResumeConfirmOpen,
      setGameStarted,
      setIsConnecting,
      setSelectedTicker,
      markNewsAsRead,
    },
    capabilities: {
      canManualAdvance: isManualTickMode,
    },
    refs: {
      selectedTickerRef: startingTickerRef,
      startingTickerRef,
    },
    resetState,
    handleStartPayload,
    handleNextTickPayload,
    handlePriceTickPayload,
    handleGameOverPayload: applyGameEndPayload,
    handleOrderResponse,
    handleOrderFilled,
  };
}
