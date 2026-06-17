import { useEffect, useMemo, useState, type RefObject } from "react";
import type { CandlestickData, Time, WhitespaceData } from "lightweight-charts";
import { Button } from "../../../shared/ui/Button";
import { CandlestickChart, type ChartOverlayLine } from "./CandlestickChart";
import { BuySellActionGroup } from "./BuySellActionGroup";
import { TradeModal } from "./TradeModal";
import {
  BidAskPanel,
  CompanyInfoCard,
  IndicatorPanel,
  LastPriceCard,
  QualitySnapshotCard,
  TickerStrip,
} from "./TradingLeftPanelSections";
import type {
  OrderBookLevel,
  OrderAction,
  OrderType,
  TickerMetadataDefinition,
  TickerGlanceData,
} from "../types/tradingTypes";
import {
  computeExponentialMovingAverageSeries,
  computeSimpleMovingAverageSeries,
  getLatestIndicatorValue,
} from "../utils/tradingCalculations";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";

type CandlePoint = CandlestickData | WhitespaceData<Time>;

const MOVING_AVERAGE_PERIOD = 5;
const EXPONENTIAL_MOVING_AVERAGE_PERIOD = 5;

export interface TradingLeftPanelProps {
  points: CandlePoint[];
  isDark: boolean;
  height: number;
  textPrimaryClass: string;
  cardBorderClass: string;
  cardBgElevatedClass: string;
  chartContainerRef: RefObject<HTMLDivElement | null>;
  currentPriceCardRef?: RefObject<HTMLDivElement | null>;
  tickerInfoCardRef?: RefObject<HTMLDivElement | null>;
  tickerFundamentalsCardRef?: RefObject<HTMLDivElement | null>;
  bidAskCardRef?: RefObject<HTMLDivElement | null>;
  bidAskExpandToggleRef?: RefObject<HTMLButtonElement | null>;
  indicatorPanelRef?: RefObject<HTMLDivElement | null>;
  nextTurnRef: RefObject<HTMLSpanElement | null>;
  buySellButtonsRef?: RefObject<HTMLDivElement | null>;
  buyButtonRef: RefObject<HTMLSpanElement | null>;
  sellButtonRef: RefObject<HTMLSpanElement | null>;
  sellShortButtonRef?: RefObject<HTMLSpanElement | null>;
  buyToCoverButtonRef?: RefObject<HTMLSpanElement | null>;
  tradeOrderTypeSelectRef?: RefObject<HTMLSelectElement | null>;
  tradeQuantityInputRef?: RefObject<HTMLInputElement | null>;
  tradeLimitPriceInputRef?: RefObject<HTMLInputElement | null>;
  tradeStopPriceInputRef?: RefObject<HTMLInputElement | null>;
  tradeModalActionsRef?: RefObject<HTMLDivElement | null>;
  tradeConfirmButtonRef?: RefObject<HTMLSpanElement | null>;
  startingTicker: string | null;
  levelId?: string | null;
  availableTickers: string[];
  tickerGlance: TickerGlanceData[];
  gameStarted: boolean;
  manualStartRequired?: boolean;
  allowShortSelling?: boolean;
  allowMarketOrder?: boolean;
  allowLimitOrder?: boolean;
  allowStopOrder?: boolean;
  allowStopLimitOrder?: boolean;
  showMovingAverageTool?: boolean;
  showExponentialMovingAverageTool?: boolean;
  showMovingAverageLine?: boolean;
  showExponentialMovingAverageLine?: boolean;
  movingAveragePeriod?: number;
  exponentialMovingAveragePeriod?: number;
  movingAverageValue?: number | null;
  exponentialMovingAverageValue?: number | null;
  onToggleMovingAverageLine?: (next: boolean) => void;
  onToggleExponentialMovingAverageLine?: (next: boolean) => void;
  currentPrice?: number | null;
  assetPriceDelta?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  spread?: number | null;
  orderBookBids?: OrderBookLevel[];
  orderBookAsks?: OrderBookLevel[];
  showBidAskCard?: boolean;
  onBidAskPanelExpandedChange?: (expanded: boolean) => void;
  tickerMetadata?: Record<string, TickerMetadataDefinition>;
  showFundamentalMetrics?: boolean;
  showNextTurn?: boolean;
  isTradeOpen: { open: boolean; action: OrderAction } | null;
  onOpenTrade: (action: OrderAction) => void;
  onCloseTrade: () => void;
  onConfirmTrade: (
    quantity: number,
    orderType: OrderType,
    price?: number,
    stopPrice?: number
  ) => void;
  onTradeOrderTypeChange?: (orderType: OrderType) => void;
  onTradeConfirmClick?: () => void;
  onTradeCancelClick?: () => void;
  keepTradeModalOpenOnConfirm?: boolean;
  disableTradeModalNonFooterClose?: boolean;
  onNextTurn: () => void;
  onSelectTicker: (ticker: string) => void;
}

export function TradingLeftPanel({
  points,
  isDark,
  height,
  textPrimaryClass,
  cardBorderClass,
  cardBgElevatedClass,
  chartContainerRef,
  currentPriceCardRef,
  tickerInfoCardRef,
  tickerFundamentalsCardRef,
  bidAskCardRef,
  bidAskExpandToggleRef,
  indicatorPanelRef,
  nextTurnRef,
  buySellButtonsRef,
  buyButtonRef,
  sellButtonRef,
  sellShortButtonRef,
  buyToCoverButtonRef,
  tradeOrderTypeSelectRef,
  tradeQuantityInputRef,
  tradeLimitPriceInputRef,
  tradeStopPriceInputRef,
  tradeModalActionsRef,
  tradeConfirmButtonRef,
  startingTicker,
  levelId = null,
  availableTickers,
  tickerGlance,
  gameStarted,
  manualStartRequired = false,
  allowShortSelling = false,
  allowMarketOrder = true,
  allowLimitOrder = true,
  allowStopOrder = false,
  allowStopLimitOrder = false,
  showMovingAverageTool = false,
  showExponentialMovingAverageTool = false,
  showMovingAverageLine = true,
  showExponentialMovingAverageLine = true,
  movingAveragePeriod = MOVING_AVERAGE_PERIOD,
  exponentialMovingAveragePeriod = EXPONENTIAL_MOVING_AVERAGE_PERIOD,
  movingAverageValue = null,
  exponentialMovingAverageValue = null,
  onToggleMovingAverageLine,
  onToggleExponentialMovingAverageLine,
  currentPrice,
  assetPriceDelta = null,
  bestBid = null,
  bestAsk = null,
  spread = null,
  orderBookBids = [],
  orderBookAsks = [],
  showBidAskCard = false,
  onBidAskPanelExpandedChange,
  tickerMetadata = {},
  showFundamentalMetrics = false,
  showNextTurn = true,
  isTradeOpen,
  onOpenTrade,
  onCloseTrade,
  onConfirmTrade,
  onTradeOrderTypeChange,
  onTradeConfirmClick,
  onTradeCancelClick,
  keepTradeModalOpenOnConfirm = false,
  disableTradeModalNonFooterClose = false,
  onNextTurn,
  onSelectTicker,
}: TradingLeftPanelProps) {
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const hasAnyCandle = points.some(
    (point) => "open" in point && typeof point.open === "number"
  );

  const movingAverageSeries = useMemo(
    () =>
      computeSimpleMovingAverageSeries(points, MOVING_AVERAGE_PERIOD).map((point) => ({
        time: point.time,
        value: point.value,
      })),
    [points]
  );
  const exponentialMovingAverageSeries = useMemo(
    () =>
      computeExponentialMovingAverageSeries(points, EXPONENTIAL_MOVING_AVERAGE_PERIOD).map(
        (point) => ({
          time: point.time,
          value: point.value,
        })
      ),
    [points]
  );

  const chartOverlays = useMemo<ChartOverlayLine[]>(() => {
    const overlays: ChartOverlayLine[] = [];
    const movingAverageColor = isDark ? "#60a5fa" : "#1d4ed8";
    const exponentialMovingAverageColor = isDark ? "#fbbf24" : "#b45309";

    if (showMovingAverageTool) {
      overlays.push({
        key: "moving-average",
        color: movingAverageColor,
        visible: showMovingAverageLine,
        points: movingAverageSeries,
      });
    }

    if (showExponentialMovingAverageTool) {
      overlays.push({
        key: "exponential-moving-average",
        color: exponentialMovingAverageColor,
        visible: showExponentialMovingAverageLine,
        points: exponentialMovingAverageSeries,
      });
    }

    return overlays;
  }, [
    exponentialMovingAverageSeries,
    isDark,
    movingAverageSeries,
    showExponentialMovingAverageLine,
    showExponentialMovingAverageTool,
    showMovingAverageLine,
    showMovingAverageTool,
  ]);

  const resolvedMovingAverageValue = useMemo(
    () => movingAverageValue ?? getLatestIndicatorValue(movingAverageSeries),
    [movingAverageSeries, movingAverageValue]
  );
  const resolvedExponentialMovingAverageValue = useMemo(
    () =>
      exponentialMovingAverageValue ?? getLatestIndicatorValue(exponentialMovingAverageSeries),
    [exponentialMovingAverageSeries, exponentialMovingAverageValue]
  );
  const resolvedCurrentPrice =
    currentPrice ??
    (() => {
      const lastPoint = points[points.length - 1];
      return lastPoint && "close" in lastPoint && typeof lastPoint.close === "number"
        ? lastPoint.close
        : null;
    })();
  const activeTicker = startingTicker ?? availableTickers[0] ?? null;
  const forceMarketOnlyForShortAction =
    levelId === "module-3.5" &&
    (isTradeOpen?.action === "SellShort" || isTradeOpen?.action === "BuyToCover");

  const [isBidAskExpanded, setIsBidAskExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (!showBidAskCard && isBidAskExpanded) {
      setIsBidAskExpanded(false);
      onBidAskPanelExpandedChange?.(false);
    }
    if (!showBidAskCard) {
      onBidAskPanelExpandedChange?.(false);
    }
  }, [isBidAskExpanded, onBidAskPanelExpandedChange, showBidAskCard]);

  useEffect(() => {
    if (gameStarted) return;
    if (!isBidAskExpanded) return;
    setIsBidAskExpanded(false);
    onBidAskPanelExpandedChange?.(false);
  }, [gameStarted, isBidAskExpanded, onBidAskPanelExpandedChange]);

  return (
    <div className="col-span-12 lg:col-span-9 min-w-0 self-start">
      <div
        className={`w-full h-auto min-w-0 rounded-lg ${cardBorderClass} ${cardBgElevatedClass} p-4`}
      >
        <TickerStrip
          availableTickers={availableTickers}
          startingTicker={startingTicker}
          tickerGlance={tickerGlance}
          onSelectTicker={onSelectTicker}
          cardBorderClass={cardBorderClass}
          textPrimaryClass={textPrimaryClass}
          textSecondaryClass={textSecondary}
        />

        <div className="w-full relative mb-2 overflow-hidden">
          <div ref={chartContainerRef} className="w-full h-[46vh] max-h-[460px] min-h-[240px]">
            <CandlestickChart
              points={points}
              isDark={isDark}
              height={height}
              seriesKey={startingTicker ?? "default"}
              overlays={chartOverlays}
            />
          </div>
          {!hasAnyCandle ? (
            <div className={`absolute inset-0 flex items-center justify-center ${textSecondary}`}>
              Awaiting next turn...
            </div>
          ) : null}
        </div>

        {showNextTurn ? (
          <div className="w-full flex justify-end mt-2 mb-3">
            <span ref={nextTurnRef} className="inline-flex">
              <Button type="button" variant="success" size="md" onClick={onNextTurn}>
                Next Turn
              </Button>
            </span>
          </div>
        ) : null}

        <div
          className={`rounded-lg border ${cardBorderClass} bg-white/85 p-3 dark:bg-slate-900/45`}
        >
          <div className="space-y-3">
            <IndicatorPanel
              indicatorPanelRef={indicatorPanelRef}
              showMovingAverageTool={showMovingAverageTool}
              showExponentialMovingAverageTool={showExponentialMovingAverageTool}
              showMovingAverageLine={showMovingAverageLine}
              showExponentialMovingAverageLine={showExponentialMovingAverageLine}
              movingAveragePeriod={movingAveragePeriod}
              exponentialMovingAveragePeriod={exponentialMovingAveragePeriod}
              movingAverageValue={resolvedMovingAverageValue}
              exponentialMovingAverageValue={resolvedExponentialMovingAverageValue}
              onToggleMovingAverageLine={onToggleMovingAverageLine}
              onToggleExponentialMovingAverageLine={onToggleExponentialMovingAverageLine}
              cardBorderClass={cardBorderClass}
              textPrimaryClass={textPrimaryClass}
              textSecondaryClass={textSecondary}
            />

            <div className="flex items-stretch gap-2 overflow-x-auto pb-1">
              <CompanyInfoCard
                tickerInfoCardRef={tickerInfoCardRef}
                activeTicker={activeTicker}
                tickerMetadata={tickerMetadata}
                cardBorderClass={cardBorderClass}
                textPrimaryClass={textPrimaryClass}
                textSecondaryClass={textSecondary}
              />
              <QualitySnapshotCard
                tickerFundamentalsCardRef={tickerFundamentalsCardRef}
                showFundamentalMetrics={showFundamentalMetrics}
                activeTicker={activeTicker}
                tickerMetadata={tickerMetadata}
                cardBorderClass={cardBorderClass}
                textPrimaryClass={textPrimaryClass}
                textSecondaryClass={textSecondary}
              />
              <LastPriceCard
                currentPriceCardRef={currentPriceCardRef}
                resolvedCurrentPrice={resolvedCurrentPrice}
                assetPriceDelta={assetPriceDelta}
                cardBorderClass={cardBorderClass}
                textSecondaryClass={textSecondary}
              />
              <div className="ml-auto flex shrink-0 items-center">
                <div className="flex flex-col items-end gap-1">
                  <BuySellActionGroup
                    containerRef={buySellButtonsRef}
                    buyButtonRef={buyButtonRef}
                    sellButtonRef={sellButtonRef}
                    sellShortButtonRef={sellShortButtonRef}
                    buyToCoverButtonRef={buyToCoverButtonRef}
                    shortSellingEnabled={allowShortSelling}
                    disabled={false}
                    onBuy={() => onOpenTrade("Buy")}
                    onSell={() => onOpenTrade("Sell")}
                    onSellShort={() => onOpenTrade("SellShort")}
                    onBuyToCover={() => onOpenTrade("BuyToCover")}
                  />
                  {!allowMarketOrder ? (
                    <div className={`text-[11px] ${textSecondary}`}>
                      Player-only mode: place priced limit orders.
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <BidAskPanel
              bidAskCardRef={bidAskCardRef}
              bidAskExpandToggleRef={bidAskExpandToggleRef}
              showBidAskCard={showBidAskCard}
              activeTicker={activeTicker}
              isExpanded={isBidAskExpanded}
              onToggle={() => {
                const nextExpanded = !isBidAskExpanded;
                setIsBidAskExpanded(nextExpanded);
                onBidAskPanelExpandedChange?.(nextExpanded);
              }}
              bestBid={bestBid}
              bestAsk={bestAsk}
              spread={spread}
              bids={orderBookBids}
              asks={orderBookAsks}
              cardBorderClass={cardBorderClass}
              textPrimaryClass={textPrimaryClass}
              textSecondaryClass={textSecondary}
            />
          </div>
        </div>

        <TradeModal
          isOpen={!!isTradeOpen?.open}
          onClose={onCloseTrade}
          action={isTradeOpen?.action ?? "Buy"}
          ticker={activeTicker ?? ""}
          currentPrice={resolvedCurrentPrice}
          forceMarketOnly={forceMarketOnlyForShortAction}
          allowMarketOrder={allowMarketOrder}
          allowLimitOrder={allowLimitOrder}
          allowStopOrder={allowStopOrder}
          allowStopLimitOrder={allowStopLimitOrder}
          orderTypeSelectRef={tradeOrderTypeSelectRef}
          quantityInputRef={tradeQuantityInputRef}
          limitPriceInputRef={tradeLimitPriceInputRef}
          stopPriceInputRef={tradeStopPriceInputRef}
          modalActionsRef={tradeModalActionsRef}
          confirmButtonRef={tradeConfirmButtonRef}
          onOrderTypeChange={onTradeOrderTypeChange}
          onConfirmClick={onTradeConfirmClick}
          onCancelClick={onTradeCancelClick}
          closeOnConfirm={!keepTradeModalOpenOnConfirm}
          disableNonFooterClose={disableTradeModalNonFooterClose}
          orderPlacementEnabled={!manualStartRequired || gameStarted}
          onConfirm={(quantity, orderType, price, stopPrice) =>
            onConfirmTrade(quantity, orderType, price, stopPrice)
          }
        />
      </div>
    </div>
  );
}
