import { useState, type RefObject } from "react";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import { CountdownTimer } from "./CountdownTimer";
import { PortfolioSummary } from "./PortfolioSummary";
import { Log, type LogItem } from "../../../shared/ui/Log";
import { RightPanelActions } from "./RightPanelActions";
import type {
  MacroFactorDefinition,
  NewsFeedItem,
  PortfolioAnalytics,
} from "../types/tradingTypes";
import { NewsFeedCard } from "./NewsFeedCard";
import { NewsArticlePopup } from "./NewsArticlePopup";
import { Card } from "../../../shared/ui/Card";
import { MacroFactorsPanel } from "./MacroFactorsPanel";
import { PortfolioAllocationPanel } from "./PortfolioAllocationPanel";
import { SectorExposurePanel } from "./SectorExposurePanel";
import { CorrelationPanel } from "./CorrelationPanel";
import { BetaVolatilityPanel } from "./BetaVolatilityPanel";
import { BenchmarkPanel } from "./BenchmarkPanel";

export interface TradingRightPanelProps {
  timerCardRef: RefObject<HTMLDivElement | null>;
  pendingTradesLogRef?: RefObject<HTMLDivElement | null>;
  pastTradesLogRef?: RefObject<HTMLDivElement | null>;
  newsCardRef?: RefObject<HTMLDivElement | null>;
  macroPanelRef?: RefObject<HTMLDivElement | null>;
  interestRateCardRef?: RefObject<HTMLDivElement | null>;
  inflationCardRef?: RefObject<HTMLDivElement | null>;
  portfolioAnalyticsCardRef?: RefObject<HTMLDivElement | null>;
  portfolioAllocationPanelRef?: RefObject<HTMLDivElement | null>;
  sectorExposurePanelRef?: RefObject<HTMLDivElement | null>;
  correlationPanelRef?: RefObject<HTMLDivElement | null>;
  betaVolatilityPanelRef?: RefObject<HTMLDivElement | null>;
  benchmarkPanelRef?: RefObject<HTMLDivElement | null>;
  benchmarkPortfolioReturnCardRef?: RefObject<HTMLDivElement | null>;
  benchmarkBenchmarkReturnCardRef?: RefObject<HTMLDivElement | null>;
  benchmarkExcessReturnCardRef?: RefObject<HTMLDivElement | null>;
  showTimer?: boolean;
  isTimerActive: boolean;
  gameStarted: boolean;
  turnKey: number;
  onTimerExpire: () => void;
  cardBorderClass: string;
  cardBgElevatedClass: string;
  cashCardRef: RefObject<HTMLDivElement | null>;
  currentCash: number | null;
  reservedCash: number;
  holdingsQty: number;
  holdingsValue: number;
  longQty?: number;
  shortQty?: number;
  longValue?: number;
  shortLiability?: number;
  netWorthNow: number | null;
  totalPL: number | null;
  showDrawdown?: boolean;
  drawdownPct?: number | null;
  maxDrawdownPct?: number | null;
  pendingTrades: LogItem[];
  pastLogs: LogItem[];
  newsItems: NewsFeedItem[];
  hasUnreadNews: boolean;
  isNewsRead: (newsId: string) => boolean;
  onMarkNewsAsRead: (newsId: string) => void;
  macroFactors?: MacroFactorDefinition[];
  portfolioAnalytics?: PortfolioAnalytics | null;
  showInterestRatePanel?: boolean;
  showInflationPanel?: boolean;
  showPortfolioAllocationPanel?: boolean;
  showSectorExposurePanel?: boolean;
  showCorrelationPanel?: boolean;
  showBetaVolatilityPanel?: boolean;
  showBenchmarkPanel?: boolean;
  levelIdForPresentation?: string | null;
  activeTutorialId?: string | null;
  showNewsCard?: boolean;
  showReplayTutorialButton?: boolean;
  onReplayTutorial?: () => void;
  showUnlocksButton?: boolean;
  onOpenUnlocks?: () => void;
  showMissionsButton?: boolean;
  onOpenMissions?: () => void;
  showReopenContextButton?: boolean;
  onReopenContext?: () => void;
}

export function TradingRightPanel({
  timerCardRef,
  pendingTradesLogRef,
  pastTradesLogRef,
  newsCardRef,
  macroPanelRef,
  interestRateCardRef,
  inflationCardRef,
  portfolioAnalyticsCardRef,
  portfolioAllocationPanelRef,
  sectorExposurePanelRef,
  correlationPanelRef,
  betaVolatilityPanelRef,
  benchmarkPanelRef,
  benchmarkPortfolioReturnCardRef,
  benchmarkBenchmarkReturnCardRef,
  benchmarkExcessReturnCardRef,
  showTimer = true,
  isTimerActive,
  gameStarted,
  turnKey,
  onTimerExpire,
  cardBorderClass,
  cardBgElevatedClass,
  cashCardRef,
  currentCash,
  reservedCash,
  holdingsQty,
  holdingsValue,
  longQty = 0,
  shortQty = 0,
  longValue = 0,
  shortLiability = 0,
  netWorthNow,
  totalPL,
  showDrawdown = false,
  drawdownPct = null,
  maxDrawdownPct = null,
  pendingTrades,
  pastLogs,
  newsItems,
  hasUnreadNews,
  isNewsRead,
  onMarkNewsAsRead,
  macroFactors = [],
  portfolioAnalytics = null,
  showInterestRatePanel = false,
  showInflationPanel = false,
  showPortfolioAllocationPanel = false,
  showSectorExposurePanel = false,
  showCorrelationPanel = false,
  showBetaVolatilityPanel = false,
  showBenchmarkPanel = false,
  levelIdForPresentation = null,
  activeTutorialId = null,
  showNewsCard = true,
  showReplayTutorialButton,
  onReplayTutorial,
  showUnlocksButton,
  onOpenUnlocks,
  showMissionsButton,
  onOpenMissions,
  showReopenContextButton,
  onReopenContext,
}: TradingRightPanelProps) {
  const [activeNewsArticle, setActiveNewsArticle] = useState<NewsFeedItem | null>(
    null
  );
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const visibleMacroFactors = macroFactors.filter((factor) => {
    if (factor.factor_key === "interest_rate") return showInterestRatePanel;
    if (factor.factor_key === "inflation") return showInflationPanel;
    return false;
  });
  const showPortfolioAnalyticsCard =
    showPortfolioAllocationPanel ||
    showSectorExposurePanel ||
    showCorrelationPanel ||
    showBetaVolatilityPanel ||
    showBenchmarkPanel;

  const handleOpenNewsArticle = (item: NewsFeedItem) => {
    onMarkNewsAsRead(item.id);
    setActiveNewsArticle(item);
  };

  return (
    <div className="col-span-12 lg:col-span-3 flex flex-col gap-3">
      <RightPanelActions
        showReplayTutorialButton={showReplayTutorialButton}
        onReplayTutorial={onReplayTutorial}
        showUnlocksButton={showUnlocksButton}
        onOpenUnlocks={onOpenUnlocks}
        showMissionsButton={showMissionsButton}
        onOpenMissions={onOpenMissions}
        showReopenContextButton={showReopenContextButton}
        onReopenContext={onReopenContext}
      />

      {gameStarted && showTimer ? (
        <div
          ref={timerCardRef}
          className={`rounded-lg ${cardBgElevatedClass} ${cardBorderClass} p-3`}
        >
          <div className={`text-xs ${textPrimary} mb-1`}>Turn Timer</div>
          <CountdownTimer
            durationSec={180}
            warningThresholdSec={60}
            resetKey={turnKey}
            onExpire={onTimerExpire}
            isActive={isTimerActive}
          />
        </div>
      ) : null}
      <div ref={cashCardRef}>
        <Card
          elevated
          collapsible
          title="Portfolio Summary"
          contentClassName="p-0"
        >
          <PortfolioSummary
            currentCash={currentCash}
            reservedCash={reservedCash}
            holdingsQty={holdingsQty}
            holdingsValue={holdingsValue}
            longQty={longQty}
            shortQty={shortQty}
            longValue={longValue}
            shortLiability={shortLiability}
            netWorthNow={netWorthNow}
            totalPL={totalPL}
            showDrawdown={showDrawdown}
            drawdownPct={drawdownPct}
            maxDrawdownPct={maxDrawdownPct}
            hideTitle
          />
        </Card>
      </div>

      {showNewsCard ? (
        <div ref={newsCardRef}>
          <NewsFeedCard
            items={newsItems}
            hasUnreadNews={hasUnreadNews}
            isNewsRead={isNewsRead}
            onOpenArticle={handleOpenNewsArticle}
          />
        </div>
      ) : null}

      {showPortfolioAnalyticsCard ? (
        <div ref={portfolioAnalyticsCardRef}>
          <Card elevated collapsible title="Portfolio Analytics" contentClassName="p-3">
            <div className="space-y-3">
              {showPortfolioAllocationPanel ? (
                <section ref={portfolioAllocationPanelRef} className="space-y-1">
                  <div
                    className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}
                  >
                    Allocation
                  </div>
                  <PortfolioAllocationPanel
                    analytics={portfolioAnalytics}
                  />
                </section>
              ) : null}
              {showSectorExposurePanel ? (
                <section ref={sectorExposurePanelRef} className="space-y-1">
                  <div
                    className={`text-xs font-semibold uppercase tracking-wide ${textSecondary}`}
                  >
                    Sector Exposure
                  </div>
                  <SectorExposurePanel analytics={portfolioAnalytics} />
                </section>
              ) : null}
              {showCorrelationPanel ? (
                <section ref={correlationPanelRef} className="space-y-1">
                  <div className={`text-[11px] uppercase tracking-wide ${textSecondary}`}>
                    Correlation
                  </div>
                  <CorrelationPanel analytics={portfolioAnalytics} />
                </section>
              ) : null}
              {showBetaVolatilityPanel ? (
                <section ref={betaVolatilityPanelRef} className="space-y-1">
                  <div className={`text-[11px] uppercase tracking-wide ${textSecondary}`}>
                    Beta / Volatility
                  </div>
                  <BetaVolatilityPanel analytics={portfolioAnalytics} />
                </section>
              ) : null}
              {showBenchmarkPanel ? (
                <section ref={benchmarkPanelRef} className="space-y-1">
                  <div className={`text-[11px] uppercase tracking-wide ${textSecondary}`}>
                    Benchmark
                  </div>
                  <BenchmarkPanel
                    analytics={portfolioAnalytics}
                    portfolioReturnCardRef={benchmarkPortfolioReturnCardRef}
                    benchmarkReturnCardRef={benchmarkBenchmarkReturnCardRef}
                    excessReturnCardRef={benchmarkExcessReturnCardRef}
                  />
                </section>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}
      {visibleMacroFactors.length > 0 ? (
        <div ref={macroPanelRef}>
          <Card
            elevated
            collapsible
            title="Macro Context"
            contentClassName="p-0"
          >
            <MacroFactorsPanel
              interestRateCardRef={interestRateCardRef}
              inflationCardRef={inflationCardRef}
              factors={visibleMacroFactors}
              textPrimaryClass={textPrimary}
              cardBorderClass={cardBorderClass}
              cardBgElevatedClass={cardBgElevatedClass}
              renderInsideCard
              levelIdForPresentation={levelIdForPresentation}
              activeTutorialId={activeTutorialId}
            />
          </Card>
        </div>
      ) : null}

      <div ref={pendingTradesLogRef}>
        <Log
          title="Pending Trades"
          items={pendingTrades}
          collapsible
          defaultCollapsed
          hideTitle
        />
      </div>
      <div ref={pastTradesLogRef}>
        <Log title="Past Trades" items={pastLogs} collapsible defaultCollapsed hideTitle />
      </div>

      <NewsArticlePopup
        isOpen={!!activeNewsArticle}
        article={activeNewsArticle}
        onClose={() => setActiveNewsArticle(null)}
      />
    </div>
  );
}
