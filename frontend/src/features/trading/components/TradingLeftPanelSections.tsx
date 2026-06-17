import type { RefObject } from "react";
import { ChevronDown } from "lucide-react";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import type { OrderBookLevel, TickerGlanceData, TickerMetadataDefinition } from "../types/tradingTypes";

const DEFAULT_COMPANY_DESCRIPTION =
  "Review business quality, cyclical sensitivity, and portfolio fit before sizing.";

const formatMoney = (value: number | null): string =>
  value == null
    ? "--"
    : `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const formatMetric = (value: number | null | undefined, suffix = ""): string =>
  typeof value === "number" && Number.isFinite(value) ? `${value.toFixed(2)}${suffix}` : "--";

const formatPrice = (value: number | null): string => {
  if (value == null) return "--";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

interface TickerStripProps {
  availableTickers: string[];
  startingTicker: string | null;
  tickerGlance: TickerGlanceData[];
  onSelectTicker: (ticker: string) => void;
  cardBorderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
}

export function TickerStrip({
  availableTickers,
  startingTicker,
  tickerGlance,
  onSelectTicker,
  cardBorderClass,
  textPrimaryClass,
  textSecondaryClass,
}: TickerStripProps) {
  if (availableTickers.length <= 1) return null;

  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
      {availableTickers.map((ticker) => {
        const glance = tickerGlance.find((entry) => entry.ticker === ticker);
        const isActive = ticker === startingTicker;
        const delta = glance?.priceDelta ?? null;
        const deltaClass =
          delta == null
            ? textSecondaryClass
            : delta > 0
              ? THEME_CONFIG.colors.text.success
              : delta < 0
                ? THEME_CONFIG.colors.text.danger
                : textSecondaryClass;
        return (
          <button
            key={ticker}
            type="button"
            onClick={() => onSelectTicker(ticker)}
            className={`min-w-[126px] rounded-lg border px-3 py-2 text-left transition-all duration-200 ${
              isActive
                ? "border-emerald-500 bg-emerald-50/70 dark:bg-emerald-900/20 ring-1 ring-emerald-500/50"
                : `${cardBorderClass} bg-white/70 dark:bg-slate-800/50 hover:-translate-y-0.5 hover:shadow-md`
            }`}
          >
            <div className={`text-sm font-semibold ${textPrimaryClass}`}>{ticker}</div>
            <div className={`text-xs ${textSecondaryClass}`}>
              {glance?.currentPrice != null
                ? `$${glance.currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "--"}
            </div>
            <div className={`text-[11px] ${deltaClass}`}>
              {delta == null ? "No change yet" : `${delta >= 0 ? "+" : ""}${delta.toFixed(2)}`}
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface IndicatorPanelProps {
  indicatorPanelRef?: RefObject<HTMLDivElement | null>;
  showMovingAverageTool: boolean;
  showExponentialMovingAverageTool: boolean;
  showMovingAverageLine: boolean;
  showExponentialMovingAverageLine: boolean;
  movingAveragePeriod: number;
  exponentialMovingAveragePeriod: number;
  movingAverageValue: number | null;
  exponentialMovingAverageValue: number | null;
  onToggleMovingAverageLine?: (next: boolean) => void;
  onToggleExponentialMovingAverageLine?: (next: boolean) => void;
  cardBorderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
}

export function IndicatorPanel({
  indicatorPanelRef,
  showMovingAverageTool,
  showExponentialMovingAverageTool,
  showMovingAverageLine,
  showExponentialMovingAverageLine,
  movingAveragePeriod,
  exponentialMovingAveragePeriod,
  movingAverageValue,
  exponentialMovingAverageValue,
  onToggleMovingAverageLine,
  onToggleExponentialMovingAverageLine,
  cardBorderClass,
  textPrimaryClass,
  textSecondaryClass,
}: IndicatorPanelProps) {
  if (!showMovingAverageTool && !showExponentialMovingAverageTool) {
    return null;
  }

  const indicatorCount =
    (showMovingAverageTool ? 1 : 0) + (showExponentialMovingAverageTool ? 1 : 0);

  return (
    <div
      ref={indicatorPanelRef}
      className={`w-full rounded-lg border ${cardBorderClass} bg-slate-50/80 p-2 dark:bg-slate-900/30`}
    >
      <div className={`mb-2 text-[10px] uppercase tracking-wide ${textSecondaryClass}`}>
        Indicators
      </div>
      <div className={`grid gap-1.5 ${indicatorCount > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        {showMovingAverageTool ? (
          <label className="flex items-center justify-between gap-2 rounded border border-slate-200/60 bg-white/70 px-1.5 py-1 text-xs dark:border-slate-700/70 dark:bg-slate-800/60">
            <span className={`flex items-center gap-2 ${textPrimaryClass}`}>
              <input
                type="checkbox"
                checked={showMovingAverageLine}
                onChange={(event) => onToggleMovingAverageLine?.(event.target.checked)}
                className="h-3.5 w-3.5 accent-blue-600"
              />
              MA({movingAveragePeriod})
            </span>
            <span className={`font-medium ${textPrimaryClass}`}>{formatMoney(movingAverageValue)}</span>
          </label>
        ) : null}
        {showExponentialMovingAverageTool ? (
          <label className="flex items-center justify-between gap-2 rounded border border-slate-200/60 bg-white/70 px-1.5 py-1 text-xs dark:border-slate-700/70 dark:bg-slate-800/60">
            <span className={`flex items-center gap-2 ${textPrimaryClass}`}>
              <input
                type="checkbox"
                checked={showExponentialMovingAverageLine}
                onChange={(event) =>
                  onToggleExponentialMovingAverageLine?.(event.target.checked)
                }
                className="h-3.5 w-3.5 accent-amber-500"
              />
              EMA({exponentialMovingAveragePeriod})
            </span>
            <span className={`font-medium ${textPrimaryClass}`}>
              {formatMoney(exponentialMovingAverageValue)}
            </span>
          </label>
        ) : null}
      </div>
    </div>
  );
}

interface CompanyInfoCardProps {
  tickerInfoCardRef?: RefObject<HTMLDivElement | null>;
  activeTicker: string | null;
  tickerMetadata: Record<string, TickerMetadataDefinition>;
  cardBorderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
}

export function CompanyInfoCard({
  tickerInfoCardRef,
  activeTicker,
  tickerMetadata,
  cardBorderClass,
  textPrimaryClass,
  textSecondaryClass,
}: CompanyInfoCardProps) {
  const activeTickerMetadata = activeTicker ? tickerMetadata[activeTicker] : undefined;
  const companyName = activeTickerMetadata?.company_name?.trim() || activeTicker || "Unknown";
  const companyDescription =
    activeTickerMetadata?.company_description?.trim() || DEFAULT_COMPANY_DESCRIPTION;
  const sectorKey = activeTickerMetadata?.sector_key || "unknown";
  const sectorLabel = sectorKey.replace(/_/g, " ");

  return (
    <div
      ref={tickerInfoCardRef}
      className={`w-[420px] max-w-full shrink-0 rounded-lg border ${cardBorderClass} bg-slate-50/70 px-3 py-2 dark:bg-slate-800/60`}
    >
      <div className="mt-1 flex items-stretch gap-3">
        <div className="min-w-[96px] shrink-0">
          <div className={`text-lg font-bold leading-tight ${textPrimaryClass}`}>
            {activeTicker ?? "--"}
          </div>
          <div className={`max-w-[160px] truncate text-[11px] ${textSecondaryClass}`}>
            {companyName}
          </div>
        </div>
        <div className="min-w-0 flex-1 border-l border-slate-300/70 pl-3">
          <div>
            <span className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200">
              {sectorLabel}
            </span>
          </div>
          <div
            className={`mt-1 pt-1 text-xs leading-snug break-words ${textSecondaryClass}`}
          >
            {companyDescription}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LastPriceCardProps {
  currentPriceCardRef?: RefObject<HTMLDivElement | null>;
  resolvedCurrentPrice: number | null;
  assetPriceDelta: number | null;
  cardBorderClass: string;
  textSecondaryClass: string;
}

export function LastPriceCard({
  currentPriceCardRef,
  resolvedCurrentPrice,
  assetPriceDelta,
  cardBorderClass,
  textSecondaryClass,
}: LastPriceCardProps) {
  const priceDirection =
    assetPriceDelta == null ? "flat" : assetPriceDelta > 0 ? "up" : assetPriceDelta < 0 ? "down" : "flat";
  const priceDeltaClass =
    priceDirection === "up"
      ? THEME_CONFIG.colors.text.success
      : priceDirection === "down"
        ? THEME_CONFIG.colors.text.danger
        : textSecondaryClass;
  const priceArrow = priceDirection === "up" ? "^" : priceDirection === "down" ? "v" : "o";

  return (
    <div
      ref={currentPriceCardRef}
      className={`min-w-[180px] rounded-lg border ${cardBorderClass} bg-slate-50/70 px-3 py-2 dark:bg-slate-800/60 h-full flex flex-col justify-center`}
    >
      <div className={`text-[10px] uppercase tracking-wide ${textSecondaryClass}`}>Last Price</div>
      <div className={`text-lg font-semibold ${priceDeltaClass}`}>{formatMoney(resolvedCurrentPrice)}</div>
      <div className={`text-[11px] ${priceDeltaClass}`}>
        {assetPriceDelta == null
          ? "No prior tick yet"
          : `${priceArrow} ${assetPriceDelta >= 0 ? "+" : ""}$${formatPrice(assetPriceDelta)}`}
      </div>
    </div>
  );
}

interface QualitySnapshotCardProps {
  tickerFundamentalsCardRef?: RefObject<HTMLDivElement | null>;
  showFundamentalMetrics: boolean;
  activeTicker: string | null;
  tickerMetadata: Record<string, TickerMetadataDefinition>;
  cardBorderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
}

export function QualitySnapshotCard({
  tickerFundamentalsCardRef,
  showFundamentalMetrics,
  activeTicker,
  tickerMetadata,
  cardBorderClass,
  textPrimaryClass,
  textSecondaryClass,
}: QualitySnapshotCardProps) {
  if (!showFundamentalMetrics) return null;
  const activeTickerMetadata = activeTicker ? tickerMetadata[activeTicker] : undefined;

  return (
    <div
      ref={tickerFundamentalsCardRef}
      className={`min-w-[220px] rounded-lg border ${cardBorderClass} bg-slate-50/70 px-3 py-2 dark:bg-slate-800/60 h-full flex flex-col justify-center`}
    >
      <div className={`mb-1 text-[10px] uppercase tracking-wide ${textSecondaryClass}`}>
        Quality Snapshot
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <div className={`text-[10px] ${textSecondaryClass}`}>P/E</div>
          <div className={`text-sm font-semibold ${textPrimaryClass}`}>
            {formatMetric(activeTickerMetadata?.pe_ratio)}
          </div>
        </div>
        <div>
          <div className={`text-[10px] ${textSecondaryClass}`}>ROE%</div>
          <div className={`text-sm font-semibold ${textPrimaryClass}`}>
            {formatMetric(activeTickerMetadata?.roe_pct, "%")}
          </div>
        </div>
        <div>
          <div className={`text-[10px] ${textSecondaryClass}`}>D/E</div>
          <div className={`text-sm font-semibold ${textPrimaryClass}`}>
            {formatMetric(activeTickerMetadata?.debt_to_equity)}
          </div>
        </div>
      </div>
    </div>
  );
}

interface BidAskPanelProps {
  bidAskCardRef?: RefObject<HTMLDivElement | null>;
  bidAskExpandToggleRef?: RefObject<HTMLButtonElement | null>;
  showBidAskCard: boolean;
  activeTicker: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  bestBid: number | null;
  bestAsk: number | null;
  spread: number | null;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  cardBorderClass: string;
  textPrimaryClass: string;
  textSecondaryClass: string;
}

export function BidAskPanel({
  bidAskCardRef,
  bidAskExpandToggleRef,
  showBidAskCard,
  activeTicker,
  isExpanded,
  onToggle,
  bestBid,
  bestAsk,
  spread,
  bids,
  asks,
  cardBorderClass,
  textPrimaryClass,
  textSecondaryClass,
}: BidAskPanelProps) {
  if (!showBidAskCard) return null;

  return (
    <div
      ref={bidAskCardRef}
      className={`rounded-lg border ${cardBorderClass} bg-slate-50/80 p-2.5 dark:bg-slate-900/35`}
    >
      <button
        ref={bidAskExpandToggleRef}
        type="button"
        onClick={onToggle}
        className="mb-2 flex w-full cursor-pointer items-center justify-between gap-2 text-left"
        aria-expanded={isExpanded}
      >
        <div>
          <div className={`text-[10px] uppercase tracking-wide ${textSecondaryClass}`}>
            Bid / Ask{activeTicker ? ` (${activeTicker})` : ""}
          </div>
          <div className={`text-[11px] ${textSecondaryClass}`}>
            {isExpanded ? "Order book depth expanded" : "Expand to view full depth"}
          </div>
        </div>
        <ChevronDown
          size={16}
          className={`${textSecondaryClass} transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <div className={`text-[11px] ${textSecondaryClass}`}>Bid</div>
          <div className={`font-semibold ${textPrimaryClass}`}>{formatMoney(bestBid)}</div>
        </div>
        <div>
          <div className={`text-[11px] ${textSecondaryClass}`}>Ask</div>
          <div className={`font-semibold ${textPrimaryClass}`}>{formatMoney(bestAsk)}</div>
        </div>
        <div>
          <div className={`text-[11px] ${textSecondaryClass}`}>Spread</div>
          <div className={`font-semibold ${textPrimaryClass}`}>{formatMoney(spread)}</div>
        </div>
      </div>
      {isExpanded ? (
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="rounded-md border border-emerald-300/60 bg-emerald-50/60 p-2 dark:border-emerald-500/40 dark:bg-emerald-900/10">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
              Bids
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
              {bids.length > 0 ? (
                bids.map((row, index) => (
                  <div
                    key={`bid-${row.price}-${index}`}
                    className={`flex items-center justify-between rounded px-1.5 py-1 text-xs ${
                      index === 0
                        ? "bg-emerald-200/80 font-semibold text-emerald-900 dark:bg-emerald-500/25 dark:text-emerald-100"
                        : "bg-white/70 text-slate-700 dark:bg-slate-900/35 dark:text-slate-200"
                    }`}
                  >
                    <span>${formatPrice(row.price)}</span>
                    <span>{row.quantity != null ? row.quantity.toLocaleString() : "--"}</span>
                  </div>
                ))
              ) : (
                <div className={`text-xs ${textSecondaryClass}`}>No bid depth available.</div>
              )}
            </div>
          </div>
          <div className="rounded-md border border-rose-300/60 bg-rose-50/60 p-2 dark:border-rose-500/40 dark:bg-rose-900/10">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
              Asks
            </div>
            <div className="max-h-52 space-y-1 overflow-y-auto pr-1">
              {asks.length > 0 ? (
                asks.map((row, index) => (
                  <div
                    key={`ask-${row.price}-${index}`}
                    className={`flex items-center justify-between rounded px-1.5 py-1 text-xs ${
                      index === 0
                        ? "bg-rose-200/80 font-semibold text-rose-900 dark:bg-rose-500/25 dark:text-rose-100"
                        : "bg-white/70 text-slate-700 dark:bg-slate-900/35 dark:text-slate-200"
                    }`}
                  >
                    <span>${formatPrice(row.price)}</span>
                    <span>{row.quantity != null ? row.quantity.toLocaleString() : "--"}</span>
                  </div>
                ))
              ) : (
                <div className={`text-xs ${textSecondaryClass}`}>No ask depth available.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
