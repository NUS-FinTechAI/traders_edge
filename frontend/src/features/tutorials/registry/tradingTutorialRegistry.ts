import type { TutorialDefinition, TutorialStep, TutorialTargetRef } from "../types/tutorialTypes";

export type TradingTutorialId =
  | "gen_tut"
  | "news-feed-basics"
  | "interest-rate-basics"
  | "inflation-basics"
  | "drawdown-basics"
  | "portfolio-allocation-basics"
  | "sector-exposure-basics"
  | "fundamentals-basics"
  | "correlation-basics"
  | "beta-volatility-basics"
  | "rebalancing-basics"
  | "benchmark-basics"
  | "moving-average-basics"
  | "exponential-moving-average-basics"
  | "short-selling-basics"
  | "short-selling-confirmation-basics"
  | "trader-edge-basics"
  | "candlestick-chart-basics"
  | "market-order-basics"
  | "bid-ask-spread-basics"
  | "limit-order-basics"
  | "stop-loss-basics"
  | "stop-limit-basics"
  | (string & {});

export const GENERAL_TRADING_TUTORIAL_ID: TradingTutorialId = "gen_tut";

export interface TradingTutorialTargetMap {
  chartContainer: TutorialTargetRef;
  macroPanel: TutorialTargetRef;
  interestRateCard: TutorialTargetRef;
  inflationCard: TutorialTargetRef;
  portfolioAnalyticsCard: TutorialTargetRef;
  portfolioAllocationPanel: TutorialTargetRef;
  sectorExposurePanel: TutorialTargetRef;
  fundamentalsPanel: TutorialTargetRef;
  correlationPanel: TutorialTargetRef;
  betaVolatilityPanel: TutorialTargetRef;
  benchmarkPanel: TutorialTargetRef;
  benchmarkPortfolioReturnCard: TutorialTargetRef;
  benchmarkBenchmarkReturnCard: TutorialTargetRef;
  benchmarkExcessReturnCard: TutorialTargetRef;
  indicatorPanel: TutorialTargetRef;
  timerCard: TutorialTargetRef;
  tickerInfoCard: TutorialTargetRef;
  tickerFundamentalsCard: TutorialTargetRef;
  currentPriceCard: TutorialTargetRef;
  bidAskCard: TutorialTargetRef;
  bidAskExpandToggle: TutorialTargetRef;
  portfolioCard: TutorialTargetRef;
  pendingTradesLog: TutorialTargetRef;
  pastTradesLog: TutorialTargetRef;
  buySellButtons: TutorialTargetRef;
  buyButton: TutorialTargetRef;
  sellButton: TutorialTargetRef;
  sellShortButton: TutorialTargetRef;
  buyToCoverButton: TutorialTargetRef;
  nextTurnButton: TutorialTargetRef;
  gameEndModal: TutorialTargetRef;
  pageContainer: TutorialTargetRef;
  newsCard: TutorialTargetRef;
  tradeOrderTypeSelect: TutorialTargetRef;
  tradeQuantityInput: TutorialTargetRef;
  tradeLimitPriceInput: TutorialTargetRef;
  tradeStopPriceInput: TutorialTargetRef;
  tradeModalActions: TutorialTargetRef;
  tradeConfirmButton: TutorialTargetRef;
}

type TradingTargetKey = keyof TradingTutorialTargetMap;

const TRADING_TUTORIALS: Record<TradingTutorialId, TutorialDefinition<TradingTutorialId>> = {
  gen_tut: {
    id: "gen_tut",
    steps: [
      {
        id: "chart",
        title: "Candlestick Chart",
        description:
          "Each candle shows Open, High, Low, and Close for a time period. Green means price closed higher than it opened; red means it closed lower.",
        targetKey: "chartContainer",
      },
      {
        id: "chart-how",
        title: "How to read a candle?",
        description:
          "You can also hover over each candle to see the Open, High, Low, and Close values.",
        targetKey: "chartContainer",
        imageSrc: "/candlestick-tutorial.png",
      },
      {
        id: "timer",
        title: "Turn Timer",
        description:
          "You will have 3 minutes each turn to place your trades. The timer resets after clicking Next Turn and warns you at 1 minute remaining.",
        targetKey: "timerCard",
      },
      {
        id: "portfolio-summary",
        title: "Portfolio Summary",
        description:
          "This is your portfolio summary. It shows your current cash, holdings, and net worth. It updates each turn based on the market's movements and your trades.",
        targetKey: "portfolioCard",
      },
      {
        id: "win-condition",
        title: "Win Condition",
        description:
          "To win, you must make enough net worth to reach the next level.",
        targetKey: "portfolioCard",
      },
      {
        id: "buy",
        title: "Buy Button",
        description:
          "Click Buy to open the trade modal and enter the quantity you want to purchase.",
        targetKey: "buyButton",
      },
      {
        id: "sell",
        title: "Sell Button",
        description:
          "Click Sell to open the trade modal and enter the quantity you want to sell.",
        targetKey: "sellButton",
      },
      {
        id: "next",
        title: "Next Turn",
        description:
          "Advance the game to receive the next candle and update your cash and logs.",
        targetKey: "nextTurnButton",
      },
      {
        id: "end",
        title: "You are ready!",
        description:
          "Good luck and have fun. You can end the tutorial now to start trading.",
        targetKey: "pageContainer",
        centered: true,
        noHighlight: true,
      },
    ],
  },
  "news-feed-basics": {
    id: "news-feed-basics",
    steps: [
      {
        id: "news-card",
        title: "News Feed",
        description:
          "This panel shows market-moving updates as turns progress. Use these news items to inform your trading decisions.",
        targetKey: "newsCard",
      },
    ],
  },
  "interest-rate-basics": {
    id: "interest-rate-basics",
    steps: [
      {
        id: "rates-panel-overview",
        title: "Interest Rate Panel",
        description:
          "Read this card as policy rate context: current rate, previous rate, and the latest change in basis points.",
        targetKey: "interestRateCard",
      },
      {
        id: "rates-context-to-decision",
        title: "Turn Macro Context Into Action",
        description:
          "Why this matters: Higher policy rates can pressure valuation-sensitive equity exposure. What to watch: see whether hawkish follow-through persists, fades, or reverses before setting your own risk.",
        targetKey: "interestRateCard",
      },
      {
        id: "rates-not-deterministic",
        title: "Rates Guide Probability, Not Certainty",
        description:
          "A rate signal shifts odds, not certainty. If price becomes choppy, reducing exposure or waiting is often better than forcing a trade.",
        targetKey: "chartContainer",
      },
    ],
  },
  "inflation-basics": {
    id: "inflation-basics",
    steps: [
      {
        id: "inflation-panel-overview",
        title: "Inflation Card (CPI YoY)",
        description:
          "CPI YoY means year-over-year consumer price inflation. It compares this month's CPI versus the same month one year ago.",
        targetKey: "inflationCard",
      },
      {
        id: "inflation-surprise-framing",
        title: "Expectation vs Data",
        description:
          "Markets react to surprise. CPI YoY can be high but still bullish if it comes in below expectation; it can be bearish if above expectation.",
        targetKey: "inflationCard",
      },
      {
        id: "inflation-risk-discipline",
        title: "Trade Defensively Under Uncertainty",
        description:
          "Inflation shocks can unfold in phases: reaction, stabilization, then second-order repricing. Protect drawdown and avoid overtrading between phases.",
        targetKey: "chartContainer",
      },
    ],
  },
  "drawdown-basics": {
    id: "drawdown-basics",
    steps: [
      {
        id: "drawdown-what-it-is",
        title: "What Drawdown Means",
        description:
          "Drawdown is how far your net worth is down from its highest point this level. It measures downside pain, not final profit.",
        targetKey: "portfolioCard",
      },
      {
        id: "drawdown-vs-max",
        title: "Current vs Max Drawdown",
        description:
          "Current drawdown is your drop right now. Max drawdown is the worst drop you have hit so far, even if you recover later.",
        targetKey: "portfolioCard",
      },
      {
        id: "drawdown-how-to-use",
        title: "How to Interpret It",
        description:
          "If drawdown starts climbing quickly, your risk is expanding. Use it to pace size and trade frequency before losses compound.",
        targetKey: "portfolioCard",
      },
    ],
  },
  "portfolio-allocation-basics": {
    id: "portfolio-allocation-basics",
    steps: [
      {
        id: "allocation-overview",
        title: "Portfolio Allocation Panel",
        description:
          "Use this panel to track live weight by ticker so concentration risk is visible before it becomes a problem.",
        targetKey: "portfolioAllocationPanel",
      },
      {
        id: "allocation-largest-weight",
        title: "Largest Position Risk",
        description:
          "Monitor the largest position percentage and trim when it grows beyond your risk budget.",
        targetKey: "portfolioAllocationPanel",
      },
    ],
  },
  "sector-exposure-basics": {
    id: "sector-exposure-basics",
    steps: [
      {
        id: "sector-overview",
        title: "Sector Exposure",
        description:
          "Ticker count is not enough. Sector bars reveal hidden concentration when multiple holdings share the same macro driver.",
        targetKey: "sectorExposurePanel",
      },
      {
        id: "sector-action",
        title: "Use Sector Caps",
        description:
          "If one sector dominates, rebalance into other sectors to reduce correlation-driven drawdown risk.",
        targetKey: "sectorExposurePanel",
      },
    ],
  },
  "fundamentals-basics": {
    id: "fundamentals-basics",
    steps: [
      {
        id: "fundamentals-overview",
        title: "Quality Snapshot",
        description:
          "Use this quality snapshot (P/E, ROE, and D/E) before sizing a position. One metric alone is not enough for stock selection.",
        targetKey: "tickerFundamentalsCard",
      },
      {
        id: "fundamentals-pe",
        title: "P/E: Valuation Pressure",
        description:
          "Price-to-Earnings (P/E) tells you how aggressively earnings are being priced. High P/E can imply stronger growth expectations and higher downside risk if growth disappoints.",
        targetKey: "tickerFundamentalsCard",
      },
      {
        id: "fundamentals-roe",
        title: "ROE%: Capital Efficiency",
        description:
          "Return on Equity (ROE%) shows how effectively management turns shareholder equity into profit. Higher sustained ROE often signals stronger business quality.",
        targetKey: "tickerFundamentalsCard",
      },
      {
        id: "fundamentals-de",
        title: "D/E: Balance Sheet Risk",
        description:
          "Debt-to-Equity (D/E) measures leverage. Higher D/E can amplify returns in good periods but raises fragility during stress and rate shocks.",
        targetKey: "tickerFundamentalsCard",
      },
    ],
  },
  "correlation-basics": {
    id: "correlation-basics",
    steps: [
      {
        id: "correlation-summary",
        title: "Correlation Summary",
        description:
          "Average correlation shows how similarly your holdings move; lower correlation generally improves diversification resilience.",
        targetKey: "correlationPanel",
      },
      {
        id: "correlation-diversifier",
        title: "Find Diversifiers",
        description:
          "Use the lowest average pair correlation metric to identify candidates that can offset crowded theme risk.",
        targetKey: "correlationPanel",
      },
    ],
  },
  "beta-volatility-basics": {
    id: "beta-volatility-basics",
    steps: [
      {
        id: "beta-vol-overview",
        title: "Beta and Volatility",
        description:
          "Beta tracks market sensitivity while volatility tracks realized portfolio swings. You need both to manage risk budget.",
        targetKey: "betaVolatilityPanel",
      },
      {
        id: "beta-vol-hhi",
        title: "Concentration Reinforcement",
        description:
          "HHI captures how concentrated your weights are. High HHI often amplifies volatility during reversals.",
        targetKey: "betaVolatilityPanel",
      },
    ],
  },
  "rebalancing-basics": {
    id: "rebalancing-basics",
    steps: [
      {
        id: "rebalancing-warning",
        title: "Rebalance Prompt",
        description:
          "When a rebalance window appears, shift weights promptly. Waiting too long can fail timing missions even if final PnL is positive.",
        targetKey: "portfolioAllocationPanel",
      },
    ],
  },
  "benchmark-basics": {
    id: "benchmark-basics",
    steps: [
      {
        id: "benchmark-mission-focus",
        title: "Beat The Benchmark Mission",
        description:
          "This panel is critical for benchmark missions. Your goal is not only to make money, but to outperform the benchmark baseline.",
        targetKey: "benchmarkPanel",
      },
      {
        id: "benchmark-portfolio-return",
        title: "Portfolio Return",
        description:
          "Portfolio Return is your strategy's percentage gain or loss from level start.",
        targetKey: "benchmarkPortfolioReturnCard",
      },
      {
        id: "benchmark-benchmark-return",
        title: "Benchmark Return",
        description:
          "Benchmark Return is the passive baseline performance for this level. This is the number you must beat.",
        targetKey: "benchmarkBenchmarkReturnCard",
      },
      {
        id: "benchmark-excess-return",
        title: "Excess Return",
        description:
          "Excess Return = Portfolio Return - Benchmark Return. Positive means outperformance; negative means underperformance.",
        targetKey: "benchmarkExcessReturnCard",
      },
    ],
  },
  "moving-average-basics": {
    id: "moving-average-basics",
    steps: [
      {
        id: "ma-panel",
        title: "Moving Average Tool",
        description:
          "MA smooths noisy candles by averaging recent closes. Watch the MA value update each tick and compare it with raw price.",
        targetKey: "indicatorPanel",
      },
      {
        id: "ma-toggle",
        title: "Show or Hide MA Line",
        description:
          "Use this toggle to turn the MA overlay on or off so you can compare clean candles versus smoothed trend view.",
        targetKey: "indicatorPanel",
      },
      {
        id: "ma-vs-price",
        title: "Read Trend Context",
        description:
          "When price holds above MA, momentum is often constructive. Repeated closes below MA can signal weakening trend.",
        targetKey: "chartContainer",
      },
    ],
  },
  "exponential-moving-average-basics": {
    id: "exponential-moving-average-basics",
    steps: [
      {
        id: "ema-panel",
        title: "Exponential Moving Average Tool",
        description:
          "EMA weights recent prices more heavily, so it reacts faster than a simple MA when momentum shifts.",
        targetKey: "indicatorPanel",
      },
      {
        id: "ema-toggle",
        title: "Toggle EMA Overlay",
        description:
          "Enable or disable EMA to compare fast-reacting trend clues against slower smoothing lines.",
        targetKey: "indicatorPanel",
      },
      {
        id: "ema-vs-ma",
        title: "Use EMA in Fast Markets",
        description:
          "During sharp spikes or pullbacks, EMA often bends earlier than MA. Use it for quicker momentum confirmation.",
        targetKey: "chartContainer",
      },
    ],
  },
  "short-selling-basics": {
    id: "short-selling-basics",
    steps: [
      {
        id: "shorting-what-you-are-doing",
        title: "What Short Selling Means",
        description:
          "Short selling means you borrow shares and sell them first, then buy them back later to close the position. You profit if price falls before you cover.",
        targetKey: "sellShortButton",
      },
      {
        id: "shorting-open-step",
        title: "Step 1: Open The Short",
        description:
          "Choose Sell Short, set quantity and order type, then place the order. After fill, your short quantity appears in portfolio as an open short position.",
        targetKey: "sellShortButton",
      },
      {
        id: "shorting-hold-state",
        title: "While Holding A Short",
        description:
          "You are profitable when price moves down, because you can buy back lower later. If price moves up, your loss grows because cover gets more expensive.",
        targetKey: "portfolioCard",
      },
      {
        id: "shorting-close-step",
        title: "Step 2: Close With Buy To Cover",
        description:
          "Use Buy to Cover to buy shares back and close some or all of your short. This is the only close action for shorts in this game.",
        targetKey: "buyToCoverButton",
      },
      {
        id: "shorting-pnl-examples",
        title: "Quick P/L Example",
        description:
          "Example: short at $100 and cover at $90 -> +$10/share profit. Short at $100 and cover at $110 -> -$10/share loss.",
        targetKey: "currentPriceCard",
      },
      {
        id: "shorting-not-inverted-buy",
        title: "Do Not Treat It As Inverted Buy",
        description:
          "Shorting is a borrow-sell-then-cover workflow, not normal buying in reverse. Track open short size and cover plan explicitly before placing orders.",
        targetKey: "buySellButtons",
      }
    ],
  },
  "short-selling-confirmation-basics": {
    id: "short-selling-confirmation-basics",
    steps: [
      {
        id: "short-confirmation",
        title: "Confirm Before Entry",
        description:
          "In this level, use MA and EMA as confirmation tools before opening a short instead of reacting to one candle.",
        targetKey: "indicatorPanel",
      },
      {
        id: "short-entry-discipline",
        title: "Time Entries Carefully",
        description:
          "Wait for confirmation after bounces. A downtrend can still rally hard before resuming lower.",
        targetKey: "chartContainer",
      },
      {
        id: "short-cover-discipline",
        title: "Cover With A Plan",
        description:
          "Use Buy to Cover deliberately when momentum weakens or risk rises. Do not confuse it with opening a long.",
        targetKey: "buySellButtons",
      },
      {
        id: "short-ma-ema-context",
        title: "Use MA/EMA For Context",
        description:
          "Treat MA/EMA as context for trend and timing, then execute with disciplined order selection and size control.",
        targetKey: "indicatorPanel",
      },
    ],
  },
  "trader-edge-basics": {
    id: "trader-edge-basics",
    steps: [
      {
        id: "welcome",
        title: "Welcome to Trader Edge",
        description:
          "This level introduces how the game works before you start trading decisions.",
        targetKey: "pageContainer",
        centered: true,
        noHighlight: true,
      },
      {
        id: "price-chart",
        title: "Price and Candles",
        description:
          "This chart shows price movement over time. Each new tick can add a new candle.",
        targetKey: "chartContainer",
      },
      {
        id: "turn-timer",
        title: "Turn Timer",
        description:
          "This timer shows how much time remains for your current turn.",
        targetKey: "timerCard",
      },
      {
        id: "current-price",
        title: "Last Price",
        description:
          "This section in the execution deck shows the latest traded price and tick-to-tick change for the current ticker.",
        targetKey: "currentPriceCard",
      },
      {
        id: "portfolio-summary",
        title: "Portfolio Summary",
        description:
          "This section summarizes your cash, holdings, net worth, and current P/L.",
        targetKey: "portfolioCard",
      },
      {
        id: "pending-trades",
        title: "Pending Trades",
        description:
          "Open orders that are waiting to fill appear here.",
        targetKey: "pendingTradesLog",
      },
      {
        id: "past-trades",
        title: "Past Trades",
        description:
          "Completed orders are recorded here as your trade history.",
        targetKey: "pastTradesLog",
      },
      {
        id: "next-turn-once",
        title: "Next Turn (Step 1/2)",
        description:
          "Click Next Turn once to reveal the next candlestick.",
        targetKey: "nextTurnButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "next-turn-twice",
        title: "Next Turn (Step 2/2)",
        description:
          "Click Next Turn again to finish this level.",
        targetKey: "nextTurnButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "game-end-modal",
        title: "Game End Popup",
        description:
          "This popup shows your level result, mission outcomes, and progression to the next level.",
        targetKey: "gameEndModal",
      },
    ],
  },
  "candlestick-chart-basics": {
    id: "candlestick-chart-basics",
    steps: [
      {
        id: "chart-overview",
        title: "How the Chart Works",
        description:
          "Each candlestick summarizes one tick using Open, High, Low, and Close prices.",
        targetKey: "chartContainer",
        allowTargetInteraction: true,
      },
      {
        id: "read-candles",
        title: "Reading Candles",
        description:
          "Green candles close higher than they open; red candles close lower than they open.",
        targetKey: "chartContainer",
        allowTargetInteraction: true,
      },
      {
        id: "inspect-candles",
        title: "Inspect Values",
        description:
          "Hover over candles to inspect exact OHLC values for a tick.",
        targetKey: "chartContainer",
        allowTargetInteraction: true,
        imageSrc: "/candlestick-tutorial.png",
      },
      {
        id: "zoom-scroll",
        title: "Scroll and Zoom",
        description:
          "Scroll the chart to review earlier candles and zoom in/out to inspect structure. Drag the chart to pan left/right.",
        targetKey: "chartContainer",
        allowTargetInteraction: true,
      },
    ],
  },
  "market-order-basics": {
    id: "market-order-basics",
    steps: [
      {
        id: "market-orders-overview",
        title: "Market Buy & Sell",
        description:
          "Market orders are the fastest way to get in or out. You trade right away at the best available price.",
        targetKey: "buySellButtons",
      },
      {
        id: "market-how-it-works",
        title: "How It Works",
        description:
          "Watch the current price while you decide. A market buy usually fills near the ask, and a market sell usually fills near the bid.",
        targetKey: "currentPriceCard",
      },
      {
        id: "market-click-buy",
        title: "Open Buy Order",
        description:
          "Click Buy to open your ticket and start your order.",
        targetKey: "buyButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "market-select-order-type",
        title: "Select Market Order (Buy)",
        description:
          "Choose `Market` so your buy executes immediately.",
        targetKey: "tradeOrderTypeSelect",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "market-enter-quantity",
        title: "Enter Buy Quantity",
        description:
          "Set how many shares you want to buy.",
        targetKey: "tradeQuantityInput",
        allowTargetInteraction: true,
      },
      {
        id: "market-place-order",
        title: "Place Buy Or Cancel",
        description:
          "Click `Place Buy Order` to send it now, or `Cancel` to close this ticket.",
        targetKey: "tradeModalActions",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "market-click-sell",
        title: "Open Sell Order",
        description:
          "Great. Now click Sell to open the sell ticket.",
        targetKey: "sellButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "market-select-order-type-sell",
        title: "Select Market Order (Sell)",
        description:
          "Choose `Market` again for the sell side.",
        targetKey: "tradeOrderTypeSelect",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "market-enter-quantity-sell",
        title: "Enter Sell Quantity",
        description:
          "Set how many shares you want to sell.",
        targetKey: "tradeQuantityInput",
        allowTargetInteraction: true,
      },
      {
        id: "market-place-order-sell",
        title: "Place Sell Or Cancel",
        description:
          "Click `Place Sell Order` to send it now, or `Cancel` to close this ticket and continue.",
        targetKey: "tradeModalActions",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "market-order-complete",
        title: "Nice Work",
        description:
          "You have just practiced buying and selling with market orders. Use this to your advantage when you want to enter or exit quickly and are less concerned about price!",
        targetKey: "pageContainer",
        centered: true,
        noHighlight: true,
      },
    ],
  },
  "bid-ask-spread-basics": {
    id: "bid-ask-spread-basics",
    steps: [
      {
        id: "bid-ask-overview",
        title: "Bid, Ask, and Spread",
        description:
          "This summary shows the best bid, best ask, and spread. Bid is the highest current buy price, ask is the lowest current sell price.",
        targetKey: "bidAskCard",
      },
      {
        id: "spread-expand-depth",
        title: "Expand The Order Book",
        description:
          "Click this control to expand full bid and ask depth. Continue only after expanding the panel.",
        targetKey: "bidAskExpandToggle",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "spread-reading",
        title: "Read Liquidity and Priority",
        description:
          "Top rows are the best executable prices. Deeper rows show additional liquidity and help you judge slippage risk on larger orders.",
        targetKey: "bidAskCard",
      },
      {
        id: "spread-panel",
        title: "Use Bid/Ask In Execution",
        description:
          "Use spread width and depth together: wide/thin books favor patience and tighter sizing; tight/deep books better support immediate execution.",
        targetKey: "bidAskCard",
      },
    ],
  },
  "limit-order-basics": {
    id: "limit-order-basics",
    steps: [
      {
        id: "limit-orders-overview",
        title: "What Is a Limit Order?",
        description:
          "A limit order sets your worst acceptable execution price. It gives price control, but may not fill.",
        targetKey: "buySellButtons",
      },
      {
        id: "limit-how-it-works",
        title: "How It Works",
        description:
          "If price is around $100, a limit buy at $98 waits for a dip, and a limit sell at $103 waits for a rise. You control price, but the order may wait.",
        targetKey: "currentPriceCard",
      },
      {
        id: "limit-click-buy",
        title: "Open Buy Order",
        description:
          "Click Buy to open your ticket.",
        targetKey: "buyButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "limit-select-order-type",
        title: "Select Limit Order (Buy)",
        description:
          "Choose `Limit` so you can set your own buy price.",
        targetKey: "tradeOrderTypeSelect",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "limit-enter-values",
        title: "Enter Buy Quantity",
        description:
          "Set how many shares you want to buy.",
        targetKey: "tradeQuantityInput",
        allowTargetInteraction: true,
      },
      {
        id: "limit-enter-price",
        title: "Enter Buy Limit Price",
        description:
          "Set the highest price you are willing to pay.",
        targetKey: "tradeLimitPriceInput",
        allowTargetInteraction: true,
      },
      {
        id: "limit-submit-order",
        title: "Place Buy Or Cancel",
        description:
          "Click `Place Buy Order` to queue the order, or `Cancel` to close this ticket and continue.",
        targetKey: "tradeModalActions",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "limit-click-sell",
        title: "Open Sell Order",
        description:
          "Now click Sell to open the sell ticket.",
        targetKey: "sellButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "limit-select-order-type-sell",
        title: "Select Limit Order (Sell)",
        description:
          "Choose `Limit` again for the sell side.",
        targetKey: "tradeOrderTypeSelect",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "limit-enter-values-sell",
        title: "Enter Sell Quantity",
        description:
          "Set how many shares you want to sell.",
        targetKey: "tradeQuantityInput",
        allowTargetInteraction: true,
      },
      {
        id: "limit-enter-price-sell",
        title: "Enter Sell Limit Price",
        description:
          "Set the lowest price you are willing to accept.",
        targetKey: "tradeLimitPriceInput",
        allowTargetInteraction: true,
      },
      {
        id: "limit-submit-order-sell",
        title: "Place Sell Or Cancel",
        description:
          "Click `Place Sell Order` to queue the order, or `Cancel` to close this ticket and continue.",
        targetKey: "tradeModalActions",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "limit-order-complete",
        title: "Limit Order Summary",
        description:
          "Great progress. Limit orders help you control price, especially when you can wait for your level.",
        targetKey: "pageContainer",
        centered: true,
        noHighlight: true,
      },
    ],
  },
  "stop-loss-basics": {
    id: "stop-loss-basics",
    steps: [
      {
        id: "stop-loss-overview",
        title: "What Is a Stop Order?",
        description:
          "A stop order triggers at your stop price, then submits a market order.",
        targetKey: "buySellButtons",
      },
      {
        id: "stop-loss-how-it-works",
        title: "How It Works",
        description:
          "If you bought near $100, a stop sell at $95 triggers when price falls there, then sends a market sell. It is useful for protecting downside.",
        targetKey: "currentPriceCard",
      },
      {
        id: "stop-loss-click-buy",
        title: "Open Buy Order",
        description:
          "Click Buy to open your ticket.",
        targetKey: "buyButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-loss-select-order-type",
        title: "Select Stop Order (Buy)",
        description:
          "Choose `Stop` for the buy side.",
        targetKey: "tradeOrderTypeSelect",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-loss-enter-values",
        title: "Enter Buy Quantity",
        description:
          "Set how many shares you want to buy.",
        targetKey: "tradeQuantityInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-loss-enter-stop-price",
        title: "Enter Buy Stop Price",
        description:
          "Set the trigger price that activates this order.",
        targetKey: "tradeStopPriceInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-loss-submit-order",
        title: "Place Buy Or Cancel",
        description:
          "Click `Place Buy Order` to queue it, or `Cancel` to close this ticket and continue.",
        targetKey: "tradeModalActions",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-loss-click-sell",
        title: "Open Sell Order",
        description:
          "Now click Sell to open the sell ticket.",
        targetKey: "sellButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-loss-select-order-type-sell",
        title: "Select Stop Order (Sell)",
        description:
          "Choose `Stop` for the sell side.",
        targetKey: "tradeOrderTypeSelect",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-loss-enter-values-sell",
        title: "Enter Sell Quantity",
        description:
          "Set how many shares you want to sell.",
        targetKey: "tradeQuantityInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-loss-enter-stop-price-sell",
        title: "Enter Sell Stop Price",
        description:
          "Set the stop price for your sell-side protection.",
        targetKey: "tradeStopPriceInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-loss-submit-order-sell",
        title: "Place Sell Or Cancel",
        description:
          "Click `Place Sell Order` to queue it, or `Cancel` to close this ticket and continue.",
        targetKey: "tradeModalActions",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-loss-complete",
        title: "Stop Order Summary",
        description:
          "Well done. Stop orders are useful when risk control matters more than getting an exact exit price.",
        targetKey: "pageContainer",
        centered: true,
        noHighlight: true,
      },
    ],
  },
  "stop-limit-basics": {
    id: "stop-limit-basics",
    steps: [
      {
        id: "stop-limit-overview",
        title: "What Is a Stop-Limit Order?",
        description:
          "A stop-limit order has two prices: stop trigger and limit execution price.",
        targetKey: "buySellButtons",
      },
      {
        id: "stop-limit-how-it-works",
        title: "How It Works",
        description:
          "With price near $100, a stop-limit buy can trigger at $102, then only fill at your chosen limit or better. It gives more control after trigger.",
        targetKey: "currentPriceCard",
      },
      {
        id: "stop-limit-click-buy",
        title: "Open Buy Order",
        description:
          "Click Buy to open your ticket.",
        targetKey: "buyButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-limit-select-order-type",
        title: "Select Stop Limit (Buy)",
        description:
          "Choose `Stop Limit` for the buy side.",
        targetKey: "tradeOrderTypeSelect",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-limit-enter-values",
        title: "Enter Buy Quantity",
        description:
          "Set how many shares you want to buy.",
        targetKey: "tradeQuantityInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-limit-enter-stop-price",
        title: "Enter Buy Stop Price",
        description:
          "Set the stop trigger price.",
        targetKey: "tradeStopPriceInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-limit-enter-limit-price",
        title: "Enter Buy Limit Price",
        description:
          "Set the limit price you are willing to pay after trigger.",
        targetKey: "tradeLimitPriceInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-limit-submit-order",
        title: "Place Buy Or Cancel",
        description:
          "Click `Place Buy Order` to queue it, or `Cancel` to close this ticket and continue.",
        targetKey: "tradeModalActions",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-limit-click-sell",
        title: "Open Sell Order",
        description:
          "Now click Sell to open the sell ticket.",
        targetKey: "sellButton",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-limit-select-order-type-sell",
        title: "Select Stop Limit (Sell)",
        description:
          "Choose `Stop Limit` for the sell side.",
        targetKey: "tradeOrderTypeSelect",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-limit-enter-values-sell",
        title: "Enter Sell Quantity",
        description:
          "Set how many shares you want to sell.",
        targetKey: "tradeQuantityInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-limit-enter-stop-price-sell",
        title: "Enter Sell Stop Price",
        description:
          "Set the stop trigger price for the sell side.",
        targetKey: "tradeStopPriceInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-limit-enter-limit-price-sell",
        title: "Enter Sell Limit Price",
        description:
          "Set the minimum acceptable limit price after trigger.",
        targetKey: "tradeLimitPriceInput",
        allowTargetInteraction: true,
      },
      {
        id: "stop-limit-submit-order-sell",
        title: "Place Sell Or Cancel",
        description:
          "Click `Place Sell Order` to queue it, or `Cancel` to close this ticket and continue.",
        targetKey: "tradeModalActions",
        allowTargetInteraction: true,
        requireActionToAdvance: true,
      },
      {
        id: "stop-limit-complete",
        title: "Stop-Limit Summary",
        description:
          "Excellent. Stop-limit gives you post-trigger price control, which can help in fast markets when precision matters.",
        targetKey: "pageContainer",
        centered: true,
        noHighlight: true,
      },
    ],
  },
};

export function buildTradingTutorialSteps(id: TradingTutorialId, targets: TradingTutorialTargetMap): TutorialStep[] {
  const definition = TRADING_TUTORIALS[id];
  if (!definition) return [];
  return definition.steps.map((step) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    targetRef: targets[step.targetKey as TradingTargetKey],
    allowTargetInteraction: step.allowTargetInteraction,
    requireActionToAdvance: step.requireActionToAdvance,
    centered: step.centered,
    noHighlight: step.noHighlight,
    imageSrc: step.imageSrc,
  }));
}
