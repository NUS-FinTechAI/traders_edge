import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "../../../providers/ThemeProvider";
import { LoadingOverlay } from "../../../shared/ui/LoadingOverlay";
import { ToastRoot, toast } from "../../../shared/ui/toast/Toast";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import { TradingLeftPanel } from "./TradingLeftPanel";
import { TradingRightPanel } from "./TradingRightPanel";
import { MultiplayerRoomPanel } from "./MultiplayerRoomPanel";
import { TimerEndNextGamePopup } from "./TimerEndNextGamePopup";
import { TradingInfoPopups } from "./TradingInfoPopups";
import { GameEndModal } from "./GameEndModal";
import { TutorialOverlay, GENERAL_TRADING_TUTORIAL_ID } from "../../tutorials";
import { ResumeConfirmPopup } from "./ResumeConfirmPopup";
import { AutoTickStartPopup } from "./AutoTickStartPopup";
import type { OrderAction, OrderType } from "../types/tradingTypes";
import {
  computeAssetPriceMetrics,
  computeExponentialMovingAverageSeries,
  computeSimpleMovingAverageSeries,
  getLatestIndicatorValue,
} from "../utils/tradingCalculations";
import { useTradingTutorialFlow } from "../hooks/useTradingTutorialFlow";
import { useInfoPopupQueue } from "../hooks/useInfoPopupQueue";
import type { InfoPopupType } from "./TradingInfoPopups";
import type {
  MultiplayerPrivateMessage,
  MultiplayerRoomFeatures,
} from "../../multiplayer/types/multiplayerTypes";

const CHART_HEIGHT = 460;
const MOVING_AVERAGE_PERIOD = 5;
const EXPONENTIAL_MOVING_AVERAGE_PERIOD = 5;

interface TradingPageProps {
  useGameSession: (params: {
    moduleParam?: string;
    levelParam?: string;
    levelIdOverride?: string;
    sessionToken?: string | number;
    userId?: string;
    isResuming: boolean;
    clearTutorials: () => void;
    setPopupQueue: (order: InfoPopupType[]) => void;
  }) => {
    sessionState: any;
    actions: any;
    capabilities: { canManualAdvance: boolean };
    multiplayerState?: {
      roomCode: string | null;
      userId: string;
      roomFeatures: MultiplayerRoomFeatures;
      players: string[];
      privateMessages: MultiplayerPrivateMessage[];
    };
    multiplayerActions?: {
      requestActivePlayers: () => void;
      sendPrivateMessage: (params: { recipientId: string; content: string }) => void;
      sendFakeNews: (params: {
        ticker: string;
        content: string;
        delay: number;
      }) => void;
    };
  };
  moduleParam?: string;
  levelParam?: string;
  levelIdOverride?: string;
  sessionToken?: string | number;
  userId?: string;
  isResuming: boolean;
  onBackToLevelSelect: () => void;
  onProceed: () => void;
  onRetry?: () => void;
  enableTutorials?: boolean;
}

export function TradingPage({
  useGameSession,
  moduleParam,
  levelParam,
  levelIdOverride,
  sessionToken,
  userId,
  isResuming,
  onBackToLevelSelect,
  onProceed,
  onRetry,
  enableTutorials = true,
}: TradingPageProps) {
  const { isDark } = useTheme();

  const pageContainerRef = useRef<HTMLDivElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const macroPanelRef = useRef<HTMLDivElement | null>(null);
  const interestRateCardRef = useRef<HTMLDivElement | null>(null);
  const inflationCardRef = useRef<HTMLDivElement | null>(null);
  const portfolioAnalyticsCardRef = useRef<HTMLDivElement | null>(null);
  const portfolioAllocationPanelRef = useRef<HTMLDivElement | null>(null);
  const sectorExposurePanelRef = useRef<HTMLDivElement | null>(null);
  const fundamentalsPanelRef = useRef<HTMLDivElement | null>(null);
  const correlationPanelRef = useRef<HTMLDivElement | null>(null);
  const betaVolatilityPanelRef = useRef<HTMLDivElement | null>(null);
  const benchmarkPanelRef = useRef<HTMLDivElement | null>(null);
  const benchmarkPortfolioReturnCardRef = useRef<HTMLDivElement | null>(null);
  const benchmarkBenchmarkReturnCardRef = useRef<HTMLDivElement | null>(null);
  const benchmarkExcessReturnCardRef = useRef<HTMLDivElement | null>(null);
  const indicatorPanelRef = useRef<HTMLDivElement | null>(null);
  const cashCardRef = useRef<HTMLDivElement | null>(null);
  const tickerInfoCardRef = useRef<HTMLDivElement | null>(null);
  const tickerFundamentalsCardRef = useRef<HTMLDivElement | null>(null);
  const currentPriceCardRef = useRef<HTMLDivElement | null>(null);
  const bidAskCardRef = useRef<HTMLDivElement | null>(null);
  const bidAskExpandToggleRef = useRef<HTMLButtonElement | null>(null);
  const pendingTradesLogRef = useRef<HTMLDivElement | null>(null);
  const pastTradesLogRef = useRef<HTMLDivElement | null>(null);
  const newsCardRef = useRef<HTMLDivElement | null>(null);
  const buySellButtonsRef = useRef<HTMLDivElement | null>(null);
  const buyButtonRef = useRef<HTMLSpanElement | null>(null);
  const sellButtonRef = useRef<HTMLSpanElement | null>(null);
  const sellShortButtonRef = useRef<HTMLSpanElement | null>(null);
  const buyToCoverButtonRef = useRef<HTMLSpanElement | null>(null);
  const tradeOrderTypeSelectRef = useRef<HTMLSelectElement | null>(null);
  const tradeQuantityInputRef = useRef<HTMLInputElement | null>(null);
  const tradeLimitPriceInputRef = useRef<HTMLInputElement | null>(null);
  const tradeStopPriceInputRef = useRef<HTMLInputElement | null>(null);
  const tradeModalActionsRef = useRef<HTMLDivElement | null>(null);
  const tradeConfirmButtonRef = useRef<HTMLSpanElement | null>(null);
  const nextTurnRef = useRef<HTMLSpanElement | null>(null);
  const timerCardRef = useRef<HTMLDivElement | null>(null);
  const gameEndModalRef = useRef<HTMLDivElement | null>(null);

  const tutorialFlow = useTradingTutorialFlow(
    {
      chartContainerRef,
      macroPanelRef,
      interestRateCardRef,
      inflationCardRef,
      portfolioAnalyticsCardRef,
      portfolioAllocationPanelRef,
      sectorExposurePanelRef,
      fundamentalsPanelRef,
      correlationPanelRef,
      betaVolatilityPanelRef,
      benchmarkPanelRef,
      benchmarkPortfolioReturnCardRef,
      benchmarkBenchmarkReturnCardRef,
      benchmarkExcessReturnCardRef,
      indicatorPanelRef,
      timerCardRef,
      tickerInfoCardRef,
      tickerFundamentalsCardRef,
      currentPriceCardRef,
      bidAskCardRef,
      bidAskExpandToggleRef,
      cashCardRef,
      pendingTradesLogRef,
      pastTradesLogRef,
      buySellButtonsRef,
      buyButtonRef,
      sellButtonRef,
      sellShortButtonRef,
      buyToCoverButtonRef,
      nextTurnRef,
      gameEndModalRef,
      pageContainerRef,
      newsCardRef,
      tradeOrderTypeSelectRef,
      tradeQuantityInputRef,
      tradeLimitPriceInputRef,
      tradeStopPriceInputRef,
      tradeModalActionsRef,
      tradeConfirmButtonRef,
    },
    moduleParam,
    levelParam
  );

  const popupQueue = useInfoPopupQueue({
    isTutorialOpen: tutorialFlow.isTutorialOpen,
    activeTutorialId: tutorialFlow.activeTutorialId,
    openTutorialNow: tutorialFlow.openTutorialNow,
  });

  const session = useGameSession({
    moduleParam,
    levelParam,
    levelIdOverride,
    sessionToken,
    userId,
    isResuming,
    clearTutorials: tutorialFlow.clearTutorials,
    setPopupQueue: popupQueue.setPopupQueue,
  });
  const { sessionState, actions, capabilities } = session;
  const multiplayerState = session.multiplayerState;
  const multiplayerActions = session.multiplayerActions;

  const [isTradeOpen, setIsTradeOpen] = useState<{
    open: boolean;
    action: OrderAction;
  } | null>(null);
  const [showMovingAverageLine, setShowMovingAverageLine] = useState<boolean>(true);
  const [showExponentialMovingAverageLine, setShowExponentialMovingAverageLine] =
    useState<boolean>(true);
  const [isAutoTickStartPromptOpen, setIsAutoTickStartPromptOpen] =
    useState<boolean>(false);

  useEffect(() => {
    if (
      sessionState.gameStarted &&
      (!enableTutorials || !tutorialFlow.isTutorialOpen) &&
      (!enableTutorials || !popupQueue.activeInfoPopup) &&
      !sessionState.isResumeConfirmOpen &&
      !sessionState.timerArmed
    ) {
      actions.setTurnKey((prev: number) => prev + 1);
      actions.setTimerArmed(true);
    }
  }, [
    actions,
    enableTutorials,
    popupQueue.activeInfoPopup,
    sessionState.gameStarted,
    sessionState.isResumeConfirmOpen,
    sessionState.timerArmed,
    tutorialFlow.isTutorialOpen,
  ]);

  useEffect(() => {
    if (
      !sessionState.manualStartRequired ||
      sessionState.gameStarted ||
      sessionState.isConnecting
    ) {
      setIsAutoTickStartPromptOpen(false);
      return;
    }

    const hasBlockingOverlay =
      (enableTutorials && tutorialFlow.isTutorialOpen) ||
      !!popupQueue.activeInfoPopup ||
      sessionState.isResumeConfirmOpen;

    setIsAutoTickStartPromptOpen(!hasBlockingOverlay);
  }, [
    enableTutorials,
    popupQueue.activeInfoPopup,
    sessionState.gameStarted,
    sessionState.isConnecting,
    sessionState.isResumeConfirmOpen,
    sessionState.manualStartRequired,
    tutorialFlow.isTutorialOpen,
  ]);

  const { currentAssetPrice, assetPriceDelta } = computeAssetPriceMetrics(
    sessionState.allPoints,
    sessionState.livePrice
  );
  const movingAverageSeries = useMemo(
    () =>
      computeSimpleMovingAverageSeries(sessionState.allPoints, MOVING_AVERAGE_PERIOD).map(
        (point) => ({ time: point.time, value: point.value })
      ),
    [sessionState.allPoints]
  );
  const exponentialMovingAverageSeries = useMemo(
    () =>
      computeExponentialMovingAverageSeries(
        sessionState.allPoints,
        EXPONENTIAL_MOVING_AVERAGE_PERIOD
      ).map((point) => ({ time: point.time, value: point.value })),
    [sessionState.allPoints]
  );
  const movingAverageValue = useMemo(
    () => getLatestIndicatorValue(movingAverageSeries),
    [movingAverageSeries]
  );
  const exponentialMovingAverageValue = useMemo(
    () => getLatestIndicatorValue(exponentialMovingAverageSeries),
    [exponentialMovingAverageSeries]
  );

  const handleOpenTrade = (action: OrderAction) => {
    setIsTradeOpen({ open: true, action });
    tutorialFlow.onTradeOpened(action);
  };

  const handleTradeOrderTypeChange = (orderType: OrderType) => {
    tutorialFlow.onTradeOrderTypeChange(orderType);
  };

  const handleStartAutoTickLevel = () => {
    if (typeof actions.sendStartTicking === "function") {
      actions.sendStartTicking();
    }
    actions.setGameStarted(true);
    setIsAutoTickStartPromptOpen(false);
  };

  const handleReopenUnlocksFromStartPrompt = () => {
    popupQueue.setActiveInfoPopup("unlocks");
    setIsAutoTickStartPromptOpen(false);
  };

  const handleReopenContextFromStartPrompt = () => {
    popupQueue.setActiveInfoPopup("context");
    setIsAutoTickStartPromptOpen(false);
  };

  const tutorialStepsForCurrentMode = useMemo(() => {
    if (capabilities.canManualAdvance) {
      return tutorialFlow.activeTutorialSteps;
    }
    return tutorialFlow.activeTutorialSteps.filter(
      (step) => step.id !== "next" && step.id !== "timer"
    );
  }, [capabilities.canManualAdvance, tutorialFlow.activeTutorialSteps]);

  const levelIdForPresentation = useMemo(() => {
    if (
      typeof sessionState.levelId === "string" &&
      sessionState.levelId.trim().length > 0
    ) {
      return sessionState.levelId.trim();
    }
    const parsedModule = Number(moduleParam);
    const parsedLevel = Number(levelParam);
    if (Number.isFinite(parsedModule) && Number.isFinite(parsedLevel)) {
      return `module-${parsedModule}.${parsedLevel}`;
    }
    if (typeof levelIdOverride === "string" && levelIdOverride.trim().length > 0) {
      return levelIdOverride.trim();
    }
    return null;
  }, [levelIdOverride, levelParam, moduleParam, sessionState.levelId]);

  const backgroundClass = THEME_CONFIG.colors.background.primary;
  const cardBorder = THEME_CONFIG.colors.card.border;
  const cardBgElevated = THEME_CONFIG.colors.card.backgroundElevated;
  const textPrimary = THEME_CONFIG.colors.text.primary;

  return (
    <div
      ref={pageContainerRef}
      className={`h-full w-full ${backgroundClass} p-4 overflow-y-scroll`}
    >
      <LoadingOverlay isOpen={sessionState.isConnecting} text="Loading the level..." />
      {multiplayerState && multiplayerActions ? (
        <div className="mb-3">
          <MultiplayerRoomPanel
            roomCode={multiplayerState.roomCode}
            currentUserId={multiplayerState.userId}
            players={multiplayerState.players}
            roomFeatures={multiplayerState.roomFeatures}
            privateMessages={multiplayerState.privateMessages}
            availableTickers={sessionState.availableTickers}
            onRefreshPlayers={multiplayerActions.requestActivePlayers}
            onSendPrivateMessage={multiplayerActions.sendPrivateMessage}
            onSendFakeNews={multiplayerActions.sendFakeNews}
          />
        </div>
      ) : null}
      <div className="h-fit w-full grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <TradingLeftPanel
          points={sessionState.allPoints as any}
          isDark={isDark}
          height={CHART_HEIGHT}
          textPrimaryClass={textPrimary}
          cardBorderClass={cardBorder}
          cardBgElevatedClass={cardBgElevated}
          chartContainerRef={chartContainerRef}
          currentPriceCardRef={currentPriceCardRef}
          tickerInfoCardRef={tickerInfoCardRef}
          tickerFundamentalsCardRef={tickerFundamentalsCardRef}
          bidAskCardRef={bidAskCardRef}
          bidAskExpandToggleRef={bidAskExpandToggleRef}
          indicatorPanelRef={indicatorPanelRef}
          nextTurnRef={nextTurnRef}
          buySellButtonsRef={buySellButtonsRef}
          buyButtonRef={buyButtonRef}
          sellButtonRef={sellButtonRef}
          sellShortButtonRef={sellShortButtonRef}
          buyToCoverButtonRef={buyToCoverButtonRef}
          tradeOrderTypeSelectRef={tradeOrderTypeSelectRef}
          tradeQuantityInputRef={tradeQuantityInputRef}
          tradeLimitPriceInputRef={tradeLimitPriceInputRef}
          tradeStopPriceInputRef={tradeStopPriceInputRef}
          tradeModalActionsRef={tradeModalActionsRef}
          tradeConfirmButtonRef={tradeConfirmButtonRef}
          startingTicker={sessionState.startingTicker}
          levelId={sessionState.levelId}
          availableTickers={sessionState.availableTickers}
          tickerGlance={sessionState.tickerGlance}
          gameStarted={sessionState.gameStarted}
          manualStartRequired={sessionState.manualStartRequired}
          allowShortSelling={sessionState.availableTools.short_selling}
          allowMarketOrder={sessionState.availableTools.market_order}
          allowLimitOrder={sessionState.availableTools.limit_order}
          allowStopOrder={sessionState.availableTools.stop_order}
          allowStopLimitOrder={sessionState.availableTools.stop_limit_order}
          showMovingAverageTool={sessionState.availableTools.moving_average}
          showExponentialMovingAverageTool={
            sessionState.availableTools.exponential_moving_average
          }
          showMovingAverageLine={showMovingAverageLine}
          showExponentialMovingAverageLine={showExponentialMovingAverageLine}
          movingAveragePeriod={MOVING_AVERAGE_PERIOD}
          exponentialMovingAveragePeriod={EXPONENTIAL_MOVING_AVERAGE_PERIOD}
          movingAverageValue={movingAverageValue}
          exponentialMovingAverageValue={exponentialMovingAverageValue}
          onToggleMovingAverageLine={setShowMovingAverageLine}
          onToggleExponentialMovingAverageLine={setShowExponentialMovingAverageLine}
          isTradeOpen={isTradeOpen}
          onOpenTrade={handleOpenTrade}
          onCloseTrade={() => setIsTradeOpen(null)}
          onTradeOrderTypeChange={handleTradeOrderTypeChange}
          onTradeCancelClick={tutorialFlow.onTradeCancelClicked}
          keepTradeModalOpenOnConfirm={tutorialFlow.isGuidedOrderCancelToAdvanceStepActive}
          disableTradeModalNonFooterClose={tutorialFlow.isGuidedOrderCancelToAdvanceStepActive}
          onConfirmTrade={(quantity, orderType, price, stopPrice) => {
            if (sessionState.manualStartRequired && !sessionState.gameStarted) {
              toast({
                title: "Start Level Required",
                message: "Press Start Level before placing orders in this ticking level.",
                variant: "danger",
                durationMs: 4000,
              });
              return;
            }
            if (!sessionState.availableTools.market_order && orderType === "Market") {
              toast({
                title: "Priced Order Required",
                message:
                  "NPC orders are disabled for this room. Submit a priced limit order.",
                variant: "danger",
                durationMs: 5000,
              });
              return;
            }
            if (
              (orderType === "Limit" || orderType === "StopLimit") &&
              !Number.isFinite(price)
            ) {
              toast({
                title: "Limit Price Required",
                message: "Enter a valid limit price to place this order.",
                variant: "danger",
                durationMs: 5000,
              });
              return;
            }
            if (
              (orderType === "Stop" || orderType === "StopLimit") &&
              !Number.isFinite(stopPrice)
            ) {
              toast({
                title: "Stop Price Required",
                message: "Enter a valid stop price to place this order.",
                variant: "danger",
                durationMs: 5000,
              });
              return;
            }
            actions.sendRegisterOrder({
              qty: quantity,
              orderType,
              action: isTradeOpen?.action ?? "Buy",
              price,
              stopPrice,
            });
          }}
          onNextTurn={
            capabilities.canManualAdvance
              ? () => {
                  tutorialFlow.onNextTurnClicked();
                  actions.sendNextTick();
                }
              : () => {}
          }
          currentPrice={currentAssetPrice}
          assetPriceDelta={assetPriceDelta}
          bestBid={sessionState.bestBid}
          bestAsk={sessionState.bestAsk}
          spread={sessionState.spread}
          orderBookBids={sessionState.orderBookBids}
          orderBookAsks={sessionState.orderBookAsks}
          showBidAskCard={sessionState.availableTools.bid_ask_spread}
          onBidAskPanelExpandedChange={tutorialFlow.onBidAskPanelExpandedChange}
          tickerMetadata={sessionState.portfolio.tickerMetadata}
          showFundamentalMetrics={sessionState.availableTools.fundamentals_panel}
          showNextTurn={capabilities.canManualAdvance}
          onSelectTicker={actions.setSelectedTicker}
        />

        <TradingRightPanel
          timerCardRef={timerCardRef}
          pendingTradesLogRef={pendingTradesLogRef}
          pastTradesLogRef={pastTradesLogRef}
          newsCardRef={newsCardRef}
          macroPanelRef={macroPanelRef}
          interestRateCardRef={interestRateCardRef}
          inflationCardRef={inflationCardRef}
          portfolioAnalyticsCardRef={portfolioAnalyticsCardRef}
          portfolioAllocationPanelRef={portfolioAllocationPanelRef}
          sectorExposurePanelRef={sectorExposurePanelRef}
          correlationPanelRef={correlationPanelRef}
          betaVolatilityPanelRef={betaVolatilityPanelRef}
          benchmarkPanelRef={benchmarkPanelRef}
          benchmarkPortfolioReturnCardRef={benchmarkPortfolioReturnCardRef}
          benchmarkBenchmarkReturnCardRef={benchmarkBenchmarkReturnCardRef}
          benchmarkExcessReturnCardRef={benchmarkExcessReturnCardRef}
          showTimer={capabilities.canManualAdvance}
          isTimerActive={
            (!enableTutorials || !tutorialFlow.isTutorialOpen) &&
            (!enableTutorials || !popupQueue.activeInfoPopup) &&
            !sessionState.isResumeConfirmOpen
          }
          gameStarted={sessionState.gameStarted}
          turnKey={sessionState.turnKey}
          onTimerExpire={() => {
            if (capabilities.canManualAdvance) {
              actions.setForceNextTurnOpen(true);
            }
          }}
          cardBorderClass={cardBorder}
          cardBgElevatedClass={cardBgElevated}
          cashCardRef={cashCardRef}
          currentCash={sessionState.portfolio.currentCash}
          reservedCash={sessionState.portfolio.reservedCash}
          holdingsQty={sessionState.portfolio.holdingsQty}
          holdingsValue={sessionState.portfolio.holdingsValue}
          longQty={sessionState.portfolio.longQty}
          shortQty={sessionState.portfolio.shortQty}
          longValue={sessionState.portfolio.longValue}
          shortLiability={sessionState.portfolio.shortLiability}
          netWorthNow={sessionState.portfolio.netWorthNow}
          totalPL={sessionState.portfolio.totalPL}
          showDrawdown={sessionState.availableTools.drawdown_panel}
          drawdownPct={sessionState.portfolio.drawdownPct}
          maxDrawdownPct={sessionState.portfolio.maxDrawdownPct}
          pendingTrades={sessionState.pendingTrades}
          pastLogs={sessionState.pastTrades}
          newsItems={sessionState.newsFeed}
          hasUnreadNews={sessionState.hasUnreadNews}
          isNewsRead={(newsId) => !!sessionState.readNewsById[newsId]}
          onMarkNewsAsRead={actions.markNewsAsRead}
          macroFactors={sessionState.macroFactors}
          portfolioAnalytics={sessionState.portfolio.portfolioAnalytics}
          showInterestRatePanel={sessionState.availableTools.interest_rate_panel}
          showInflationPanel={sessionState.availableTools.inflation_panel}
          showPortfolioAllocationPanel={sessionState.availableTools.portfolio_allocation_panel}
          showSectorExposurePanel={sessionState.availableTools.sector_exposure_panel}
          showCorrelationPanel={sessionState.availableTools.correlation_panel}
          showBetaVolatilityPanel={sessionState.availableTools.beta_volatility_panel}
          showBenchmarkPanel={sessionState.availableTools.benchmark_panel}
          levelIdForPresentation={levelIdForPresentation}
          activeTutorialId={tutorialFlow.isTutorialOpen ? tutorialFlow.activeTutorialId : null}
          showNewsCard={
            sessionState.availableTools.news || sessionState.newsFeed.length > 0
          }
          showReplayTutorialButton={enableTutorials}
          onReplayTutorial={() =>
            tutorialFlow.openTutorialNow(GENERAL_TRADING_TUTORIAL_ID)
          }
          showUnlocksButton={sessionState.unlocks.length > 0}
          onOpenUnlocks={() => popupQueue.setActiveInfoPopup("unlocks")}
          showMissionsButton={
            (sessionState.passingCriteria?.missions.length ?? 0) > 0 ||
            sessionState.bonusMissions.length > 0
          }
          onOpenMissions={() => popupQueue.setActiveInfoPopup("missions")}
          showReopenContextButton={!!sessionState.levelContext}
          onReopenContext={() => popupQueue.setActiveInfoPopup("context")}
        />
      </div>

      <ToastRoot />

      <TimerEndNextGamePopup
        isOpen={capabilities.canManualAdvance && sessionState.forceNextTurnOpen}
        onConfirm={() => {
          actions.sendNextTick();
          actions.setForceNextTurnOpen(false);
        }}
      />

      <TradingInfoPopups
        activePopup={popupQueue.activeInfoPopup}
        onClose={popupQueue.closeInfoPopup}
        unlocks={sessionState.unlocks}
        onPlayUnlockTutorial={popupQueue.handlePlayUnlockTutorial}
        passingCriteria={sessionState.passingCriteria}
        bonusMissions={sessionState.bonusMissions}
        levelContext={sessionState.levelContext}
      />

      <AutoTickStartPopup
        isOpen={isAutoTickStartPromptOpen}
        hasUnlocks={sessionState.unlocks.length > 0}
        hasContext={!!sessionState.levelContext}
        hasMissions={
          (sessionState.passingCriteria?.missions.length ?? 0) > 0 ||
          sessionState.bonusMissions.length > 0
        }
        onReopenUnlocks={handleReopenUnlocksFromStartPrompt}
        onReopenContext={handleReopenContextFromStartPrompt}
        onReopenMissions={() => {
          popupQueue.setActiveInfoPopup("missions");
          setIsAutoTickStartPromptOpen(false);
        }}
        onStart={handleStartAutoTickLevel}
      />

      <GameEndModal
        modalContentRef={gameEndModalRef}
        isOpen={sessionState.showGameEnd && !!sessionState.gameEnd}
        data={sessionState.gameEnd}
        onBackToLevelSelect={() => {
          actions.setShowGameEnd(false);
          onBackToLevelSelect();
        }}
        onProceed={() => {
          actions.setShowGameEnd(false);
          onProceed();
        }}
        onRetry={() => {
          actions.setShowGameEnd(false);
          (onRetry ?? onProceed)();
        }}
      />

      {enableTutorials ? (
        <TutorialOverlay
          isOpen={tutorialFlow.isTutorialOpen}
          steps={tutorialStepsForCurrentMode}
          onClose={tutorialFlow.closeActiveTutorial}
          stepIndex={tutorialFlow.tutorialOverlayStepIndex}
          onStepIndexChange={tutorialFlow.onTutorialStepIndexChange}
          canGoNext={tutorialFlow.canAdvanceTutorialStep}
        />
      ) : null}

      <ResumeConfirmPopup
        isOpen={sessionState.isResumeConfirmOpen}
        onResume={() => {
          actions.setIsResumeConfirmOpen(false);
        }}
        onReturn={onBackToLevelSelect}
      />
    </div>
  );
}
