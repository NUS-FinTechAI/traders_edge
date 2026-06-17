import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type RefObject,
} from "react";
import type { OrderAction, OrderType } from "../types/tradingTypes";
import {
  buildTradingTutorialSteps,
  type TradingTutorialId,
  useTutorialQueue,
} from "../../tutorials";

interface TradingTutorialRefs {
  chartContainerRef: RefObject<HTMLDivElement | null>;
  macroPanelRef: RefObject<HTMLDivElement | null>;
  interestRateCardRef: RefObject<HTMLDivElement | null>;
  inflationCardRef: RefObject<HTMLDivElement | null>;
  portfolioAnalyticsCardRef: RefObject<HTMLDivElement | null>;
  portfolioAllocationPanelRef: RefObject<HTMLDivElement | null>;
  sectorExposurePanelRef: RefObject<HTMLDivElement | null>;
  fundamentalsPanelRef: RefObject<HTMLDivElement | null>;
  correlationPanelRef: RefObject<HTMLDivElement | null>;
  betaVolatilityPanelRef: RefObject<HTMLDivElement | null>;
  benchmarkPanelRef: RefObject<HTMLDivElement | null>;
  benchmarkPortfolioReturnCardRef: RefObject<HTMLDivElement | null>;
  benchmarkBenchmarkReturnCardRef: RefObject<HTMLDivElement | null>;
  benchmarkExcessReturnCardRef: RefObject<HTMLDivElement | null>;
  indicatorPanelRef: RefObject<HTMLDivElement | null>;
  timerCardRef: RefObject<HTMLDivElement | null>;
  tickerInfoCardRef: RefObject<HTMLDivElement | null>;
  tickerFundamentalsCardRef: RefObject<HTMLDivElement | null>;
  currentPriceCardRef: RefObject<HTMLDivElement | null>;
  bidAskCardRef: RefObject<HTMLDivElement | null>;
  bidAskExpandToggleRef: RefObject<HTMLButtonElement | null>;
  cashCardRef: RefObject<HTMLDivElement | null>;
  pendingTradesLogRef: RefObject<HTMLDivElement | null>;
  pastTradesLogRef: RefObject<HTMLDivElement | null>;
  buySellButtonsRef: RefObject<HTMLDivElement | null>;
  buyButtonRef: RefObject<HTMLSpanElement | null>;
  sellButtonRef: RefObject<HTMLSpanElement | null>;
  sellShortButtonRef: RefObject<HTMLSpanElement | null>;
  buyToCoverButtonRef: RefObject<HTMLSpanElement | null>;
  nextTurnRef: RefObject<HTMLSpanElement | null>;
  gameEndModalRef: RefObject<HTMLDivElement | null>;
  pageContainerRef: RefObject<HTMLDivElement | null>;
  newsCardRef: RefObject<HTMLDivElement | null>;
  tradeOrderTypeSelectRef: RefObject<HTMLSelectElement | null>;
  tradeQuantityInputRef: RefObject<HTMLInputElement | null>;
  tradeLimitPriceInputRef: RefObject<HTMLInputElement | null>;
  tradeStopPriceInputRef: RefObject<HTMLInputElement | null>;
  tradeModalActionsRef: RefObject<HTMLDivElement | null>;
  tradeConfirmButtonRef: RefObject<HTMLSpanElement | null>;
}

type GuidedOrderTutorialId =
  | "market-order-basics"
  | "limit-order-basics"
  | "stop-loss-basics"
  | "stop-limit-basics";

interface GuidedOrderGateConfig {
  expectedType: OrderType;
  openBuyStep: number;
  selectBuyTypeStep: number;
  openSellStep: number;
  selectSellTypeStep: number;
}

const GUIDED_ORDER_GATE_CONFIG: Record<GuidedOrderTutorialId, GuidedOrderGateConfig> = {
  "market-order-basics": {
    expectedType: "Market",
    openBuyStep: 2,
    selectBuyTypeStep: 3,
    openSellStep: 6,
    selectSellTypeStep: 7,
  },
  "limit-order-basics": {
    expectedType: "Limit",
    openBuyStep: 2,
    selectBuyTypeStep: 3,
    openSellStep: 7,
    selectSellTypeStep: 8,
  },
  "stop-loss-basics": {
    expectedType: "Stop",
    openBuyStep: 2,
    selectBuyTypeStep: 3,
    openSellStep: 7,
    selectSellTypeStep: 8,
  },
  "stop-limit-basics": {
    expectedType: "StopLimit",
    openBuyStep: 2,
    selectBuyTypeStep: 3,
    openSellStep: 8,
    selectSellTypeStep: 9,
  },
};
const GUIDED_ORDER_CANCEL_TO_ADVANCE_STEPS: Record<GuidedOrderTutorialId, number[]> = {
  "market-order-basics": [5, 9],
  "limit-order-basics": [6, 11],
  "stop-loss-basics": [6, 11],
  "stop-limit-basics": [7, 13],
};

function isGuidedOrderTutorialId(value: TradingTutorialId | null): value is GuidedOrderTutorialId {
  return value === "market-order-basics"
    || value === "limit-order-basics"
    || value === "stop-loss-basics"
    || value === "stop-limit-basics";
}

export function useTradingTutorialFlow(
  refs: TradingTutorialRefs,
  moduleParam?: string,
  levelParam?: string
) {
  const resolveTradingTutorialSteps = useCallback(
    (tutorialId: TradingTutorialId) =>
      buildTradingTutorialSteps(tutorialId, {
        chartContainer: refs.chartContainerRef as any,
        macroPanel: refs.macroPanelRef as any,
        interestRateCard: refs.interestRateCardRef as any,
        inflationCard: refs.inflationCardRef as any,
        portfolioAnalyticsCard: refs.portfolioAnalyticsCardRef as any,
        portfolioAllocationPanel: refs.portfolioAllocationPanelRef as any,
        sectorExposurePanel: refs.sectorExposurePanelRef as any,
        fundamentalsPanel: refs.fundamentalsPanelRef as any,
        correlationPanel: refs.correlationPanelRef as any,
        betaVolatilityPanel: refs.betaVolatilityPanelRef as any,
        benchmarkPanel: refs.benchmarkPanelRef as any,
        benchmarkPortfolioReturnCard: refs.benchmarkPortfolioReturnCardRef as any,
        benchmarkBenchmarkReturnCard: refs.benchmarkBenchmarkReturnCardRef as any,
        benchmarkExcessReturnCard: refs.benchmarkExcessReturnCardRef as any,
        indicatorPanel: refs.indicatorPanelRef as any,
        timerCard: refs.timerCardRef as any,
        tickerInfoCard: refs.tickerInfoCardRef as any,
        tickerFundamentalsCard: refs.tickerFundamentalsCardRef as any,
        currentPriceCard: refs.currentPriceCardRef as any,
        bidAskCard: refs.bidAskCardRef as any,
        bidAskExpandToggle: refs.bidAskExpandToggleRef as any,
        portfolioCard: refs.cashCardRef as any,
        pendingTradesLog: refs.pendingTradesLogRef as any,
        pastTradesLog: refs.pastTradesLogRef as any,
        buySellButtons: refs.buySellButtonsRef as any,
        buyButton: refs.buyButtonRef as any,
        sellButton: refs.sellButtonRef as any,
        sellShortButton: refs.sellShortButtonRef as any,
        buyToCoverButton: refs.buyToCoverButtonRef as any,
        nextTurnButton: refs.nextTurnRef as any,
        gameEndModal: refs.gameEndModalRef as any,
        pageContainer: refs.pageContainerRef as any,
        newsCard: refs.newsCardRef as any,
        tradeOrderTypeSelect: refs.tradeOrderTypeSelectRef as any,
        tradeQuantityInput: refs.tradeQuantityInputRef as any,
        tradeLimitPriceInput: refs.tradeLimitPriceInputRef as any,
        tradeStopPriceInput: refs.tradeStopPriceInputRef as any,
        tradeModalActions: refs.tradeModalActionsRef as any,
        tradeConfirmButton: refs.tradeConfirmButtonRef as any,
      }),
    [refs]
  );

  const {
    isOpen: isTutorialOpen,
    activeTutorialId,
    activeSteps: activeTutorialSteps,
    openTutorialNow,
    closeActiveTutorial,
    clearTutorials,
  } = useTutorialQueue<TradingTutorialId>(resolveTradingTutorialSteps);

  const [guidedOrderTutorialStepIndex, setGuidedOrderTutorialStepIndex] =
    useState<number>(0);
  const [shortSellingTutorialStepIndex, setShortSellingTutorialStepIndex] =
    useState<number>(0);
  const [traderEdgeBasicsStepIndex, setTraderEdgeBasicsStepIndex] =
    useState<number>(0);
  const [traderEdgeBasicsProgress, setTraderEdgeBasicsProgress] = useState<{
    nextTurnClicks: number;
  }>({
    nextTurnClicks: 0,
  });
  const [bidAskPanelExpanded, setBidAskPanelExpanded] = useState<boolean>(false);
  const [guidedOrderTutorialProgress, setGuidedOrderTutorialProgress] = useState<{
    clickedBuy: boolean;
    selectedBuyOrderType: boolean;
    cancelledModalByStep: Record<number, boolean>;
    clickedSell: boolean;
    selectedSellOrderType: boolean;
  }>({
    clickedBuy: false,
    selectedBuyOrderType: false,
    cancelledModalByStep: {},
    clickedSell: false,
    selectedSellOrderType: false,
  });

  const isGuidedOrderTutorialActive = isGuidedOrderTutorialId(activeTutorialId);
  const isShortSellingTutorialActive = activeTutorialId === "short-selling-basics";
  const isTraderEdgeBasicsTutorialActive =
    activeTutorialId === "trader-edge-basics";

  useEffect(() => {
    if (!isShortSellingTutorialActive) return;
    setShortSellingTutorialStepIndex(0);
  }, [activeTutorialId, isShortSellingTutorialActive]);

  useEffect(() => {
    if (!isGuidedOrderTutorialActive) return;
    setGuidedOrderTutorialStepIndex(0);
    setGuidedOrderTutorialProgress({
      clickedBuy: false,
      selectedBuyOrderType: false,
      cancelledModalByStep: {},
      clickedSell: false,
      selectedSellOrderType: false,
    });
  }, [activeTutorialId, isGuidedOrderTutorialActive]);

  useEffect(() => {
    if (activeTutorialId !== "trader-edge-basics") return;
    setTraderEdgeBasicsStepIndex(0);
    setTraderEdgeBasicsProgress({ nextTurnClicks: 0 });
  }, [activeTutorialId]);

  useEffect(() => {
    if (activeTutorialId !== "bid-ask-spread-basics") return;
    setBidAskPanelExpanded(false);
  }, [activeTutorialId]);

  useEffect(() => {
    clearTutorials();
    setGuidedOrderTutorialStepIndex(0);
    setShortSellingTutorialStepIndex(0);
    setTraderEdgeBasicsStepIndex(0);
    setGuidedOrderTutorialProgress({
      clickedBuy: false,
      selectedBuyOrderType: false,
      cancelledModalByStep: {},
      clickedSell: false,
      selectedSellOrderType: false,
    });
    setTraderEdgeBasicsProgress({ nextTurnClicks: 0 });
    setBidAskPanelExpanded(false);
  }, [moduleParam, levelParam, clearTutorials]);

  const canAdvanceTutorialStep = useCallback(
    (stepIndex: number): boolean => {
      if (isShortSellingTutorialActive) {
        return true;
      }
      if (isGuidedOrderTutorialActive) {
        const config = GUIDED_ORDER_GATE_CONFIG[activeTutorialId];
        if (stepIndex === config.openBuyStep) {
          return guidedOrderTutorialProgress.clickedBuy;
        }
        if (stepIndex === config.selectBuyTypeStep) {
          return guidedOrderTutorialProgress.selectedBuyOrderType;
        }
        if (GUIDED_ORDER_CANCEL_TO_ADVANCE_STEPS[activeTutorialId].includes(stepIndex)) {
          return !!guidedOrderTutorialProgress.cancelledModalByStep[stepIndex];
        }
        if (stepIndex === config.openSellStep) {
          return guidedOrderTutorialProgress.clickedSell;
        }
        if (stepIndex === config.selectSellTypeStep) {
          return guidedOrderTutorialProgress.selectedSellOrderType;
        }
        return true;
      }
      if (isTraderEdgeBasicsTutorialActive) {
        if (stepIndex === 7) return traderEdgeBasicsProgress.nextTurnClicks >= 1;
        if (stepIndex === 8) {
          return (
            traderEdgeBasicsProgress.nextTurnClicks >= 2 &&
            !!refs.gameEndModalRef.current
          );
        }
      }
      if (activeTutorialId === "bid-ask-spread-basics" && stepIndex === 1) {
        return bidAskPanelExpanded;
      }
      return true;
    },
    [
      isShortSellingTutorialActive,
      isGuidedOrderTutorialActive,
      activeTutorialId,
      guidedOrderTutorialProgress,
      isTraderEdgeBasicsTutorialActive,
      traderEdgeBasicsProgress.nextTurnClicks,
      bidAskPanelExpanded,
      refs.gameEndModalRef,
    ]
  );

  const onTradeOpened = useCallback(
    (action: OrderAction) => {
      if (!isGuidedOrderTutorialActive) return;
      const config = GUIDED_ORDER_GATE_CONFIG[activeTutorialId];
      if (guidedOrderTutorialStepIndex === config.openBuyStep && action === "Buy") {
        setGuidedOrderTutorialProgress((prev) => ({
          ...prev,
          clickedBuy: true,
        }));
        return;
      }
      if (guidedOrderTutorialStepIndex === config.openSellStep && action === "Sell") {
        setGuidedOrderTutorialProgress((prev) => ({
          ...prev,
          clickedSell: true,
        }));
      }
    },
    [
      isGuidedOrderTutorialActive,
      guidedOrderTutorialStepIndex,
      activeTutorialId,
    ]
  );

  const onTradeOrderTypeChange = useCallback(
    (orderType: OrderType) => {
      if (!isGuidedOrderTutorialActive) return;
      const config = GUIDED_ORDER_GATE_CONFIG[activeTutorialId];
      if (orderType !== config.expectedType) return;
      if (guidedOrderTutorialStepIndex === config.selectBuyTypeStep) {
        setGuidedOrderTutorialProgress((prev) => ({
          ...prev,
          selectedBuyOrderType: true,
        }));
        return;
      }
      if (guidedOrderTutorialStepIndex === config.selectSellTypeStep) {
        setGuidedOrderTutorialProgress((prev) => ({
          ...prev,
          selectedSellOrderType: true,
        }));
      }
    },
    [isGuidedOrderTutorialActive, guidedOrderTutorialStepIndex, activeTutorialId]
  );

  const onTradeCancelClicked = useCallback(() => {
    if (
      isGuidedOrderTutorialActive &&
      GUIDED_ORDER_CANCEL_TO_ADVANCE_STEPS[activeTutorialId].includes(
        guidedOrderTutorialStepIndex
      )
    ) {
      setGuidedOrderTutorialProgress((prev) => ({
        ...prev,
        cancelledModalByStep: {
          ...prev.cancelledModalByStep,
          [guidedOrderTutorialStepIndex]: true,
        },
      }));
    }
  }, [isGuidedOrderTutorialActive, activeTutorialId, guidedOrderTutorialStepIndex]);

  const isGuidedOrderCancelToAdvanceStepActive = useMemo(() => {
    if (!isGuidedOrderTutorialActive) return false;
    return GUIDED_ORDER_CANCEL_TO_ADVANCE_STEPS[activeTutorialId].includes(
      guidedOrderTutorialStepIndex
    );
  }, [isGuidedOrderTutorialActive, activeTutorialId, guidedOrderTutorialStepIndex]);

  const onNextTurnClicked = useCallback(() => {
    if (!isTraderEdgeBasicsTutorialActive) return;
    if (traderEdgeBasicsStepIndex !== 7 && traderEdgeBasicsStepIndex !== 8) return;
    setTraderEdgeBasicsProgress((prev) => ({
      ...prev,
      nextTurnClicks: prev.nextTurnClicks + 1,
    }));
  }, [isTraderEdgeBasicsTutorialActive, traderEdgeBasicsStepIndex]);

  const onBidAskPanelExpandedChange = useCallback((expanded: boolean) => {
    setBidAskPanelExpanded(expanded);
  }, []);

  const tutorialOverlayStepIndex = useMemo(
    () => {
      if (isShortSellingTutorialActive) return shortSellingTutorialStepIndex;
      if (isGuidedOrderTutorialActive) return guidedOrderTutorialStepIndex;
      if (isTraderEdgeBasicsTutorialActive) return traderEdgeBasicsStepIndex;
      return undefined;
    },
    [
      isShortSellingTutorialActive,
      shortSellingTutorialStepIndex,
      isGuidedOrderTutorialActive,
      guidedOrderTutorialStepIndex,
      isTraderEdgeBasicsTutorialActive,
      traderEdgeBasicsStepIndex,
    ]
  );

  const onTutorialStepIndexChange = useCallback(
    (stepIndex: number) => {
      if (isShortSellingTutorialActive) {
        setShortSellingTutorialStepIndex(stepIndex);
        return;
      }
      if (isGuidedOrderTutorialActive) {
        setGuidedOrderTutorialStepIndex(stepIndex);
        return;
      }
      if (isTraderEdgeBasicsTutorialActive) {
        setTraderEdgeBasicsStepIndex(stepIndex);
      }
    },
    [
      isShortSellingTutorialActive,
      isGuidedOrderTutorialActive,
      isTraderEdgeBasicsTutorialActive,
    ]
  );

  return {
    isTutorialOpen,
    activeTutorialId,
    activeTutorialSteps,
    openTutorialNow,
    closeActiveTutorial,
    clearTutorials,
    canAdvanceTutorialStep,
    marketOrderTutorialStepIndex: guidedOrderTutorialStepIndex,
    tutorialOverlayStepIndex,
    onTutorialStepIndexChange,
    onTradeOpened,
    onTradeOrderTypeChange,
    onTradeCancelClicked,
    isGuidedOrderCancelToAdvanceStepActive,
    onNextTurnClicked,
    onBidAskPanelExpandedChange,
  };
}
