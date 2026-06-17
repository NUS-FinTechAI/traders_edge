export interface MissionDefinition {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  mission_params?: Record<string, unknown>;
}

export interface TickerMetadataDefinition {
  company_name: string;
  company_description: string;
  sector_key: string;
  pe_ratio: number | null;
  roe_pct: number | null;
  debt_to_equity: number | null;
  beta: number | null;
  volatility_hint: number | null;
  ticker_tags: string[];
}

export interface ReferencePortfolioComponentDefinition {
  ticker: string;
  weight: number;
  display_order: number;
}

export interface ReferencePortfolioDefinition {
  reference_key: string;
  reference_role: "benchmark" | "reference";
  title: string;
  description: string;
  display_order: number;
  components: ReferencePortfolioComponentDefinition[];
}

export interface PortfolioAllocationEntry {
  ticker: string;
  weight: number;
  value: number;
  qty?: number;
  long_qty?: number;
  short_qty?: number;
}

export interface PortfolioSectorEntry {
  sector_key: string;
  weight: number;
  value: number;
}

export interface PortfolioRiskSummary {
  invested_value: number;
  largest_position_weight: number;
  largest_sector_weight: number;
  hhi: number;
  beta: number | null;
  volatility: number | null;
  average_correlation: number | null;
  min_avg_abs_correlation?: number | null;
}

export interface PortfolioBenchmarkSummary {
  benchmark_key: string | null;
  portfolio_return: number | null;
  benchmark_return: number | null;
  excess_return: number | null;
}

export interface PortfolioReferenceSummary {
  reference_key: string;
  role: "benchmark" | "reference";
  title: string;
  return_pct: number;
  excess_return: number;
}

export interface PortfolioWarningSummary {
  rebalance_due: boolean;
  messages: string[];
}

export interface PortfolioAnalytics {
  allocation: PortfolioAllocationEntry[];
  sectors: PortfolioSectorEntry[];
  risk: PortfolioRiskSummary;
  benchmark: PortfolioBenchmarkSummary;
  references: PortfolioReferenceSummary[];
  warnings: PortfolioWarningSummary;
}

export interface MacroFactorDefinition {
  factor_key: string;
  title: string;
  current_value: number;
  previous_value?: number | null;
  last_change_bps?: number | null;
  market_stance_note: string;
  display_order: number;
  latest_event_title?: string | null;
  latest_event_content?: string | null;
  last_event_tick?: number | null;
}

export interface MacroEventDefinition {
  factor_key: string;
  title: string;
  content: string;
  ticker?: string | null;
}

export interface PassingCriteria {
  type: string;
  missions: MissionDefinition[];
}

export interface AvailableTools {
  news: boolean;
  market_order: boolean;
  short_selling: boolean;
  limit_order: boolean;
  stop_order: boolean;
  stop_limit_order: boolean;
  bid_ask_spread: boolean;
  moving_average: boolean;
  exponential_moving_average: boolean;
  interest_rate_panel: boolean;
  inflation_panel: boolean;
  drawdown_panel: boolean;
  portfolio_allocation_panel: boolean;
  sector_exposure_panel: boolean;
  fundamentals_panel: boolean;
  correlation_panel: boolean;
  beta_volatility_panel: boolean;
  benchmark_panel: boolean;
  rebalancing_prompt: boolean;
  [key: string]: boolean;
}

export interface UnlockPayloadObject {
  feature:
    | "news"
    | "market_order"
    | "short_selling"
    | "limit_order"
    | "stop_order"
    | "stop_limit_order"
    | "bid_ask_spread"
    | (string & {});
  title: string;
  description: string;
  tool_tutorial_id?: string;
}

export interface StartRespPayload {
  level_id?: string;
  start_date?: string; // ISO YYYY-MM-DD
  end_date?: string;   // ISO YYYY-MM-DD
  interval?: string;   // e.g., '1d'
  total_ticks?: number;
  preloaded_ticks?: number;
  preloaded_until_tick?: number;
  preloaded_tick_data?: PreloadedTickDataEntry[];
  starting_tickers?: string[];
  starting_cash?: number;
  starting_net_worth?: number;
  context?: string;
  level_tutorial_id?: string | null;
  tick_mode?: "manual" | "auto";
  manual_start?: boolean;
  final_cash_points_multiplier?: number;
  passing_criteria?: PassingCriteria;
  bonus_missions?: MissionDefinition[];
  unlocks?: UnlockPayloadObject[];
  available_tools?: AvailableTools;
  ticker_metadata?: Record<string, TickerMetadataDefinition>;
  reference_portfolios?: ReferencePortfolioDefinition[];
  portfolio_analytics?: PortfolioAnalytics;
  macro_factors?: MacroFactorDefinition[];
  macro_events?: MacroEventDefinition[];
  avail_cash?: number;
  reserved_cash?: number;
  positions?: Record<
    string,
    {
      long_avail_qty: number;
      long_reserved_qty: number;
      long_cost_basis: number;
      short_avail_qty: number;
      short_reserved_qty: number;
      short_entry_price: number;
    }
  >;
  logbook?: OrderLogbookEntry[] | GameUpdateLogbookByDate | unknown[];
  fills?: OrderFillEntry[];
  tick?: number;
}

export interface NextTurnTickerSnapshot {
  [metric: string]: unknown;
}

export interface PreloadedTickDataEntry {
  tick: number;
  data: Record<string, NextTurnTickerSnapshot | unknown>;
}

export interface NextTickRespPayload {
  level_id?: string;
  data?: Record<string, NextTurnTickerSnapshot>;
  gameState?: Record<string, unknown> & {
    availCash?: number;
    reservedCash?: number;
    totalValueAllStocks?: number;
    netWorth?: number;
    totalPL?: number;
    drawdown_pct?: number;
    max_drawdown_pct?: number;
    portfolio_analytics?: PortfolioAnalytics;
    tick?: number;
  };
  news?: unknown;
  start_date?: string;
  end_date?: string;
  interval?: string;
  total_ticks?: number;
  preloaded_ticks?: number;
  preloaded_until_tick?: number;
  preloaded_tick_data?: PreloadedTickDataEntry[];
  starting_tickers?: string[];
  starting_cash?: number;
  starting_net_worth?: number;
  context?: string;
  level_tutorial_id?: string | null;
  tick_mode?: "manual" | "auto";
  manual_start?: boolean;
  final_cash_points_multiplier?: number;
  passing_criteria?: PassingCriteria;
  bonus_missions?: MissionDefinition[];
  unlocks?: UnlockPayloadObject[];
  available_tools?: AvailableTools;
  ticker_metadata?: Record<string, TickerMetadataDefinition>;
  reference_portfolios?: ReferencePortfolioDefinition[];
  portfolio_analytics?: PortfolioAnalytics;
  macro_factors?: MacroFactorDefinition[];
  macro_events?: MacroEventDefinition[];
  avail_cash?: number;
  reserved_cash?: number;
  positions?: Record<
    string,
    {
      long_avail_qty: number;
      long_reserved_qty: number;
      long_cost_basis: number;
      short_avail_qty: number;
      short_reserved_qty: number;
      short_entry_price: number;
    }
  >;
  logbook?: OrderLogbookEntry[] | GameUpdateLogbookByDate | unknown[];
  fills?: OrderFillEntry[];
  tick?: number;
  [ticker: string]: NextTurnTickerSnapshot | unknown;
}

export interface PriceTickPayload {
  price?: number;
  ticker?: string;
  [key: string]: unknown;
}

export interface TickerGlanceData {
  ticker: string;
  currentPrice: number | null;
  priceDelta: number | null;
  latestNewsHeadline: string | null;
  hasNews: boolean;
  newsCount: number;
}

export interface OrderBookLevel {
  price: number;
  quantity: number | null;
}

export interface NewsFeedItem {
  id: string;
  headline: string;
  content: string;
  timestamp?: string;
  ticker: string | null;
}

export type OrderType = "Market" | "Limit" | "Stop" | "StopLimit";

export type OrderAction = "Buy" | "Sell" | "SellShort" | "BuyToCover";

export interface OrderLogbookEntry {
  order_id: string;
  user_id: string;
  action: OrderAction;
  direction?: "Buy" | "Sell";
  order_type: OrderType;
  ticker: string;
  status: string;
  qty: number;
  qty_left: number;
  price: number | null;
  stop_price: number | null;
  price_filled: number | null;
  reserved_funds: number;
  tick: number;
  filled_tick: number | null;
  ts: string;
}

export interface OrderFillEntry {
  fill_id: string;
  order_id: string;
  user_id: string;
  action: OrderAction;
  direction: "Buy" | "Sell";
  order_type: OrderType;
  ticker: string;
  qty: number;
  qty_left: number;
  price: number;
  cumulative_qty_filled: number;
  tick: number;
  ts: string;
}

export interface OrderFilledPayload {
  order: OrderLogbookEntry;
  fill: OrderFillEntry;
  gameState: Record<string, unknown> & {
    availCash?: number;
    reservedCash?: number;
    totalValueAllStocks?: number;
    netWorth?: number;
    totalPL?: number;
    tick?: number;
  };
}

export interface RegisterOrderSuccessResp {
  result: 'PASS';
  order_id: string;
  reserved: number;
  order_type: OrderType;
  action: OrderAction;
  ticker: string;
}

export interface RegisterOrderFailResp {
  result: 'FAIL';
  order_id: string;
  reason: string;
}

export type RegisterOrderResp = RegisterOrderSuccessResp | RegisterOrderFailResp;

export interface OrderFilledEnvelope {
  event: 'orderFilled';
  data: OrderFilledPayload;
}

// WebSocket Game Update Response Types
export type GameUpdateDirection = 'BUY' | 'SELL';

export type GameUpdateLogEntry = [GameUpdateDirection, number, number, string];

export interface GameUpdateLogbookByTicker {
  [ticker: string]: GameUpdateLogEntry[];
}

export interface GameUpdateLogbookByDate {
  [isoDate: string]: GameUpdateLogbookByTicker;
}

// WebSocket Game End Response Types
export interface GameEndRespPayload {
  netWorth: number;
  pnl: number;
  completed: number | boolean; // 1/0 or boolean
  totalPoints: number;
  finalCashPoints: number;
  missionPoints: number;
  bonusPoints: number;
  passingCash: number;
  endingCash: number;
  missionResults: GameEndMissionResult[];
}

export interface GameEndMissionProgress {
  completed: boolean;
  value: number | null;
}

export interface GameEndMissionResult {
  id: string;
  title: string;
  description: string;
  points: number;
  isBonus: boolean;
  completed: boolean;
  value: number | null;
}

