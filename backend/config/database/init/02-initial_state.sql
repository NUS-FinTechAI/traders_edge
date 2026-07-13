-- ======================================
-- (Users are created at runtime via Firebase sign-in; no seed users.)
-- ======================================

-- ======================================
-- Populate normalized levels
-- ======================================
INSERT INTO levels (
    level_id,
    level_type,
    title,
    module,
    level_order,
    context,
    level_tutorial_id,
    tick_mode,
    manual_start,
    total_ticks,
    preloaded_ticks,
    auto_tick_interval_seconds,
    starting_cash,
    final_cash_points_multiplier,
    passing_criteria_type
) VALUES
(
    'module-1.1',
    'tutorial',
    'What Are Stocks? How Trader Edge Works',
    1,
    1,
    'Welcome to Trader Edge. This level introduces price movement, pending trades, past trades, and how Next Tick advances the chart.',
    'trader-edge-basics',
    'manual',
    false,
    6,
    5,
    NULL,
    100000,
    0,
    'all_of'
),
(
    'module-1.2',
    'tutorial',
    'How the Candlestick Chart Works',
    1,
    2,
    'Candlesticks summarize price action for each turn. Learn how to read candles and how to zoom and scroll the chart.',
    'candlestick-chart-basics',
    'manual',
    false,
    10,
    6,
    NULL,
    100000,
    0,
    'all_of'
),
(
    'module-1.3',
    'tutorial',
    'The Market Order',
    1,
    3,
    'Use market orders to buy and sell immediately at the best available price.',
    'market-order-basics',
    'manual',
    false,
    10,
    0,
    NULL,
    100000,
    0,
    'all_of'
),
(
    'module-1.4',
    'tutorial',
    'Buy Low, Sell High',
    1,
    4,
    'Buy shares at lower prices and sell at higher prices to make a profit.',
    NULL,
    'manual',
    false,
    12,
    0,
    NULL,
    100000,
    0,
    'all_of'
),
(
    'module-2.1',
    'tutorial',
    'Company Headlines and Stock Reactions',
    2,
    1,
    'Company-specific news often moves one stock before the wider market reacts. Follow Microsoft through headline-driven sentiment shifts and plan entries around narrative changes.',
    NULL,
    'manual',
    false,
    12,
    2,
    NULL,
    100000,
    0.1,
    'all_of'
),
(
    'module-2.2',
    'tutorial',
    'Earnings Beat the Hype',
    2,
    2,
    'Markets price earnings before the release. Watch how NVIDIA reacts when reported results match elevated expectations but guidance keeps sentiment bullish.',
    NULL,
    'manual',
    false,
    14,
    2,
    NULL,
    100000,
    0.1,
    'all_of'
),
(
    'module-2.3',
    'tutorial',
    'When Earnings Disappoint',
    2,
    3,
    'Expectations can become a trap. Track Tesla through a hyped setup, then an earnings miss that resets price quickly and tests risk management discipline.',
    NULL,
    'manual',
    false,
    14,
    2,
    NULL,
    100000,
    0.1,
    'all_of'
),
(
    'module-2.4',
    'tutorial',
    'Trend Clarity with Moving Average',
    2,
    4,
    'Use a simple moving average to smooth noisy candles and read trend direction. Observe how price and MA interact during consolidation and trend continuation.',
    NULL,
    'manual',
    false,
    36,
    6,
    NULL,
    100000,
    0.12,
    'all_of'
),
(
    'module-2.5',
    'tutorial',
    'Viral Spike and EMA Reaction',
    2,
    5,
    'EMA reacts faster than a simple moving average. Trade a viral momentum surge in Palantir and compare how quickly EMA reflects reversals.',
    NULL,
    'manual',
    false,
    35,
    6,
    NULL,
    100000,
    0.12,
    'all_of'
),
(
    'module-3.1',
    'tutorial',
    'Ticking Markets: Bid, Ask, and Spread',
    3,
    1,
    'Module 3 switches to a live ticking market. Learn how bid, ask, and spread shape execution while price keeps moving even when you are still deciding.',
    NULL,
    'auto',
    true,
    90,
    8,
    2,
    100000,
    0.12,
    'all_of'
),
(
    'module-3.2',
    'tutorial',
    'Limit Orders in a Moving Tape',
    3,
    2,
    'Use limit orders to set your entry while you keep watching price action, order flow, and incoming news.',
    NULL,
    'auto',
    true,
    95,
    8,
    2,
    100000,
    0.12,
    'all_of'
),
(
    'module-3.3',
    'tutorial',
    'Stop Loss for Downside Control',
    3,
    3,
    'Practice placing stop-loss orders so risk is capped while the market ticks forward without waiting for manual turns.',
    NULL,
    'auto',
    true,
    100,
    10,
    2,
    100000,
    0.12,
    'all_of'
),
(
    'module-3.4',
    'tutorial',
    'Stop Limit Precision',
    3,
    4,
    'Compare stop loss and stop limit behavior during fast moves. Learn why stop limit gives price control but may not fill.',
    NULL,
    'auto',
    true,
    110,
    10,
    2,
    100000,
    0.13,
    'all_of'
),
(
    'module-3.5',
    'tutorial',
    'Short Selling Foundations',
    3,
    5,
    'Learn short selling mechanics in a clear bearish tape: borrow shares, sell first, then buy to cover. Profit from downside while respecting squeeze risk.',
    'short-selling-basics',
    'auto',
    true,
    116,
    10,
    2,
    100000,
    0.13,
    'all_of'
),
(
    'module-3.6',
    'tutorial',
    'Shorting With MA/EMA Confirmation',
    3,
    6,
    'Advance shorting discipline with MA/EMA confirmation in a downtrend that includes a counter-trend squeeze. Time entries, manage risk, and cover decisively.',
    'short-selling-confirmation-basics',
    'auto',
    true,
    120,
    10,
    2,
    100000,
    0.14,
    'all_of'
),
(
    'puzzle-1.1',
    'puzzle',
    'Asian Financial Crisis',
    NULL,
    1,
    'Regional currency devaluations in 1997 trigger capital flight, yen volatility, and export demand risk; assess Toyota sensitivity to Asia turmoil.',
    NULL,
    'auto',
    true,
    89,
    0,
    2,
    100000,
    0,
    'all_of'
),
(
    'puzzle-1.2',
    'puzzle',
    'Coronavirus Crash',
    NULL,
    2,
    'Early 2020 pandemic drives lockdowns, travel bans, and a no sail order; evaluate the severe revenue shock to cruise lines.',
    NULL,
    'auto',
    true,
    86,
    0,
    2,
    100000,
    0,
    'all_of'
)
ON CONFLICT DO NOTHING;

INSERT INTO levels (
    level_id,
    level_type,
    title,
    module,
    level_order,
    context,
    level_tutorial_id,
    tick_mode,
    manual_start,
    total_ticks,
    preloaded_ticks,
    auto_tick_interval_seconds,
    starting_cash,
    final_cash_points_multiplier,
    passing_criteria_type
) VALUES
(
    'module-4.1',
    'tutorial',
    'Interest Rates and Risk Appetite',
    4,
    1,
    'You inherit a large AAPL position into a rate-sensitive tape. Decide when to trim, hold, or re-risk as policy signals reset risk appetite.',
    NULL,
    'auto',
    true,
    112,
    10,
    2,
    56000,
    0.13,
    'all_of'
),
(
    'module-4.2',
    'tutorial',
    'Inflation Surprise vs Expectations',
    4,
    2,
    'You start with meaningful NVDA exposure ahead of CPI. Manage inflation-surprise risk by actively reducing or rebuilding positions as expectations shift.',
    NULL,
    'auto',
    true,
    116,
    10,
    2,
    43000,
    0.13,
    'all_of'
),
(
    'module-4.3',
    'tutorial',
    'Fed Speech and Mixed Signals',
    4,
    3,
    'You enter with existing MSFT risk before a Fed speech. First reactions can reverse, so actively rebalance exposure instead of freezing on the initial move.',
    NULL,
    'auto',
    true,
    120,
    10,
    2,
    41000,
    0.14,
    'all_of'
),
(
    'module-4.4',
    'tutorial',
    'Government Shutdown Uncertainty',
    4,
    4,
    'You already hold JPM as shutdown headlines whipsaw sentiment. Preserve capital through proactive de-risking and selective re-entry under uncertainty.',
    NULL,
    'auto',
    true,
    124,
    10,
    2,
    46000,
    0.14,
    'all_of'
),
(
    'module-4.5',
    'tutorial',
    'Catastrophic Shock Response',
    4,
    5,
    'You begin with XOM exposure into a catastrophic macro shock sequence. Survival requires active risk reduction, controlled repositioning, and discipline under ambiguity.',
    NULL,
    'auto',
    true,
    128,
    10,
    2,
    44000,
    0.15,
    'all_of'
)
ON CONFLICT DO NOTHING;

INSERT INTO levels (
    level_id,
    level_type,
    title,
    module,
    level_order,
    context,
    level_tutorial_id,
    tick_mode,
    manual_start,
    total_ticks,
    preloaded_ticks,
    auto_tick_interval_seconds,
    starting_cash,
    final_cash_points_multiplier,
    passing_criteria_type
) VALUES
(
    'module-5.1',
    'tutorial',
    'Diversification Beyond Position Count',
    5,
    1,
    'You start with an all-technology basket. Diversify across non-tech sectors before the midpoint technology shock reprices crowded positioning.',
    NULL,
    'auto',
    true,
    132,
    10,
    2,
    120000,
    0.16,
    'all_of'
),
(
    'module-5.2',
    'tutorial',
    'Fundamentals for Portfolio Quality',
    5,
    2,
    'Portfolio construction improves when valuation, profitability, and leverage are compared together instead of chasing one ratio in isolation.',
    NULL,
    'auto',
    true,
    136,
    10,
    2,
    120000,
    0.16,
    'all_of'
),
(
    'module-5.3',
    'tutorial',
    'Correlation and Hidden Crowding',
    5,
    3,
    'Several positions can still behave like one trade. Track correlation to avoid theme crowding and preserve downside control when the narrative breaks.',
    NULL,
    'auto',
    true,
    140,
    10,
    2,
    120000,
    0.17,
    'all_of'
),
(
    'module-5.4',
    'tutorial',
    'Beta and Volatility Budgeting',
    5,
    4,
    'Portfolio risk depends on market sensitivity and realized swings. Keep beta and volatility inside budget while still competing for return.',
    NULL,
    'auto',
    true,
    144,
    10,
    2,
    120000,
    0.17,
    'all_of'
),
(
    'module-5.5',
    'tutorial',
    'Sector Rotation and Timely Rebalancing',
    5,
    5,
    'When leadership rotates, passive exposure can lag quickly. Rebalance within a catalyst window and compare outcomes against passive references.',
    NULL,
    'auto',
    true,
    148,
    10,
    2,
    120000,
    0.18,
    'all_of'
),
(
    'module-5.6',
    'tutorial',
    'Rebalancing Drift Discipline',
    5,
    6,
    'Winners drift into oversized weights. Restore risk balance before reversals and avoid letting one position silently define the whole portfolio.',
    NULL,
    'auto',
    true,
    152,
    10,
    2,
    36000,
    0.18,
    'all_of'
),
(
    'module-5.7',
    'tutorial',
    'Alpha Versus Benchmark',
    5,
    7,
    'The final test is benchmark-relative outperformance under risk constraints. Deliver excess return without concentration blowups or unstable drawdowns.',
    NULL,
    'auto',
    true,
    156,
    10,
    2,
    120000,
    0.2,
    'all_of'
)
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate per-level ticker configuration
-- ======================================
INSERT INTO level_tickers (
    level_id,
    ticker,
    display_order,
    simulator_type,
    history_start_date,
    history_end_date,
    history_interval
) VALUES
('module-1.1', 'AAPL', 1, 'yfinance', '2025-03-03', '2025-03-14', '1d'),
('module-1.2', 'AAPL', 1, 'yfinance', '2025-04-01', '2025-04-18', '1d'),
('module-1.3', 'AAPL', 1, 'yfinance', '2025-01-02', '2025-01-10', '1d'),
('module-1.4', 'AAPL', 1, 'yfinance', '2025-09-29', '2025-10-10', '1d'),
('module-2.1', 'MSFT', 1, 'yfinance', '2025-05-05', '2025-05-30', '1d'),
('module-2.2', 'NVDA', 1, 'yfinance', '2025-08-04', '2025-08-29', '1d'),
('module-2.3', 'TSLA', 1, 'yfinance', '2025-10-01', '2025-10-28', '1d'),
('module-2.4', 'AAPL', 1, 'yfinance', '2025-01-02', '2025-03-14', '1d'),
('module-2.5', 'PLTR', 1, 'yfinance', '2025-09-02', '2025-10-31', '1d')
ON CONFLICT DO NOTHING;

INSERT INTO level_tickers (
    level_id,
    ticker,
    display_order,
    simulator_type,
    initial_fair_price,
    base_volume,
    volatility,
    has_npc_orders,
    rng_seed
) VALUES
('module-3.1', 'AAPL', 1, 'orderbook', 186.0, 12, 11, true, 3101),
('module-3.2', 'AAPL', 1, 'orderbook', 191.0, 12, 12, true, 3102),
('module-3.3', 'NVDA', 1, 'orderbook', 862.0, 9, 14, true, 3103),
('module-3.4', 'TSLA', 1, 'orderbook', 247.0, 11, 13, true, 3104),
('module-3.5', 'TSLA', 1, 'orderbook', 241.0, 11, 14, true, 3105),
('module-3.6', 'NVDA', 1, 'orderbook', 834.0, 10, 17, true, 3106),
('puzzle-1.1', 'TM', 1, 'orderbook', 100.0, 10, 10, true, 2101),
('puzzle-1.2', 'CCL', 1, 'orderbook', 40.0, 10, 10, true, 2102)
ON CONFLICT DO NOTHING;

INSERT INTO level_tickers (
    level_id,
    ticker,
    display_order,
    simulator_type,
    initial_fair_price,
    base_volume,
    volatility,
    has_npc_orders,
    rng_seed,
    starting_position_qty,
    starting_position_cost_basis
) VALUES
('module-4.1', 'AAPL', 1, 'orderbook', 198.0, 14, 10, true, 4101, 220, 198.0),
('module-4.2', 'NVDA', 1, 'orderbook', 878.0, 12, 12, true, 4102, 70, 878.0),
('module-4.3', 'MSFT', 1, 'orderbook', 421.0, 10, 15, true, 4103, 150, 421.0),
('module-4.4', 'JPM', 1, 'orderbook', 206.0, 9, 16, true, 4104, 260, 206.0),
('module-4.5', 'XOM', 1, 'orderbook', 122.0, 7, 22, true, 4105, 420, 122.0)
ON CONFLICT DO NOTHING;

INSERT INTO level_tickers (
    level_id,
    ticker,
    display_order,
    simulator_type,
    initial_fair_price,
    base_volume,
    volatility,
    has_npc_orders,
    rng_seed
) VALUES
('module-5.2', 'MSFT', 1, 'orderbook', 428.0, 11, 10, true, 5201),
('module-5.2', 'NVDA', 2, 'orderbook', 905.0, 12, 16, true, 5202),
('module-5.2', 'PG', 3, 'orderbook', 161.0, 9, 8, true, 5203),
('module-5.2', 'PFE', 4, 'orderbook', 31.0, 8, 9, true, 5204),
('module-5.2', 'F', 5, 'orderbook', 13.0, 11, 13, true, 5205),

('module-5.3', 'NVDA', 1, 'orderbook', 912.0, 12, 18, true, 5301),
('module-5.3', 'AMD', 2, 'orderbook', 196.0, 11, 17, true, 5302),
('module-5.3', 'QCOM', 3, 'orderbook', 169.0, 10, 14, true, 5303),
('module-5.3', 'UNH', 4, 'orderbook', 508.0, 8, 9, true, 5304),
('module-5.3', 'NEE', 5, 'orderbook', 74.0, 8, 10, true, 5305),

('module-5.4', 'TSLA', 1, 'orderbook', 252.0, 13, 19, true, 5401),
('module-5.4', 'NVDA', 2, 'orderbook', 918.0, 12, 17, true, 5402),
('module-5.4', 'AAPL', 3, 'orderbook', 209.0, 11, 11, true, 5403),
('module-5.4', 'KO', 4, 'orderbook', 63.0, 8, 7, true, 5404),
('module-5.4', 'JNJ', 5, 'orderbook', 160.0, 8, 8, true, 5405),

('module-5.5', 'XOM', 1, 'orderbook', 119.0, 11, 11, true, 5501),
('module-5.5', 'CVX', 2, 'orderbook', 165.0, 10, 10, true, 5502),
('module-5.5', 'CAT', 3, 'orderbook', 338.0, 10, 12, true, 5503),
('module-5.5', 'AAPL', 4, 'orderbook', 211.0, 11, 11, true, 5504),
('module-5.5', 'NEE', 5, 'orderbook', 75.0, 8, 10, true, 5505),

('module-5.7', 'AAPL', 1, 'orderbook', 213.0, 11, 12, true, 5701),
('module-5.7', 'MSFT', 2, 'orderbook', 434.0, 10, 10, true, 5702),
('module-5.7', 'NVDA', 3, 'orderbook', 926.0, 12, 18, true, 5703),
('module-5.7', 'JPM', 4, 'orderbook', 207.0, 9, 11, true, 5704),
('module-5.7', 'JNJ', 5, 'orderbook', 161.0, 8, 8, true, 5705),
('module-5.7', 'XOM', 6, 'orderbook', 121.0, 10, 10, true, 5706)
ON CONFLICT DO NOTHING;

INSERT INTO level_tickers (
    level_id,
    ticker,
    display_order,
    simulator_type,
    initial_fair_price,
    base_volume,
    volatility,
    has_npc_orders,
    rng_seed,
    starting_position_qty,
    starting_position_cost_basis
) VALUES
('module-5.1', 'AAPL', 1, 'orderbook', 205.0, 12, 11, true, 5101, 120, 205.0),
('module-5.1', 'MSFT', 2, 'orderbook', 428.0, 10, 10, true, 5102, 60, 428.0),
('module-5.1', 'NVDA', 3, 'orderbook', 905.0, 12, 16, true, 5103, 35, 905.0),
('module-5.1', 'JPM', 4, 'orderbook', 202.0, 10, 10, true, 5104, 0, NULL),
('module-5.1', 'XOM', 5, 'orderbook', 118.0, 10, 9, true, 5105, 0, NULL),

('module-5.6', 'AAPL', 1, 'orderbook', 214.0, 12, 12, true, 5601, 260, 198.0),
('module-5.6', 'MSFT', 2, 'orderbook', 432.0, 10, 10, true, 5602, 70, 421.0),
('module-5.6', 'KO', 3, 'orderbook', 63.0, 8, 7, true, 5603, 120, 61.0),
('module-5.6', 'JNJ', 4, 'orderbook', 159.0, 8, 8, true, 5604, 90, 155.0),
('module-5.6', 'XOM', 5, 'orderbook', 120.0, 10, 10, true, 5605, 140, 112.0)
ON CONFLICT DO NOTHING;

INSERT INTO level_ticker_metadata (
    level_ticker_id,
    company_name,
    company_description,
    sector_key,
    pe_ratio,
    roe_pct,
    debt_to_equity,
    beta,
    volatility_hint,
    ticker_tags
)
SELECT
    lt.level_ticker_id,
    seed.company_name,
    seed.company_name,
    seed.sector_key,
    seed.pe_ratio,
    seed.roe_pct,
    seed.debt_to_equity,
    seed.beta,
    seed.volatility_hint,
    seed.ticker_tags
FROM (
    VALUES
    ('module-5.1', 'AAPL', 'Apple Inc.', 'technology', 30.2000, 48.1000, 1.7800, 1.180000, 0.018000, '["core","quality"]'::jsonb),
    ('module-5.1', 'MSFT', 'Microsoft Corporation', 'technology', 34.5000, 38.8000, 0.3900, 0.980000, 0.014000, '["quality","cashflow"]'::jsonb),
    ('module-5.1', 'NVDA', 'NVIDIA Corporation', 'technology', 49.9000, 55.9000, 0.3200, 1.720000, 0.027000, '["growth","high_beta"]'::jsonb),
    ('module-5.1', 'JPM', 'JPMorgan Chase & Co.', 'financials', 11.9000, 17.2000, 1.4700, 1.100000, 0.016000, '["core","value"]'::jsonb),
    ('module-5.1', 'XOM', 'Exxon Mobil Corporation', 'energy', 13.4000, 25.6000, 0.2100, 1.040000, 0.015000, '["cyclical","cashflow"]'::jsonb),

    ('module-5.2', 'MSFT', 'Microsoft Corporation', 'technology', 34.6000, 38.8000, 0.3900, 0.980000, 0.014000, '["quality","cashflow"]'::jsonb),
    ('module-5.2', 'NVDA', 'NVIDIA Corporation', 'technology', 49.8000, 55.9000, 0.3200, 1.720000, 0.027000, '["growth","high_beta"]'::jsonb),
    ('module-5.2', 'PG', 'The Procter & Gamble Company', 'consumer_defensive', 26.2000, 29.5000, 0.5600, 0.540000, 0.009000, '["defensive","quality"]'::jsonb),
    ('module-5.2', 'PFE', 'Pfizer Inc.', 'healthcare', 12.4000, 18.1000, 0.6900, 0.670000, 0.011000, '["defensive","value"]'::jsonb),
    ('module-5.2', 'F', 'Ford Motor Company', 'consumer_cyclical', 8.3000, 12.6000, 2.4100, 1.310000, 0.022000, '["cyclical","weak_balance_sheet"]'::jsonb),

    ('module-5.3', 'NVDA', 'NVIDIA Corporation', 'technology', 50.1000, 56.0000, 0.3200, 1.720000, 0.028000, '["growth","high_beta","ai_theme"]'::jsonb),
    ('module-5.3', 'AMD', 'Advanced Micro Devices, Inc.', 'technology', 44.2000, 16.7000, 0.0800, 1.660000, 0.026000, '["growth","high_beta","ai_theme"]'::jsonb),
    ('module-5.3', 'QCOM', 'QUALCOMM Incorporated', 'technology', 21.4000, 43.9000, 0.7000, 1.210000, 0.020000, '["technology","ai_theme"]'::jsonb),
    ('module-5.3', 'UNH', 'UnitedHealth Group Incorporated', 'healthcare', 20.8000, 24.3000, 0.6900, 0.710000, 0.011000, '["defensive","quality"]'::jsonb),
    ('module-5.3', 'NEE', 'NextEra Energy, Inc.', 'utilities', 18.6000, 11.9000, 1.1800, 0.720000, 0.012000, '["defensive","rate_sensitive"]'::jsonb),

    ('module-5.4', 'TSLA', 'Tesla, Inc.', 'consumer_cyclical', 61.5000, 18.9000, 0.1700, 2.080000, 0.032000, '["high_beta","high_volatility"]'::jsonb),
    ('module-5.4', 'NVDA', 'NVIDIA Corporation', 'technology', 50.4000, 56.0000, 0.3200, 1.720000, 0.029000, '["high_beta","growth"]'::jsonb),
    ('module-5.4', 'AAPL', 'Apple Inc.', 'technology', 30.4000, 48.1000, 1.7800, 1.180000, 0.018000, '["core","quality"]'::jsonb),
    ('module-5.4', 'KO', 'The Coca-Cola Company', 'consumer_defensive', 24.3000, 43.7000, 1.5100, 0.580000, 0.009000, '["defensive","stable"]'::jsonb),
    ('module-5.4', 'JNJ', 'Johnson & Johnson', 'healthcare', 17.0000, 28.4000, 0.4700, 0.630000, 0.010000, '["defensive","stable"]'::jsonb),

    ('module-5.5', 'XOM', 'Exxon Mobil Corporation', 'energy', 13.6000, 25.6000, 0.2100, 1.040000, 0.016000, '["cyclical","energy"]'::jsonb),
    ('module-5.5', 'CVX', 'Chevron Corporation', 'energy', 14.2000, 19.5000, 0.2300, 1.020000, 0.015000, '["cyclical","energy"]'::jsonb),
    ('module-5.5', 'CAT', 'Caterpillar Inc.', 'industrials', 17.9000, 43.4000, 1.8500, 1.260000, 0.019000, '["cyclical","rotation"]'::jsonb),
    ('module-5.5', 'AAPL', 'Apple Inc.', 'technology', 30.5000, 48.1000, 1.7800, 1.180000, 0.018000, '["core","growth"]'::jsonb),
    ('module-5.5', 'NEE', 'NextEra Energy, Inc.', 'utilities', 18.7000, 11.9000, 1.1800, 0.720000, 0.012000, '["defensive","rate_sensitive"]'::jsonb),

    ('module-5.6', 'AAPL', 'Apple Inc.', 'technology', 30.6000, 48.1000, 1.7800, 1.180000, 0.019000, '["core","drift_risk"]'::jsonb),
    ('module-5.6', 'MSFT', 'Microsoft Corporation', 'technology', 34.7000, 38.8000, 0.3900, 0.980000, 0.014000, '["quality","core"]'::jsonb),
    ('module-5.6', 'KO', 'The Coca-Cola Company', 'consumer_defensive', 24.4000, 43.7000, 1.5100, 0.580000, 0.009000, '["defensive","stable"]'::jsonb),
    ('module-5.6', 'JNJ', 'Johnson & Johnson', 'healthcare', 17.1000, 28.4000, 0.4700, 0.630000, 0.010000, '["defensive","quality"]'::jsonb),
    ('module-5.6', 'XOM', 'Exxon Mobil Corporation', 'energy', 13.7000, 25.6000, 0.2100, 1.040000, 0.016000, '["cyclical","value"]'::jsonb),

    ('module-5.7', 'AAPL', 'Apple Inc.', 'technology', 30.7000, 48.1000, 1.7800, 1.180000, 0.019000, '["core","quality"]'::jsonb),
    ('module-5.7', 'MSFT', 'Microsoft Corporation', 'technology', 34.8000, 38.8000, 0.3900, 0.980000, 0.015000, '["core","quality"]'::jsonb),
    ('module-5.7', 'NVDA', 'NVIDIA Corporation', 'technology', 50.6000, 56.0000, 0.3200, 1.720000, 0.030000, '["growth","high_beta"]'::jsonb),
    ('module-5.7', 'JPM', 'JPMorgan Chase & Co.', 'financials', 12.1000, 17.2000, 1.4700, 1.100000, 0.016000, '["core","value"]'::jsonb),
    ('module-5.7', 'JNJ', 'Johnson & Johnson', 'healthcare', 17.2000, 28.4000, 0.4700, 0.630000, 0.010000, '["defensive","stable"]'::jsonb),
    ('module-5.7', 'XOM', 'Exxon Mobil Corporation', 'energy', 13.9000, 25.6000, 0.2100, 1.040000, 0.016000, '["cyclical","cashflow"]'::jsonb)
) AS seed(
    level_id,
    ticker,
    company_name,
    sector_key,
    pe_ratio,
    roe_pct,
    debt_to_equity,
    beta,
    volatility_hint,
    ticker_tags
)
JOIN level_tickers lt
    ON lt.level_id = seed.level_id
   AND lt.ticker = seed.ticker
ON CONFLICT (level_ticker_id) DO NOTHING;

-- Backfill company + sector metadata for earlier modules/puzzles so execution deck
-- can always display issuer context from Module 1 onward. Keep valuation fields NULL
-- outside fundamentals-introduced levels.
INSERT INTO level_ticker_metadata (
    level_ticker_id,
    company_name,
    company_description,
    sector_key,
    pe_ratio,
    roe_pct,
    debt_to_equity,
    beta,
    volatility_hint,
    ticker_tags
)
SELECT
    lt.level_ticker_id,
    seed.company_name,
    seed.company_description,
    seed.sector_key,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '[]'::jsonb
FROM level_tickers lt
JOIN (
    VALUES
    ('AAPL', 'Apple Inc.', 'Consumer hardware and services platform with recurring ecosystem revenue and premium margins.', 'technology'),
    ('MSFT', 'Microsoft Corporation', 'Enterprise software and cloud platform leader with diversified recurring cash-flow streams.', 'technology'),
    ('NVDA', 'NVIDIA Corporation', 'High-growth semiconductor and AI infrastructure company with elevated valuation sensitivity.', 'technology'),
    ('TSLA', 'Tesla, Inc.', 'EV and energy company with high growth potential and historically high price volatility.', 'consumer_cyclical'),
    ('PLTR', 'Palantir Technologies Inc.', 'Data analytics and defense software firm with contract-driven growth and execution risk.', 'technology'),
    ('TM', 'Toyota Motor Corporation', 'Global auto manufacturer with scale advantages and cyclical demand exposure.', 'consumer_cyclical'),
    ('CCL', 'Carnival Corporation & plc', 'Cruise operator highly sensitive to consumer spending, fuel costs, and travel demand.', 'consumer_cyclical'),
    ('JPM', 'JPMorgan Chase & Co.', 'Diversified global bank with broad credit, capital-markets, and consumer exposure.', 'financials'),
    ('XOM', 'Exxon Mobil Corporation', 'Integrated energy major with earnings tied to commodity cycles and refining margins.', 'energy'),
    ('JNJ', 'Johnson & Johnson', 'Defensive healthcare conglomerate with diversified pharmaceuticals, med-tech, and consumer products.', 'healthcare'),
    ('KO', 'The Coca-Cola Company', 'Global beverage franchise with resilient demand and relatively stable cash generation.', 'consumer_defensive'),
    ('PG', 'The Procter & Gamble Company', 'Consumer staples leader with defensive demand profile and strong brand pricing power.', 'consumer_defensive'),
    ('PFE', 'Pfizer Inc.', 'Large-cap pharmaceutical company driven by drug pipeline execution and patent cycles.', 'healthcare'),
    ('F', 'Ford Motor Company', 'Auto manufacturer with cyclical earnings and balance-sheet leverage sensitivity.', 'consumer_cyclical'),
    ('AMD', 'Advanced Micro Devices, Inc.', 'Semiconductor designer with PC and data-center exposure, often trading at growth multiples.', 'technology'),
    ('QCOM', 'QUALCOMM Incorporated', 'Wireless chipset and licensing business with smartphone-cycle and regulatory sensitivity.', 'technology'),
    ('UNH', 'UnitedHealth Group Incorporated', 'Managed-care leader with scale, recurring healthcare demand, and policy sensitivity.', 'healthcare'),
    ('NEE', 'NextEra Energy, Inc.', 'Regulated utility and renewables operator with rate and capital-cost sensitivity.', 'utilities'),
    ('CVX', 'Chevron Corporation', 'Integrated energy producer exposed to oil and gas price swings across cycles.', 'energy'),
    ('CAT', 'Caterpillar Inc.', 'Industrial machinery producer tied to global capex, construction, and commodity demand.', 'industrials')
) AS seed(ticker, company_name, company_description, sector_key)
    ON seed.ticker = lt.ticker
LEFT JOIN level_ticker_metadata existing
    ON existing.level_ticker_id = lt.level_ticker_id
WHERE existing.level_ticker_id IS NULL
ON CONFLICT (level_ticker_id) DO NOTHING;

INSERT INTO level_reference_portfolios (
    level_id,
    reference_key,
    reference_role,
    title,
    description,
    display_order
)
VALUES
('module-5.2', 'core_equal_weight', 'benchmark', 'Core Equal Weight Benchmark', 'Equal-weight basket for fundamentals-aware active management.', 1),
('module-5.2', 'defensive_quality', 'reference', 'Defensive Quality Basket', 'Lower-beta quality profile used as a conservative reference.', 2),
('module-5.3', 'balanced_benchmark', 'benchmark', 'Balanced Benchmark', 'Equal-weight diversified baseline for correlation decisions.', 1),
('module-5.3', 'ai_cluster', 'reference', 'AI Cluster Basket', 'Crowded technology cluster used as a concentration reference.', 2),
('module-5.4', 'risk_budget_benchmark', 'benchmark', 'Risk Budget Benchmark', 'Balanced basket for beta and volatility control comparisons.', 1),
('module-5.4', 'high_beta_basket', 'reference', 'High Beta Basket', 'Aggressive basket illustrating unmanaged sensitivity risk.', 2),
('module-5.5', 'passive_hold', 'benchmark', 'Passive Hold Benchmark', 'Passive hold allocation through the entire rotation period.', 1),
('module-5.5', 'pre_rotation_energy_tilt', 'reference', 'Energy Tilt Reference', 'Reference basket that stays overweight pre-rotation winners.', 2),
('module-5.6', 'balanced_core', 'benchmark', 'Balanced Core Benchmark', 'Even-risk allocation used to compare drift correction discipline.', 1),
('module-5.6', 'drifted_start', 'reference', 'Drifted Start Reference', 'Reference portfolio mirroring pre-seeded winner drift.', 2),
('module-5.7', 'balanced_core', 'benchmark', 'Balanced Core Benchmark', 'Diversified benchmark for final alpha measurement.', 1),
('module-5.7', 'concentrated_growth', 'reference', 'Concentrated Growth Reference', 'High-growth concentration reference with elevated tail risk.', 2)
ON CONFLICT DO NOTHING;

INSERT INTO level_reference_portfolio_components (
    reference_portfolio_id,
    level_ticker_id,
    weight,
    display_order
)
SELECT
    lrp.reference_portfolio_id,
    lt.level_ticker_id,
    comp.weight,
    comp.display_order
FROM (
    VALUES
    ('module-5.2', 'core_equal_weight', 'MSFT', 0.200000::numeric, 1),
    ('module-5.2', 'core_equal_weight', 'NVDA', 0.200000::numeric, 2),
    ('module-5.2', 'core_equal_weight', 'PG', 0.200000::numeric, 3),
    ('module-5.2', 'core_equal_weight', 'PFE', 0.200000::numeric, 4),
    ('module-5.2', 'core_equal_weight', 'F', 0.200000::numeric, 5),
    ('module-5.2', 'defensive_quality', 'PG', 0.350000::numeric, 1),
    ('module-5.2', 'defensive_quality', 'PFE', 0.250000::numeric, 2),
    ('module-5.2', 'defensive_quality', 'MSFT', 0.200000::numeric, 3),
    ('module-5.2', 'defensive_quality', 'NVDA', 0.100000::numeric, 4),
    ('module-5.2', 'defensive_quality', 'F', 0.100000::numeric, 5),

    ('module-5.3', 'balanced_benchmark', 'NVDA', 0.200000::numeric, 1),
    ('module-5.3', 'balanced_benchmark', 'AMD', 0.200000::numeric, 2),
    ('module-5.3', 'balanced_benchmark', 'QCOM', 0.200000::numeric, 3),
    ('module-5.3', 'balanced_benchmark', 'UNH', 0.200000::numeric, 4),
    ('module-5.3', 'balanced_benchmark', 'NEE', 0.200000::numeric, 5),
    ('module-5.3', 'ai_cluster', 'NVDA', 0.400000::numeric, 1),
    ('module-5.3', 'ai_cluster', 'AMD', 0.300000::numeric, 2),
    ('module-5.3', 'ai_cluster', 'QCOM', 0.200000::numeric, 3),
    ('module-5.3', 'ai_cluster', 'UNH', 0.050000::numeric, 4),
    ('module-5.3', 'ai_cluster', 'NEE', 0.050000::numeric, 5),

    ('module-5.4', 'risk_budget_benchmark', 'TSLA', 0.200000::numeric, 1),
    ('module-5.4', 'risk_budget_benchmark', 'NVDA', 0.200000::numeric, 2),
    ('module-5.4', 'risk_budget_benchmark', 'AAPL', 0.200000::numeric, 3),
    ('module-5.4', 'risk_budget_benchmark', 'KO', 0.200000::numeric, 4),
    ('module-5.4', 'risk_budget_benchmark', 'JNJ', 0.200000::numeric, 5),
    ('module-5.4', 'high_beta_basket', 'TSLA', 0.450000::numeric, 1),
    ('module-5.4', 'high_beta_basket', 'NVDA', 0.350000::numeric, 2),
    ('module-5.4', 'high_beta_basket', 'AAPL', 0.150000::numeric, 3),
    ('module-5.4', 'high_beta_basket', 'KO', 0.025000::numeric, 4),
    ('module-5.4', 'high_beta_basket', 'JNJ', 0.025000::numeric, 5),

    ('module-5.5', 'passive_hold', 'XOM', 0.200000::numeric, 1),
    ('module-5.5', 'passive_hold', 'CVX', 0.200000::numeric, 2),
    ('module-5.5', 'passive_hold', 'CAT', 0.200000::numeric, 3),
    ('module-5.5', 'passive_hold', 'AAPL', 0.200000::numeric, 4),
    ('module-5.5', 'passive_hold', 'NEE', 0.200000::numeric, 5),
    ('module-5.5', 'pre_rotation_energy_tilt', 'XOM', 0.350000::numeric, 1),
    ('module-5.5', 'pre_rotation_energy_tilt', 'CVX', 0.300000::numeric, 2),
    ('module-5.5', 'pre_rotation_energy_tilt', 'CAT', 0.150000::numeric, 3),
    ('module-5.5', 'pre_rotation_energy_tilt', 'AAPL', 0.100000::numeric, 4),
    ('module-5.5', 'pre_rotation_energy_tilt', 'NEE', 0.100000::numeric, 5),

    ('module-5.6', 'balanced_core', 'AAPL', 0.200000::numeric, 1),
    ('module-5.6', 'balanced_core', 'MSFT', 0.200000::numeric, 2),
    ('module-5.6', 'balanced_core', 'KO', 0.200000::numeric, 3),
    ('module-5.6', 'balanced_core', 'JNJ', 0.200000::numeric, 4),
    ('module-5.6', 'balanced_core', 'XOM', 0.200000::numeric, 5),
    ('module-5.6', 'drifted_start', 'AAPL', 0.520000::numeric, 1),
    ('module-5.6', 'drifted_start', 'MSFT', 0.170000::numeric, 2),
    ('module-5.6', 'drifted_start', 'KO', 0.100000::numeric, 3),
    ('module-5.6', 'drifted_start', 'JNJ', 0.110000::numeric, 4),
    ('module-5.6', 'drifted_start', 'XOM', 0.100000::numeric, 5),

    ('module-5.7', 'balanced_core', 'AAPL', 0.180000::numeric, 1),
    ('module-5.7', 'balanced_core', 'MSFT', 0.180000::numeric, 2),
    ('module-5.7', 'balanced_core', 'NVDA', 0.180000::numeric, 3),
    ('module-5.7', 'balanced_core', 'JPM', 0.160000::numeric, 4),
    ('module-5.7', 'balanced_core', 'JNJ', 0.150000::numeric, 5),
    ('module-5.7', 'balanced_core', 'XOM', 0.150000::numeric, 6),
    ('module-5.7', 'concentrated_growth', 'NVDA', 0.450000::numeric, 1),
    ('module-5.7', 'concentrated_growth', 'AAPL', 0.250000::numeric, 2),
    ('module-5.7', 'concentrated_growth', 'MSFT', 0.200000::numeric, 3),
    ('module-5.7', 'concentrated_growth', 'JPM', 0.040000::numeric, 4),
    ('module-5.7', 'concentrated_growth', 'JNJ', 0.030000::numeric, 5),
    ('module-5.7', 'concentrated_growth', 'XOM', 0.030000::numeric, 6)
) AS comp(level_id, reference_key, ticker, weight, display_order)
JOIN level_reference_portfolios lrp
    ON lrp.level_id = comp.level_id
   AND lrp.reference_key = comp.reference_key
JOIN level_tickers lt
    ON lt.level_id = comp.level_id
   AND lt.ticker = comp.ticker
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate tutorial missions
-- ======================================
INSERT INTO level_missions (
    level_id,
    mission_key,
    mission_group,
    mission_type,
    display_order,
    title,
    description,
    points,
    mission_params
)
SELECT
    level_id,
    mission_key,
    mission_group::mission_group_enum AS mission_group,
    mission_type::mission_type_enum AS mission_type,
    display_order,
    title,
    description,
    points,
    jsonb_strip_nulls(
        jsonb_build_object(
            'order_type', order_type,
            'order_direction', order_direction,
            'min_count', min_count,
            'max_count', max_count,
            'min_pnl', min_pnl,
            'max_pnl', max_pnl
        )
    ) AS mission_params
FROM (
VALUES
(
    'module-1.3',
    'market_buy_once',
    'passing',
    'use_order_type',
    1,
    'Place one market buy',
    'Submit at least one market buy order.',
    100,
    'market',
    'buy',
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-1.3',
    'market_sell_once',
    'passing',
    'use_order_type',
    2,
    'Place one market sell',
    'Submit at least one market sell order.',
    100,
    'market',
    'sell',
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-1.4',
    'profit_500',
    'passing',
    'pnl_at_end',
    1,
    'Make at least $500',
    'Finish the level with PnL of at least $500.',
    100,
    NULL,
    NULL,
    NULL,
    NULL,
    500,
    NULL
),
(
    'module-1.4',
    'profit_1000',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $1000',
    'Stretch goal: finish with PnL of at least $1000.',
    50,
    NULL,
    NULL,
    NULL,
    NULL,
    1000,
    NULL
),
(
    'module-2.1',
    'react_to_news_once',
    'passing',
    'use_order_type',
    1,
    'Trade at least once on news',
    'Place at least one market order while tracking company-specific headlines.',
    100,
    'market',
    NULL,
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-2.1',
    'pnl_non_negative',
    'passing',
    'pnl_at_end',
    2,
    'Finish with non-negative PnL',
    'End the level with at least $0 PnL.',
    100,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NULL
),
(
    'module-2.1',
    'profit_300',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $300',
    'Stretch goal: finish with PnL of at least $300.',
    50,
    NULL,
    NULL,
    NULL,
    NULL,
    300,
    NULL
),
(
    'module-2.2',
    'market_buy_once',
    'passing',
    'use_order_type',
    1,
    'Place one market buy',
    'Take one market buy to express a bullish earnings view.',
    100,
    'market',
    'buy',
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-2.2',
    'pnl_non_negative',
    'passing',
    'pnl_at_end',
    2,
    'Finish with non-negative PnL',
    'Manage timing around earnings and close with at least $0 PnL.',
    100,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NULL
),
(
    'module-2.2',
    'profit_600',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $600',
    'Capture the positive earnings sentiment to finish with at least $600 PnL.',
    75,
    NULL,
    NULL,
    NULL,
    NULL,
    600,
    NULL
),
(
    'module-2.3',
    'market_order_once',
    'passing',
    'use_order_type',
    1,
    'Place one market order',
    'Place at least one market order while handling a negative earnings surprise.',
    80,
    'market',
    NULL,
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-2.3',
    'limit_loss_200',
    'passing',
    'pnl_at_end',
    2,
    'Limit loss to $200',
    'Finish with PnL of at least -$200.',
    120,
    NULL,
    NULL,
    NULL,
    NULL,
    -200,
    NULL
),
(
    'module-2.3',
    'finish_positive',
    'bonus',
    'pnl_at_end',
    1,
    'Finish with positive PnL',
    'Bonus challenge: still close above $0 after the earnings miss.',
    75,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NULL
),
(
    'module-2.4',
    'ma_trade_once',
    'passing',
    'use_order_type',
    1,
    'Place one market order',
    'Use at least one market order after observing price vs moving average.',
    80,
    'market',
    NULL,
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-2.4',
    'pnl_non_negative',
    'passing',
    'pnl_at_end',
    2,
    'Finish with non-negative PnL',
    'Use MA context to avoid losing money by level end.',
    120,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NULL
),
(
    'module-2.4',
    'profit_800',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $800',
    'Bonus challenge: capture enough of the trend to earn $800 PnL.',
    100,
    NULL,
    NULL,
    NULL,
    NULL,
    800,
    NULL
),
(
    'module-2.5',
    'ema_trade_once',
    'passing',
    'use_order_type',
    1,
    'Place one market order',
    'Take at least one trade while using EMA to track momentum.',
    80,
    'market',
    NULL,
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-2.5',
    'pnl_non_negative',
    'passing',
    'pnl_at_end',
    2,
    'Finish with non-negative PnL',
    'Use EMA reactivity to protect downside and finish at or above $0 PnL.',
    120,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NULL
),
(
    'module-2.5',
    'profit_1200',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $1200',
    'Bonus challenge: execute the momentum swing for at least $1200 PnL.',
    120,
    NULL,
    NULL,
    NULL,
    NULL,
    1200,
    NULL
),
(
    'module-3.1',
    'market_order_once',
    'passing',
    'use_order_type',
    1,
    'Place one market order',
    'Take at least one market order while observing bid/ask spread dynamics.',
    80,
    'market',
    NULL,
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-3.1',
    'pnl_non_negative',
    'passing',
    'pnl_at_end',
    2,
    'Finish with non-negative PnL',
    'Navigate ticking movement and finish with at least $0 PnL.',
    120,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NULL
),
(
    'module-3.1',
    'profit_400',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $400',
    'Bonus challenge: capture enough movement to finish above $400 PnL.',
    60,
    NULL,
    NULL,
    NULL,
    NULL,
    400,
    NULL
),
(
    'module-3.2',
    'limit_buy_once',
    'passing',
    'use_order_type',
    1,
    'Place one limit buy',
    'Use a limit buy to queue for a better entry while the tape keeps moving.',
    100,
    'limit',
    'buy',
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-3.2',
    'limit_sell_once',
    'passing',
    'use_order_type',
    2,
    'Place one limit sell',
    'Use a limit sell to take profit without staring at every tick.',
    100,
    'limit',
    'sell',
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-3.2',
    'profit_600',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $600',
    'Bonus challenge: execute limit entries and exits for at least $600 PnL.',
    80,
    NULL,
    NULL,
    NULL,
    NULL,
    600,
    NULL
),
(
    'module-3.3',
    'stop_loss_once',
    'passing',
    'use_order_type',
    1,
    'Place one stop loss',
    'Submit at least one stop-loss order to automate downside protection.',
    100,
    'stop',
    NULL,
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-3.3',
    'limit_loss_400',
    'passing',
    'pnl_at_end',
    2,
    'Limit drawdown to $400',
    'Finish with PnL of at least -$400 while using stop protection.',
    100,
    NULL,
    NULL,
    NULL,
    NULL,
    -400,
    NULL
),
(
    'module-3.3',
    'finish_positive',
    'bonus',
    'pnl_at_end',
    1,
    'Finish with positive PnL',
    'Bonus challenge: stay protected and still end above $0 PnL.',
    80,
    NULL,
    NULL,
    NULL,
    NULL,
    0,
    NULL
),
(
    'module-3.4',
    'stop_limit_once',
    'passing',
    'use_order_type',
    1,
    'Place one stop limit order',
    'Submit at least one stop limit order and observe trigger then limit behavior.',
    100,
    'stop_limit',
    NULL,
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-3.4',
    'stop_order_once',
    'passing',
    'use_order_type',
    2,
    'Place one stop loss',
    'Use one stop-loss order to compare with stop-limit execution outcomes.',
    80,
    'stop',
    NULL,
    1,
    NULL,
    NULL,
    NULL
),
(
    'module-3.4',
    'profit_700',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $700',
    'Bonus challenge: combine stop and stop-limit logic for at least $700 PnL.',
    100,
    NULL,
    NULL,
    NULL,
    NULL,
    700,
    NULL
)
)
    AS mission_seed (
        level_id,
        mission_key,
        mission_group,
        mission_type,
        display_order,
        title,
        description,
        points,
        order_type,
        order_direction,
        min_count,
        max_count,
        min_pnl,
        max_pnl
    )
ON CONFLICT DO NOTHING;

DELETE FROM level_missions
WHERE level_id = 'module-3.5'
  AND mission_key IN ('short_drawdown_guard', 'finish_non_negative');

INSERT INTO level_missions (
    level_id,
    mission_key,
    mission_group,
    mission_type,
    display_order,
    title,
    description,
    points,
    mission_params
) VALUES
(
    'module-3.5',
    'open_short_once',
    'passing',
    'use_trade_action',
    1,
    'Open one short position',
    'Use Sell Short at least once to borrow shares and open a short.',
    100,
    '{"trade_action":"sell_short","min_count":1}'::jsonb
),
(
    'module-3.5',
    'cover_short_once',
    'passing',
    'use_trade_action',
    2,
    'Cover one short position',
    'Use Buy to Cover at least once to close borrowed shares.',
    100,
    '{"trade_action":"buy_to_cover","min_count":1}'::jsonb
),
(
    'module-3.5',
    'finish_profit_1000',
    'passing',
    'pnl_at_end',
    3,
    'Finish with at least $1000 PnL',
    'Use disciplined short entry and cover timing to finish with at least $1000 profit.',
    140,
    '{"min_pnl":1000}'::jsonb
),
(
    'module-3.5',
    'finish_profit_2000',
    'bonus',
    'pnl_at_end',
    3,
    'Finish with at least $2000 PnL',
    'Use disciplined short entry and cover timing to finish with at least $2000 profit.',
    140,
    '{"min_pnl":2000}'::jsonb
),
(
    'module-3.6',
    'confirm_short_entry',
    'passing',
    'use_trade_action',
    1,
    'Open one confirmed short',
    'Use Sell Short after trend confirmation to open a short position.',
    95,
    '{"trade_action":"sell_short","min_count":1}'::jsonb
),
(
    'module-3.6',
    'cover_after_bounce',
    'passing',
    'use_trade_action',
    2,
    'Cover one short position',
    'Use Buy to Cover to close risk after the squeeze and continuation phases.',
    95,
    '{"trade_action":"buy_to_cover","min_count":1}'::jsonb
),
(
    'module-3.6',
    'use_limit_for_timing',
    'passing',
    'use_order_type',
    3,
    'Place one limit order',
    'Use at least one limit order to improve short entry timing.',
    80,
    '{"order_type":"limit","min_count":1}'::jsonb
),
(
    'module-3.6',
    'control_drawdown_2p8',
    'passing',
    'max_drawdown_pct',
    4,
    'Keep max drawdown <= 2.8%',
    'Hold discipline during counter-trend bounce pressure.',
    90,
    '{"max_drawdown_pct":0.028}'::jsonb
),
(
    'module-3.6',
    'target_profit_900',
    'bonus',
    'pnl_at_end',
    1,
    'Make at least $900',
    'Bonus challenge: time short entries and exits for strong execution.',
    90,
    '{"min_pnl":900}'::jsonb
),
(
    'module-3.6',
    'max_seven_orders',
    'bonus',
    'max_total_orders',
    2,
    'Use at most 7 total orders',
    'Keep actions selective even when volatility rises.',
    70,
    '{"max_total_orders":7}'::jsonb
)
ON CONFLICT DO NOTHING;

INSERT INTO level_missions (
    level_id,
    mission_key,
    mission_group,
    mission_type,
    display_order,
    title,
    description,
    points,
    mission_params
)
SELECT
    level_id,
    mission_key,
    mission_group::mission_group_enum AS mission_group,
    mission_type::mission_type_enum AS mission_type,
    display_order,
    title,
    description,
    points,
    jsonb_strip_nulls(
        jsonb_build_object(
            'order_type', order_type,
            'order_direction', order_direction,
            'min_count', min_count,
            'max_count', max_count,
            'min_pnl', min_pnl,
            'max_pnl', max_pnl,
            'max_total_orders', max_total_orders,
            'max_drawdown_pct', max_drawdown_pct
        )
    ) AS mission_params
FROM (
VALUES
(
    'module-4.1',
    'profit_350',
    'passing',
    'pnl_at_end',
    1,
    'Finish with $350 profit',
    'You inherited AAPL exposure. Finish the level with at least $350 PnL.',
    125,
    NULL,
    NULL,
    NULL,
    NULL,
    350,
    NULL,
    NULL,
    NULL
),
(
    'module-4.1',
    'max_six_orders',
    'passing',
    'max_total_orders',
    2,
    'Use at most 6 orders',
    'Adjust risk deliberately as policy interpretation evolves instead of reacting to every tick.',
    75,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    6,
    NULL
),
(
    'module-4.1',
    'drawdown_below_2p4',
    'bonus',
    'max_drawdown_pct',
    1,
    'Keep max drawdown <= 2.4%',
    'Bonus challenge: defend capital while repositioning rate-sensitive exposure.',
    70,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.024000
),
(
    'module-4.2',
    'profit_450',
    'passing',
    'pnl_at_end',
    1,
    'Finish with $450 profit',
    'Inflation surprises can punish stale longs. Finish the level with at least $450 PnL.',
    120,
    NULL,
    NULL,
    NULL,
    NULL,
    450,
    NULL,
    NULL,
    NULL
),
(
    'module-4.2',
    'drawdown_below_2p6',
    'passing',
    'max_drawdown_pct',
    2,
    'Keep max drawdown <= 2.6%',
    'Control downside while inflation interpretation resets expectations.',
    90,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.026000
),
(
    'module-4.2',
    'max_seven_orders',
    'passing',
    'max_total_orders',
    3,
    'Use at most 7 orders',
    'Respond to repricing without panic overtrading.',
    70,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    7,
    NULL
),
(
    'module-4.2',
    'stop_sell_once',
    'bonus',
    'use_order_type',
    1,
    'Place one stop-loss sell',
    'Bonus challenge: automate one downside exit to protect inherited risk.',
    60,
    'stop',
    'sell',
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
),
(
    'module-4.3',
    'profit_300',
    'passing',
    'pnl_at_end',
    1,
    'Finish with $300 profit',
    'Fed communication can invalidate first reactions. Finish the level with at least $300 PnL.',
    110,
    NULL,
    NULL,
    NULL,
    NULL,
    300,
    NULL,
    NULL,
    NULL
),
(
    'module-4.3',
    'max_six_orders',
    'passing',
    'max_total_orders',
    2,
    'Use at most 6 orders',
    'Wait for confirmation between phases and avoid churn trading.',
    80,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    6,
    NULL
),
(
    'module-4.3',
    'drawdown_below_2p8',
    'passing',
    'max_drawdown_pct',
    3,
    'Keep max drawdown <= 2.8%',
    'When interpretation shifts intralevel, trim exposure quickly instead of defending a stale view.',
    90,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.028000
),
(
    'module-4.3',
    'stop_limit_sell_once',
    'bonus',
    'use_order_type',
    1,
    'Place one stop-limit sell',
    'Bonus challenge: manage whipsaw execution quality with a defensive stop-limit exit.',
    65,
    'stop_limit',
    'sell',
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
),
(
    'module-4.4',
    'profit_280',
    'passing',
    'pnl_at_end',
    1,
    'Finish with $280 profit',
    'Shutdown headlines can whipsaw banks. Finish the level with at least $280 PnL.',
    110,
    NULL,
    NULL,
    NULL,
    NULL,
    280,
    NULL,
    NULL,
    NULL
),
(
    'module-4.4',
    'max_five_orders',
    'passing',
    'max_total_orders',
    2,
    'Use at most 5 orders',
    'Headline swings are noisy. Keep entries selective and high conviction.',
    80,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    5,
    NULL
),
(
    'module-4.4',
    'drawdown_below_2p0',
    'passing',
    'max_drawdown_pct',
    3,
    'Keep max drawdown <= 2.0%',
    'Do not fight late-phase reversals; reduce exposure when the tape turns unstable.',
    95,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.020000
),
(
    'module-4.4',
    'limit_sell_once',
    'bonus',
    'use_order_type',
    1,
    'Place one limit sell',
    'Bonus challenge: use a planned limit exit while reducing shutdown-driven risk.',
    60,
    'limit',
    'sell',
    1,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL
),
(
    'module-4.5',
    'profit_500',
    'passing',
    'pnl_at_end',
    1,
    'Finish with $500 profit',
    'Shock-rebound-shock sequencing punishes passivity. Finish the level with at least $500 PnL.',
    130,
    NULL,
    NULL,
    NULL,
    NULL,
    500,
    NULL,
    NULL,
    NULL
),
(
    'module-4.5',
    'max_four_orders',
    'passing',
    'max_total_orders',
    2,
    'Use at most 4 orders',
    'In a shock-panic tape, fewer decisions often outperform frequent reactive trades.',
    85,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    4,
    NULL
),
(
    'module-4.5',
    'drawdown_below_1p8',
    'passing',
    'max_drawdown_pct',
    3,
    'Keep max drawdown <= 1.8%',
    'Survival first: cut risk quickly as second-order damage headlines appear.',
    100,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    0.018000
),
(
    'module-4.5',
    'pnl_above_minus250',
    'bonus',
    'pnl_at_end',
    1,
    'Finish above -$250 PnL',
    'Bonus challenge: preserve most of your capital while navigating panic and aftershock volatility.',
    70,
    NULL,
    NULL,
    NULL,
    NULL,
    -250,
    NULL,
    NULL,
    NULL
)
)
    AS mission_seed (
        level_id,
        mission_key,
        mission_group,
        mission_type,
        display_order,
        title,
        description,
        points,
        order_type,
        order_direction,
        min_count,
        max_count,
        min_pnl,
        max_pnl,
        max_total_orders,
        max_drawdown_pct
    )
ON CONFLICT DO NOTHING;

INSERT INTO level_missions (
    level_id,
    mission_key,
    mission_group,
    mission_type,
    display_order,
    title,
    description,
    points,
    mission_params
) VALUES
(
    'module-5.1',
    'build_four_positions',
    'passing',
    'min_distinct_positions',
    1,
    'Hold at least 4 positions',
    'Construct a real basket. Hold at least four tickers by the end of the level.',
    90,
    '{"min_positions":4}'::jsonb
),
(
    'module-5.1',
    'diversify_three_sectors',
    'passing',
    'min_distinct_sectors',
    2,
    'Cover at least 3 sectors',
    'Avoid same-theme crowding by spreading exposure across at least three sectors.',
    90,
    '{"min_sectors":3}'::jsonb
),
(
    'module-5.1',
    'cap_single_name_weight',
    'passing',
    'max_single_position_weight',
    3,
    'Keep largest position <= 45%',
    'Even with many holdings, one name can dominate risk. Keep your largest weight at or below 45%.',
    110,
    '{"max_weight":0.45}'::jsonb
),
(
    'module-5.1',
    'concentration_bonus_drawdown',
    'bonus',
    'max_drawdown_pct',
    1,
    'Keep max drawdown <= 3.0%',
    'Bonus challenge: manage diversification while keeping drawdown contained.',
    60,
    '{"max_drawdown_pct":0.03}'::jsonb
),

(
    'module-5.2',
    'beat_equal_weight_benchmark',
    'passing',
    'min_excess_return_vs_benchmark',
    1,
    'Beat equal-weight benchmark by 1.0%',
    'Use fundamentals to construct a higher-quality portfolio that outperforms the seeded benchmark by at least 1.0%.',
    110,
    '{"benchmark_key":"core_equal_weight","min_excess_return":0.01,"require_final":true}'::jsonb
),
(
    'module-5.2',
    'exclude_weak_balance_sheet',
    'passing',
    'exclude_ticker',
    2,
    'Avoid weak-balance-sheet name',
    'Stay out of Ford (F), which carries weaker balance-sheet characteristics for this scenario.',
    80,
    '{"ticker":"F"}'::jsonb
),
(
    'module-5.2',
    'include_defensive_name',
    'passing',
    'require_ticker_tag',
    3,
    'Include one defensive holding',
    'Hold at least one ticker tagged defensive to stabilize portfolio behavior.',
    90,
    '{"tag":"defensive","min_count":1}'::jsonb
),
(
    'module-5.2',
    'fundamental_bonus_concentration',
    'bonus',
    'max_single_position_weight',
    1,
    'Keep largest position <= 40%',
    'Bonus challenge: beat the benchmark without concentrating into one trade.',
    60,
    '{"max_weight":0.40}'::jsonb
),

(
    'module-5.3',
    'hold_low_correlation_asset',
    'passing',
    'require_low_correlation_holding',
    1,
    'Add one low-correlation holding',
    'Include at least one holding with average pairwise correlation at or below 0.45 over the rolling window.',
    100,
    '{"max_correlation":0.45,"lookback_ticks":20,"min_observations":15}'::jsonb
),
(
    'module-5.3',
    'maintain_three_positions',
    'passing',
    'min_distinct_positions',
    2,
    'Hold at least 3 positions',
    'Prevent hidden concentration by keeping at least three live positions.',
    80,
    '{"min_positions":3}'::jsonb
),
(
    'module-5.3',
    'limit_theme_break_drawdown',
    'passing',
    'max_drawdown_pct',
    3,
    'Keep max drawdown <= 2.8%',
    'When crowded themes unwind, preserve capital by controlling peak-to-trough loss.',
    100,
    '{"max_drawdown_pct":0.028}'::jsonb
),
(
    'module-5.3',
    'correlation_bonus_vs_cluster',
    'bonus',
    'min_excess_return_vs_reference',
    1,
    'Beat AI cluster reference by 1.0%',
    'Bonus challenge: outperform the crowded AI cluster reference by at least 1.0%.',
    70,
    '{"reference_key":"ai_cluster","min_excess_return":0.01,"require_final":true}'::jsonb
),

(
    'module-5.4',
    'keep_portfolio_beta_in_budget',
    'passing',
    'max_portfolio_beta',
    1,
    'Keep portfolio beta <= 1.10',
    'Balance high-beta names with stabilizers to keep weighted portfolio beta at or below 1.10.',
    100,
    '{"max_beta":1.10}'::jsonb
),
(
    'module-5.4',
    'keep_portfolio_volatility_in_budget',
    'passing',
    'max_portfolio_volatility',
    2,
    'Keep portfolio volatility <= 1.8%',
    'Use rolling volatility to manage swings. Stay at or below 1.8% over the configured lookback.',
    100,
    '{"max_volatility":0.018,"lookback_ticks":20,"min_observations":15}'::jsonb
),
(
    'module-5.4',
    'beta_vol_drawdown_control',
    'passing',
    'max_drawdown_pct',
    3,
    'Keep max drawdown <= 2.5%',
    'Risk budgeting should show up in realized outcomes. Keep drawdown within 2.5%.',
    90,
    '{"max_drawdown_pct":0.025}'::jsonb
),
(
    'module-5.4',
    'beta_vol_bonus_excess',
    'bonus',
    'min_excess_return_vs_benchmark',
    1,
    'Beat risk-budget benchmark by 0.5%',
    'Bonus challenge: add alpha while staying inside beta and volatility limits.',
    70,
    '{"benchmark_key":"risk_budget_benchmark","min_excess_return":0.005,"require_final":true}'::jsonb
),

(
    'module-5.5',
    'rebalance_after_rotation_signal',
    'passing',
    'rebalance_within_ticks',
    1,
    'Rebalance within 8 ticks of catalyst',
    'After the rotation catalyst, execute a meaningful rebalance within 8 ticks to reduce stale concentration.',
    110,
    '{"trigger_tick":42,"max_ticks_after_trigger":8,"min_rebalance_shift":0.20,"max_single_weight_after_rebalance":0.50}'::jsonb
),
(
    'module-5.5',
    'cap_sector_weight_after_rotation',
    'passing',
    'max_sector_weight',
    2,
    'Keep any single sector <= 55%',
    'Do not let one sector dominate your portfolio during the rotation.',
    90,
    '{"max_sector_weight":0.55}'::jsonb
),
(
    'module-5.5',
    'outperform_passive_hold',
    'passing',
    'min_excess_return_vs_benchmark',
    3,
    'Beat passive hold by 0.8%',
    'Active rebalancing should improve outcomes. Finish at least 0.8% above the passive benchmark.',
    100,
    '{"benchmark_key":"passive_hold","min_excess_return":0.008,"require_final":true}'::jsonb
),
(
    'module-5.5',
    'rotation_bonus_sector_balance',
    'bonus',
    'min_distinct_sectors',
    1,
    'Maintain at least 3 sectors',
    'Bonus challenge: keep sector breadth while navigating the rotation.',
    60,
    '{"min_sectors":3}'::jsonb
),

(
    'module-5.6',
    'rebalance_drift_keep_weight_cap',
    'passing',
    'max_single_position_weight',
    1,
    'Keep largest position <= 42%',
    'Your seeded portfolio starts drifted. Bring the largest position down to 42% or less.',
    100,
    '{"max_weight":0.42}'::jsonb
),
(
    'module-5.6',
    'rebalance_before_reversal_window',
    'passing',
    'rebalance_within_ticks',
    2,
    'Rebalance within 6 ticks of reversal warning',
    'Execute a meaningful rebalance quickly once reversal risk appears.',
    110,
    '{"trigger_tick":30,"max_ticks_after_trigger":6,"min_rebalance_shift":0.18,"max_single_weight_after_rebalance":0.45}'::jsonb
),
(
    'module-5.6',
    'drift_control_drawdown',
    'passing',
    'max_drawdown_pct',
    3,
    'Keep max drawdown <= 2.3%',
    'Rebalancing discipline should reduce downside when winner drift fades.',
    90,
    '{"max_drawdown_pct":0.023}'::jsonb
),
(
    'module-5.6',
    'drift_bonus_order_efficiency',
    'bonus',
    'max_total_orders',
    1,
    'Use at most 10 orders',
    'Bonus challenge: rebalance decisively without overtrading.',
    60,
    '{"max_total_orders":10}'::jsonb
),

(
    'module-5.7',
    'deliver_alpha_vs_benchmark',
    'passing',
    'min_excess_return_vs_benchmark',
    1,
    'Beat benchmark by 2.0%',
    'Demonstrate risk-aware skill by finishing at least 2.0% above the balanced benchmark.',
    120,
    '{"benchmark_key":"balanced_core","min_excess_return":0.02,"require_final":true}'::jsonb
),
(
    'module-5.7',
    'alpha_with_drawdown_control',
    'passing',
    'max_drawdown_pct',
    2,
    'Keep max drawdown <= 2.4%',
    'Outperformance only counts if downside is controlled.',
    95,
    '{"max_drawdown_pct":0.024}'::jsonb
),
(
    'module-5.7',
    'alpha_without_concentration',
    'passing',
    'max_single_position_weight',
    3,
    'Keep largest position <= 38%',
    'Avoid concentration risk while pursuing benchmark-relative alpha.',
    95,
    '{"max_weight":0.38}'::jsonb
),
(
    'module-5.7',
    'alpha_bonus_sector_cap',
    'bonus',
    'max_sector_weight',
    1,
    'Keep any sector <= 45%',
    'Bonus challenge: keep sector concentration in check during final scoring.',
    70,
    '{"max_sector_weight":0.45}'::jsonb
),
(
    'module-5.7',
    'alpha_bonus_breadth',
    'bonus',
    'min_distinct_positions',
    2,
    'Hold at least 5 positions',
    'Bonus challenge: maintain breadth while generating alpha.',
    60,
    '{"min_positions":5}'::jsonb
)
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate tool catalog and per-level tool toggles
-- ======================================
INSERT INTO tool_definitions (tool_key, title, description, tool_tutorial_id) VALUES
('news', 'News Feed', 'Display market-relevant news events during gameplay.', 'news-feed-basics'),
('market_order', 'Market Orders', 'Allow placing market buy and sell orders.', NULL),
('short_selling', 'Short Selling', 'Allow opening short positions (borrow then sell) and closing them with buy-to-cover.', 'short-selling-basics'),
('limit_order', 'Limit Orders', 'Allow placing limit buy and sell orders.', 'limit-order-basics'),
('stop_order', 'Stop Loss Orders', 'Allow placing stop-loss orders that trigger market exits.', 'stop-loss-basics'),
('stop_limit_order', 'Stop Limit Orders', 'Allow placing stop-limit orders that trigger and then rest as limit orders.', 'stop-limit-basics'),
('bid_ask_spread', 'Bid/Ask and Spread', 'Display best bid, best ask, and spread in ticking markets.', 'bid-ask-spread-basics'),
('moving_average', 'Moving Average', 'Display a moving average line and value on the chart.', 'moving-average-basics'),
('exponential_moving_average', 'Exponential Moving Average', 'Display an EMA line and value that reacts faster to recent prices.', 'exponential-moving-average-basics'),
('trader_edge_basics', 'Trader Edge Basics', 'Teaches the core interface: timer, price, portfolio, logs, and next-turn flow.', 'trader-edge-basics'),
('candlestick_chart_basics', 'Candlestick Chart Basics', 'Teaches how to read candlesticks and navigate the chart.', 'candlestick-chart-basics'),
('market_order_basics', 'Market Order Basics', 'Teaches market buy and market sell workflow.', 'market-order-basics'),
('interest_rate_panel', 'Interest Rate Panel', 'Display policy rate level, recent change, and stance context for macro interpretation.', 'interest-rate-basics'),
('inflation_panel', 'Inflation Panel', 'Display latest inflation reading and interpretation context for expectation-aware trading.', 'inflation-basics'),
('drawdown_panel', 'Drawdown Panel', 'Display current and max drawdown so players can monitor peak-to-trough risk.', 'drawdown-basics'),
('portfolio_allocation_panel', 'Portfolio Allocation Panel', 'Display current position weights so portfolio concentration is visible at a glance.', 'portfolio-allocation-basics'),
('sector_exposure_panel', 'Sector Exposure Panel', 'Display portfolio sector breakdown and highlight dominant sector risk.', 'sector-exposure-basics'),
('fundamentals_panel', 'Fundamentals Panel', 'Display valuation, profitability, leverage, and tags for the level universe.', 'fundamentals-basics'),
('correlation_panel', 'Correlation Panel', 'Display rolling correlation summaries to detect hidden theme crowding.', 'correlation-basics'),
('beta_volatility_panel', 'Beta and Volatility Panel', 'Display weighted beta and rolling volatility for risk-budget decisions.', 'beta-volatility-basics'),
('benchmark_panel', 'Benchmark Panel', 'Display benchmark and reference performance versus your active portfolio.', 'benchmark-basics'),
('rebalancing_prompt', 'Rebalancing Prompt', 'Surface catalyst-driven rebalance windows and timing guidance.', 'rebalancing-basics')
ON CONFLICT (tool_key) DO NOTHING;

INSERT INTO level_tool_availability (level_id, tool_id, enabled) VALUES
('module-1.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), false),
('module-1.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-1.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-1.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), false),
('module-1.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), false),
('module-1.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), false),

('module-1.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), false),
('module-1.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-1.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-1.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-1.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), false),
('module-1.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), false),

('module-1.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), false),
('module-1.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-1.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-1.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-1.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-1.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), false),

('module-1.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), false),
('module-1.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-1.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-1.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-1.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-1.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-2.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-2.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-2.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-2.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), false),
('module-2.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), false),
('module-2.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-2.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-2.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-2.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-2.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-2.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-2.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), false),
('module-2.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), false),
('module-2.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-2.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-2.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-2.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-2.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-2.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-2.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), false),
('module-2.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), false),
('module-2.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-2.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-2.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-2.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-2.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-2.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-2.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-2.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), false),
('module-2.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-2.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-2.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), false),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), false),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), false),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), false),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-2.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), false),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), false),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-3.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), false),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), false),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-3.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), false),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-3.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-3.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-3.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true),

('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'), true),
('module-3.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'), true)
ON CONFLICT DO NOTHING;

INSERT INTO level_tool_availability (level_id, tool_id, enabled) VALUES
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'interest_rate_panel'), true),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'inflation_panel'), false),
('module-4.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),

('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'interest_rate_panel'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'inflation_panel'), true),
('module-4.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),

('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'interest_rate_panel'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'inflation_panel'), true),
('module-4.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),

('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'interest_rate_panel'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'inflation_panel'), true),
('module-4.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),

('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'interest_rate_panel'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'inflation_panel'), true),
('module-4.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true)
ON CONFLICT DO NOTHING;

INSERT INTO level_tool_availability (level_id, tool_id, enabled) VALUES
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'portfolio_allocation_panel'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'sector_exposure_panel'), true),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'fundamentals_panel'), false),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'correlation_panel'), false),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'beta_volatility_panel'), false),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'benchmark_panel'), false),
('module-5.1', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'rebalancing_prompt'), false),

('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'portfolio_allocation_panel'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'sector_exposure_panel'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'fundamentals_panel'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'correlation_panel'), false),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'beta_volatility_panel'), false),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'benchmark_panel'), true),
('module-5.2', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'rebalancing_prompt'), false),

('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'portfolio_allocation_panel'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'sector_exposure_panel'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'fundamentals_panel'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'correlation_panel'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'beta_volatility_panel'), false),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'benchmark_panel'), true),
('module-5.3', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'rebalancing_prompt'), false),

('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'portfolio_allocation_panel'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'sector_exposure_panel'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'fundamentals_panel'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'correlation_panel'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'beta_volatility_panel'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'benchmark_panel'), true),
('module-5.4', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'rebalancing_prompt'), false),

('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'portfolio_allocation_panel'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'sector_exposure_panel'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'fundamentals_panel'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'correlation_panel'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'beta_volatility_panel'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'benchmark_panel'), true),
('module-5.5', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'rebalancing_prompt'), true),

('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'portfolio_allocation_panel'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'sector_exposure_panel'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'fundamentals_panel'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'correlation_panel'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'beta_volatility_panel'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'benchmark_panel'), true),
('module-5.6', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'rebalancing_prompt'), true),

('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'portfolio_allocation_panel'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'sector_exposure_panel'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'fundamentals_panel'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'correlation_panel'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'beta_volatility_panel'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'benchmark_panel'), true),
('module-5.7', (SELECT tool_id FROM tool_definitions WHERE tool_key = 'rebalancing_prompt'), true)
ON CONFLICT DO NOTHING;

INSERT INTO level_tool_availability (level_id, tool_id, enabled)
SELECT
    l.level_id,
    td.tool_id,
    true AS enabled
FROM levels l
CROSS JOIN (
    SELECT tool_id
    FROM tool_definitions
    WHERE tool_key = 'short_selling'
) td
WHERE l.level_type = 'tutorial'
  AND (
      l.module > 3
      OR (l.module = 3 AND l.level_order >= 5)
  )
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate unlock rows
-- ======================================
INSERT INTO level_unlocks (source_level_id, tool_id, title, description) VALUES
(
    'module-1.1',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'trader_edge_basics'),
    'Trader Edge Basics Unlocked',
    'Play the Trader Edge basics tutorial from your unlocks panel.'
),
(
    'module-1.2',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'candlestick_chart_basics'),
    'Candlestick Chart Basics Unlocked',
    'Play the candlestick chart tutorial from your unlocks panel.'
),
(
    'module-1.3',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'market_order_basics'),
    'Market Order Basics Unlocked',
    'Play the market-order tutorial from your unlocks panel.'
),
(
    'module-2.1',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'news'),
    'News Feed Unlocked',
    'You can now view scheduled news events during levels.'
),
(
    'module-2.4',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'moving_average'),
    'Moving Average Unlocked',
    'You can now plot a moving average line and read its live value from the indicator panel.'
),
(
    'module-2.5',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'exponential_moving_average'),
    'Exponential Moving Average Unlocked',
    'You can now overlay EMA and compare it with MA during fast momentum shifts.'
),
(
    'module-3.1',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'bid_ask_spread'),
    'Bid/Ask Panel Unlocked',
    'You can now monitor best bid, best ask, and spread in ticking markets.'
),
(
    'module-3.1',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'limit_order'),
    'Limit Orders Unlocked',
    'You can now place limit orders and wait for your target price.'
),
(
    'module-3.3',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_order'),
    'Stop Loss Orders Unlocked',
    'You can now place stop-loss orders to automate downside exits.'
),
(
    'module-3.4',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'stop_limit_order'),
    'Stop Limit Orders Unlocked',
    'You can now place stop-limit orders for trigger + limit control.'
),
(
    'module-3.5',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'short_selling'),
    'Short Selling Unlocked',
    'You can now borrow shares to sell first, then buy to cover later.'
)
ON CONFLICT DO NOTHING;

INSERT INTO level_unlocks (source_level_id, tool_id, title, description) VALUES
(
    'module-4.1',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'interest_rate_panel'),
    'Interest Rate Panel Unlocked',
    'You can now track policy-rate level, latest change, and stance context during macro levels.'
),
(
    'module-4.1',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'drawdown_panel'),
    'Drawdown Panel Unlocked',
    'You can now track current and max drawdown to control peak-to-trough risk during macro levels.'
),
(
    'module-4.2',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'inflation_panel'),
    'Inflation Panel Unlocked',
    'You can now monitor inflation readings and interpret surprises versus market expectations.'
)
ON CONFLICT DO NOTHING;

INSERT INTO level_unlocks (source_level_id, tool_id, title, description) VALUES
(
    'module-5.1',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'portfolio_allocation_panel'),
    'Portfolio Allocation Panel Unlocked',
    'You can now review live position weights to spot concentration before it becomes portfolio risk.'
),
(
    'module-5.1',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'sector_exposure_panel'),
    'Sector Exposure Panel Unlocked',
    'You can now monitor sector allocation and avoid hidden theme crowding.'
),
(
    'module-5.2',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'fundamentals_panel'),
    'Fundamentals Panel Unlocked',
    'You can now compare valuation, profitability, leverage, and defensive tags before allocating capital.'
),
(
    'module-5.2',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'benchmark_panel'),
    'Benchmark Panel Unlocked',
    'You can now measure portfolio performance relative to seeded benchmark and reference baskets.'
),
(
    'module-5.3',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'correlation_panel'),
    'Correlation Panel Unlocked',
    'You can now identify hidden crowding by tracking rolling correlation behavior across holdings.'
),
(
    'module-5.4',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'beta_volatility_panel'),
    'Beta and Volatility Panel Unlocked',
    'You can now monitor weighted beta and rolling volatility as formal risk budgets.'
),
(
    'module-5.5',
    (SELECT tool_id FROM tool_definitions WHERE tool_key = 'rebalancing_prompt'),
    'Rebalancing Prompt Unlocked',
    'You can now receive catalyst-timed rebalance prompts to manage drift and rotation risk.'
)
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate module 4 macro factors and effects
-- ======================================
INSERT INTO level_macro_factors (
    level_id,
    factor_key,
    title,
    current_value,
    previous_value,
    last_change_bps,
    market_stance_note,
    display_order
) VALUES
('module-4.1', 'interest_rate', 'Policy Rate', 5.250000, 5.000000, 25, 'Rates remain restrictive and risk appetite is selective.', 1),
('module-4.2', 'interest_rate', 'Policy Rate', 5.250000, 5.250000, 0, 'Policy is steady while markets focus on inflation surprises.', 1),
('module-4.2', 'inflation', 'CPI YoY', 3.800000, 3.200000, 60, 'Upside inflation surprise delays expected easing cuts.', 2),
('module-4.3', 'interest_rate', 'Policy Rate', 5.000000, 5.250000, -25, 'Policy tone is mixed: first reaction may fade once full remarks are digested.', 1),
('module-4.3', 'inflation', 'CPI YoY', 3.400000, 3.600000, -20, 'Cooling headline inflation conflicts with sticky services, creating two-way interpretation risk.', 2),
('module-4.4', 'interest_rate', 'Policy Rate', 4.750000, 5.000000, -25, 'Policy uncertainty can trigger fear, relief, and renewed stress in separate phases.', 1),
('module-4.4', 'inflation', 'CPI YoY', 3.100000, 3.300000, -20, 'Disinflation progress helps sentiment, but shutdown risk can dominate tape direction.', 2),
('module-4.5', 'interest_rate', 'Policy Rate', 4.500000, 4.750000, -25, 'Emergency easing talk can stabilize price briefly before deeper damage is repriced.', 1),
('module-4.5', 'inflation', 'CPI YoY', 2.900000, 3.100000, -20, 'Demand shock softens inflation, but volatility remains driven by second-order risk headlines.', 2)
ON CONFLICT DO NOTHING;

WITH target_factor AS (
    SELECT macro_factor_id
    FROM level_macro_factors
    WHERE level_id = 'module-4.1' AND factor_key = 'interest_rate'
),
inserted_effect AS (
    INSERT INTO level_macro_factor_effects (
        macro_factor_id,
        multiplier,
        start_tick,
        end_tick,
        title,
        content
    )
    SELECT
        tf.macro_factor_id,
        -0.009000,
        22,
        30,
        'Rate Shock Repricing',
        E'Fed communication reinforces a higher-for-longer path.\n' ||
        E'Valuation-sensitive names reprice lower as discount-rate assumptions rise.\n' ||
        E'Protect entries and avoid chasing every downtick.'
    FROM target_factor tf
    ON CONFLICT DO NOTHING
    RETURNING macro_factor_effect_id
)
INSERT INTO level_macro_factor_effect_tickers (
    macro_factor_effect_id,
    level_ticker_id
)
SELECT
    ie.macro_factor_effect_id,
    lt.level_ticker_id
FROM inserted_effect ie
JOIN level_tickers lt
    ON lt.level_id = 'module-4.1'
   AND lt.ticker = 'AAPL';

WITH target_factor AS (
    SELECT macro_factor_id
    FROM level_macro_factors
    WHERE level_id = 'module-4.2' AND factor_key = 'inflation'
),
inserted_effect AS (
    INSERT INTO level_macro_factor_effects (
        macro_factor_id,
        multiplier,
        start_tick,
        end_tick,
        title,
        content
    )
    SELECT
        tf.macro_factor_id,
        -0.011000,
        24,
        33,
        'Hot CPI Repricing',
        E'Inflation prints above consensus and rate-cut expectations are pushed out.\n' ||
        E'Positioning rapidly unwinds as growth multiples compress.\n' ||
        E'Expect sharp two-way reactions before trend clarity returns.'
    FROM target_factor tf
    ON CONFLICT DO NOTHING
    RETURNING macro_factor_effect_id
)
INSERT INTO level_macro_factor_effect_tickers (
    macro_factor_effect_id,
    level_ticker_id
)
SELECT
    ie.macro_factor_effect_id,
    lt.level_ticker_id
FROM inserted_effect ie
JOIN level_tickers lt
    ON lt.level_id = 'module-4.2'
   AND lt.ticker = 'NVDA';

-- ======================================
-- Populate manual-tick news events
-- ======================================
WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.1',
        'Microsoft Linked to Major Government Cloud Bid',
        E'Industry reporters said Microsoft is a leading contender for a multi-year government cloud modernization contract.\n' ||
        E'Options activity rose quickly after the report, with call volume running above recent averages.\n' ||
        E'Analysts said confirmation timing and contract economics will determine whether the move extends.',
        2
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        2,
        2
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.1'
   AND lt.ticker = 'MSFT';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.1',
        'Microsoft Announces Expanded Public-Sector Cloud Agreements',
        E'Microsoft said it is expanding secure cloud workloads with additional public-sector customers.\n' ||
        E'Broker research highlighted better recurring revenue visibility in the government segment.\n' ||
        E'Shares firmed as desks revised near-term growth assumptions.',
        6
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        6,
        6
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.1'
   AND lt.ticker = 'MSFT';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.2',
        'NVIDIA Expectations Climb Further Ahead of Results',
        E'Institutional notes showed another round of estimate increases ahead of Nvidia earnings.\n' ||
        E'Unofficial whisper numbers moved above published consensus after upbeat supply-chain checks.\n' ||
        E'With positioning crowded, desks warned that any execution miss could trigger a sharp reaction.',
        1
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        1,
        1
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.2'
   AND lt.ticker = 'NVDA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.2',
        'NVIDIA Delivers In-Line Quarter, Keeps Demand Outlook Strong',
        E'Nvidia reported results roughly in line with elevated forecasts and reiterated strong data-center demand.\n' ||
        E'Management said order visibility remains solid into the next several quarters.\n' ||
        E'The update kept sentiment constructive even after a large pre-earnings run.',
        5
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        5,
        5
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.2'
   AND lt.ticker = 'NVDA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.3',
        'Tesla Estimates Rise Into Earnings on Delivery Optimism',
        E'Sell-side models moved higher before Tesla results after stronger delivery assumptions circulated.\n' ||
        E'Positioning data showed investors leaning long into the event window.\n' ||
        E'Several desks flagged higher downside sensitivity if margin stabilization did not materialize.',
        1
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        1,
        1
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.3'
   AND lt.ticker = 'TSLA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.3',
        'Tesla Slides on Earnings Miss as Margin Pressure Persists',
        E'Tesla reported earnings below elevated expectations, with automotive margin compression still visible.\n' ||
        E'Management pointed to continued pricing pressure and uneven near-term demand.\n' ||
        E'The release prompted rapid position unwinds and higher implied volatility.',
        5
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        5,
        5
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.3'
   AND lt.ticker = 'TSLA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.4',
        'Apple Services Data Eases Fears of a Sharp Slowdown',
        E'Recent channel checks indicated steadier renewal trends across Apple services than previously feared.\n' ||
        E'Analysts said the read-through supports a firmer medium-term earnings base.\n' ||
        E'Investors reassessed downside risk to recurring revenue assumptions.',
        7
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        7,
        7
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.4'
   AND lt.ticker = 'AAPL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.4',
        'Repurchase Speculation Boosts Apple Shares',
        E'Market chatter about a larger share buyback authorization renewed interest in Apple.\n' ||
        E'Strategists said a bigger capital-return program would reinforce confidence in cash generation.\n' ||
        E'The stock extended gains as the narrative spread across desks.',
        22
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        22,
        22
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.4'
   AND lt.ticker = 'AAPL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.5',
        'Palantir Becomes Top Retail Focus as Volume Surges',
        E'Palantir moved to the top of several retail-trading trackers and drew heavy incremental flow.\n' ||
        E'Intraday turnover accelerated and price ranges widened as participation broadened.\n' ||
        E'Derivatives desks flagged elevated two-way volatility while momentum remained dominant.',
        6
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        6,
        6
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.5'
   AND lt.ticker = 'PLTR';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-2.5',
        'Palantir Pulls Back as Early Momentum Traders Take Profit',
        E'Palantir reversed after early participants locked in gains from the retail-driven spike.\n' ||
        E'The retracement developed quickly before support emerged, creating choppy intraday tape.\n' ||
        E'Dealers reported continued high turnover as late buyers reduced exposure.',
        20
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.000000,
        20,
        20
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-2.5'
   AND lt.ticker = 'PLTR';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.1',
        'Thin Opening Depth Leaves Apple Spread Wider Than Usual',
        E'Apple opened with lighter order-book depth, and quoted bid-ask spreads widened in early trade.\n' ||
        E'Market makers reported faster quote updates as flow arrived in short bursts.\n' ||
        E'Execution costs rose for participants crossing the spread near the open.',
        8
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.006000,
        8,
        11
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.1'
   AND lt.ticker = 'AAPL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.1',
        'Program Selling Weighs on Apple Bids Through Mid-Session',
        E'A sequence of short-horizon sell programs pressured Apple bids for several consecutive ticks.\n' ||
        E'Traders observed passive supply refreshing near the inside offer.\n' ||
        E'The pattern kept the stock heavy despite intermittent rebound attempts.',
        30
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.007000,
        30,
        34
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.1'
   AND lt.ticker = 'AAPL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.2',
        'Supplier Timing Concern Pushes Apple Lower in Early Trade',
        E'Supply-chain checks pointed to a temporary component delay, prompting an initial risk reduction in Apple.\n' ||
        E'The move lower remained orderly, with liquidity available on both sides.\n' ||
        E'Desk commentary framed the selloff as sentiment-driven rather than a lasting demand reset.',
        12
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.010000,
        12,
        15
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.2'
   AND lt.ticker = 'AAPL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.2',
        'Late Corporate Buying Helps Apple Rebound Into Close',
        E'Toward the close, traders cited steady corporate-related buying interest in Apple shares.\n' ||
        E'Additional demand tightened the tape after a softer midday stretch.\n' ||
        E'The bid lifted the stock away from session lows in final prints.',
        40
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.012000,
        40,
        44
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.2'
   AND lt.ticker = 'AAPL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.3',
        'NVIDIA Guidance Cut Forces Fast Repricing',
        E'Nvidia reduced near-term guidance, leading desks to revise earnings assumptions lower.\n' ||
        E'Bids thinned as sellers pressed the move across multiple ticks.\n' ||
        E'The adjustment drove a sharp rise in realized intraday volatility.',
        18
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.020000,
        18,
        22
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.3'
   AND lt.ticker = 'NVDA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.3',
        'NVIDIA Rebounds as Tactical Buyers Step Back In',
        E'After the initial drawdown, short-term buyers returned and lifted nearby offers in Nvidia.\n' ||
        E'The recovery developed quickly and retraced part of the earlier decline.\n' ||
        E'Traders said short covering added to the speed of the rebound.',
        52
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.018000,
        52,
        56
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.3'
   AND lt.ticker = 'NVDA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.4',
        'Unverified Product Chatter Triggers Rapid Tesla Spike',
        E'An unverified product report circulated online and sparked a sudden upside burst in Tesla.\n' ||
        E'Order-book depth thinned as buyers chased quickly moving quotes.\n' ||
        E'The jump coincided with unusually high slippage in aggressive executions.',
        24
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.020000,
        24,
        27
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.4'
   AND lt.ticker = 'TSLA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.5',
        'Tesla Margin Warning Triggers Broad De-Risking',
        E'Tesla warned that gross margin pressure may persist through the next quarter.\n' ||
        E'Desks revised near-term profitability assumptions lower and reduced exposure quickly.\n' ||
        E'Order-book pressure stayed persistent as sellers refreshed offers.',
        14
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.016000,
        14,
        20
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.5'
   AND lt.ticker = 'TSLA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.5',
        'Credit Desk Downgrade Extends Tesla Downtrend',
        E'A major credit desk downgraded Tesla debt outlook and warned refinancing costs could stay elevated.\n' ||
        E'The downgrade amplified downside momentum as dip buyers stayed cautious.\n' ||
        E'Price action remained heavy into the next sequence of ticks.',
        44
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.018000,
        44,
        50
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.5'
   AND lt.ticker = 'TSLA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.6',
        'NVIDIA Demand Revision Starts Fresh Down Leg',
        E'Nvidia channel checks showed weaker near-term accelerator demand than prior street assumptions.\n' ||
        E'Analysts trimmed shipment expectations and desks leaned short into the open.\n' ||
        E'The initial move lower established bearish momentum.',
        18
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.015000,
        18,
        24
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.6'
   AND lt.ticker = 'NVDA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.6',
        'Short Squeeze Rips NVIDIA as Positioning Gets Crowded',
        E'A fast dealer-gamma unwind forced short covering and lifted Nvidia sharply against trend.\n' ||
        E'Liquidity thinned and slippage increased for late entries.\n' ||
        E'The bounce highlighted squeeze risk before trend direction stabilized.',
        40
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.017000,
        40,
        44
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.6'
   AND lt.ticker = 'NVDA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.6',
        'NVIDIA Follow-Through Selling Returns After Failed Bounce',
        E'Once squeeze flow faded, sellers reasserted control and pushed Nvidia lower again.\n' ||
        E'The failed rebound confirmed weak structure for traders waiting on trend alignment.\n' ||
        E'Discipline around entry timing and cover execution became critical.',
        58
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.019000,
        58,
        64
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.6'
   AND lt.ticker = 'NVDA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-3.4',
        'Tesla Reverses After Source Disputes Earlier Claim',
        E'A source tied to the original Tesla rumor disputed the report, and momentum flipped abruptly.\n' ||
        E'Selling pressure accelerated as intraday longs reduced exposure.\n' ||
        E'The reversal erased much of the prior spike within a short window.',
        48
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.022000,
        48,
        52
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-3.4'
   AND lt.ticker = 'TSLA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-4.3',
        'Fed Remarks Trigger Two-Way Repricing in Equities',
        E'Initial excerpts from a Federal Reserve speech were interpreted as hawkish and pushed stocks lower.\n' ||
        E'As fuller transcript details circulated, rates and equities staged a partial relief move.\n' ||
        E'Late-session trading turned cautious again as desks focused on persistent inflation language.',
        16
    )
    RETURNING news_event_id
),
inserted_effects AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        eff.multiplier,
        eff.start_tick,
        eff.end_tick
    FROM inserted_event ie
    CROSS JOIN (
        VALUES
            (-0.012000, 16, 20),
            (0.009000, 34, 39),
            (-0.010000, 58, 64)
    ) AS eff(multiplier, start_tick, end_tick)
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-4.3'
   AND lt.ticker = 'MSFT';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-4.4',
        'Shutdown Headlines Swing Bank Shares as Talks Stall',
        E'Breakdowns in budget negotiations raised shutdown odds and pressured risk sentiment in financials.\n' ||
        E'A temporary funding rumor sparked a brief relief rally before conviction faded.\n' ||
        E'With talks unresolved, volatility in bank shares stayed elevated.',
        14
    )
    RETURNING news_event_id
),
inserted_effects AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        eff.multiplier,
        eff.start_tick,
        eff.end_tick
    FROM inserted_event ie
    CROSS JOIN (
        VALUES
            (-0.010000, 14, 18),
            (0.007000, 31, 35),
            (-0.012000, 55, 61)
    ) AS eff(multiplier, start_tick, end_tick)
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-4.4'
   AND lt.ticker = 'JPM';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-4.5',
        'Infrastructure Failure Jolts Energy Tape, Then Bounce Fades',
        E'A major infrastructure incident triggered immediate selling across energy and cyclical names.\n' ||
        E'Emergency-response headlines produced a short-lived stabilization bid.\n' ||
        E'Later increases in projected secondary losses pushed risk assets lower again.',
        10
    )
    RETURNING news_event_id
),
inserted_effects AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        eff.multiplier,
        eff.start_tick,
        eff.end_tick
    FROM inserted_event ie
    CROSS JOIN (
        VALUES
            (-0.020000, 10, 15),
            (0.013000, 26, 31),
            (-0.016000, 49, 56)
    ) AS eff(multiplier, start_tick, end_tick)
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-4.5'
   AND lt.ticker = 'XOM';

-- ======================================
-- Populate auto-tick news events
-- (date-based puzzle news converted to business-day tick indexes)
-- ======================================
WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'puzzle-1.1',
        'Thailand Drops Baht Peg, Regional Markets Sell Off',
        E'Thailand abandoned its currency peg, sending the baht sharply lower and rattling regional assets.\n' ||
        E'Capital outflows accelerated as funding conditions tightened across Southeast Asia.\n' ||
        E'Export-linked equities came under pressure as investors repriced growth and foreign-exchange risk.',
        1
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.020000,
        1,
        4
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'puzzle-1.1'
   AND lt.ticker = 'TM';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'puzzle-1.1',
        'Contagion Fears Spread to Japanese Exporters',
        E'Stress from the regional currency slide spilled into Tokyo and weighed on trade-sensitive shares.\n' ||
        E'Automakers with heavy Asia revenue exposure faced renewed selling pressure.\n' ||
        E'Macro desks warned earnings assumptions could face further cuts if volatility persisted.',
        32
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.015000,
        32,
        35
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'puzzle-1.1'
   AND lt.ticker = 'TM';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'puzzle-1.2',
        'Italy Mobility Curbs Hit Global Travel Outlook',
        E'Italy introduced broad movement restrictions as infection counts accelerated.\n' ||
        E'Forward cruise booking data softened across major corridors.\n' ||
        E'Analysts increased near-term cash-burn estimates for travel operators.',
        15
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.025000,
        15,
        19
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'puzzle-1.2'
   AND lt.ticker = 'CCL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'puzzle-1.2',
        'WHO Pandemic Declaration Deepens Travel-Sector Pressure',
        E'The World Health Organization declared the outbreak a pandemic, prompting wider emergency actions.\n' ||
        E'Demand visibility for tourism-linked companies deteriorated further.\n' ||
        E'Credit analysts highlighted refinancing risk for highly leveraged operators.',
        17
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.035000,
        17,
        21
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'puzzle-1.2'
   AND lt.ticker = 'CCL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'puzzle-1.2',
        'US No-Sail Order Extends Cruise Industry Freeze',
        E'US authorities issued a no-sail order, extending the halt in cruise operations.\n' ||
        E'Fleet utilization and restart assumptions were pushed out again.\n' ||
        E'Major operators fell as liquidity concerns intensified.',
        20
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.030000,
        20,
        24
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'puzzle-1.2'
AND lt.ticker = 'CCL';

-- ======================================
-- Populate Module 5 auto-tick news events
-- ======================================
WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.1',
        'Valuation Reset Hits High-Multiple Technology Stocks',
        E'A broad valuation reset swept through large technology names after growth forecasts were marked down.\n' ||
        E'Crowded long positioning amplified declines as de-risking orders accelerated.\n' ||
        E'Cross-sector performance diverged as investors reassessed earnings durability.',
        66
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.018000,
        66,
        76
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.1'
   AND lt.ticker IN ('AAPL', 'MSFT', 'NVDA');

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.2',
        'Credit Outlook Cuts Pressure Levered Cyclical Names',
        E'Credit desks reported a wave of outlook downgrades for highly leveraged cyclical issuers.\n' ||
        E'Refinancing costs rose and spreads widened across lower-quality borrowers.\n' ||
        E'Equities followed with a sharper discount for debt-heavy balance sheets.',
        20
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.015000,
        20,
        29
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.2'
   AND lt.ticker = 'F';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.2',
        'Investors Favor Balance-Sheet Strength and Stable Cash Flow',
        E'Fund managers increased exposure to companies with durable free-cash-flow profiles.\n' ||
        E'Defensive franchises outperformed while higher operating-leverage names lagged.\n' ||
        E'Strategists said quality screens are driving relative returns in this tape.',
        34
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.010000,
        34,
        42
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.2'
   AND lt.ticker IN ('PG', 'PFE');

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.3',
        'Crowded AI Trade Unwinds as Leaders Sell Off Together',
        E'Momentum stocks tied to the AI theme fell in tandem as investors reduced crowded exposure.\n' ||
        E'Cross-name correlation among prior winners rose during the drawdown.\n' ||
        E'The move exposed concentration in portfolios built around a single factor regime.',
        26
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.018000,
        26,
        34
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.3'
   AND lt.ticker IN ('NVDA', 'AMD', 'QCOM');

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.3',
        'Healthcare and Utilities Attract Inflows as AI Leaders Cool',
        E'As high-growth leadership softened, capital rotated into healthcare and utilities.\n' ||
        E'Relative strength improved in lower-beta groups through the session.\n' ||
        E'Desk commentary described the shift as a broad risk-rotation phase.',
        48
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.009000,
        48,
        56
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.3'
   AND lt.ticker IN ('UNH', 'NEE');

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.4',
        'High-Beta Squeeze Reverses After Early Surge',
        E'A rapid short squeeze sent high-beta shares sharply higher in the opening phase.\n' ||
        E'Later trading faded as valuation concerns returned and profit-taking expanded.\n' ||
        E'The round trip produced the largest swings in the most volatile names.',
        24
    )
    RETURNING news_event_id
),
inserted_effects AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        eff.multiplier,
        eff.start_tick,
        eff.end_tick
    FROM inserted_event ie
    CROSS JOIN (
        VALUES
            (0.016000, 24, 30),
            (-0.019000, 44, 50)
    ) AS eff(multiplier, start_tick, end_tick)
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.4'
   AND lt.ticker IN ('TSLA', 'NVDA');

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.5',
        'Demand Outlook Downgrade Hits Energy and Cyclicals',
        E'Revised demand forecasts weighed on energy producers and other cyclical leaders.\n' ||
        E'Sectors that led earlier in the quarter began to lose momentum.\n' ||
        E'Relative performance shifted as investors repriced commodity-linked earnings.',
        42
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.014000,
        42,
        49
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.5'
   AND lt.ticker IN ('XOM', 'CVX', 'CAT');

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.5',
        'Defensive and Quality Tech Groups Take Market Leadership',
        E'With cyclical momentum fading, inflows moved toward defensive sectors and cash-rich technology firms.\n' ||
        E'Breadth indicators showed leadership broadening beyond prior commodity winners.\n' ||
        E'Strategists said the rotation reflects a preference for earnings resilience.',
        42
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.011000,
        42,
        49
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.5'
   AND lt.ticker IN ('AAPL', 'NEE');

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.6',
        'Breadth Broadens as Former Market Leader Loses Momentum',
        E'After an extended advance, the strongest prior winner stalled while lagging groups strengthened.\n' ||
        E'Participation broadened across sectors as investors trimmed outsized positions.\n' ||
        E'Desk commentary framed the shift as a transition to a later-cycle market phase.',
        30
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        -0.017000,
        30,
        38
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.6'
   AND lt.ticker = 'AAPL';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.6',
        'Lagging Defensive Groups Outperform in Late Rotation',
        E'Capital moved into previously under-owned defensive sectors as volatility expectations rose.\n' ||
        E'Relative returns improved for staples and healthcare versus earlier momentum leaders.\n' ||
        E'Traders cited continued demand for lower-beta exposure.',
        46
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.008000,
        46,
        54
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.6'
   AND lt.ticker IN ('KO', 'JNJ', 'XOM');

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.7',
        'Broad Index Grinds Higher in Low-Dispersion Trade',
        E'Major benchmarks advanced steadily with few macro catalysts and muted single-name dispersion.\n' ||
        E'Turnover remained moderate as directional conviction stayed mixed.\n' ||
        E'Analysts described the session as a slow, benchmark-led climb.',
        22
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.007000,
        22,
        32
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
) SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.7';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.7',
        'Late-Cycle Pullback Weighs on High-Growth Leaders',
        E'High-growth leaders retreated as investors revisited valuation risk in the back half of trade.\n' ||
        E'Losses were most pronounced in higher-beta technology names.\n' ||
        E'Relative performance swung quickly toward lower-volatility sectors.',
        62
    )
    RETURNING news_event_id
),
inserted_effects AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        eff.multiplier,
        eff.start_tick,
        eff.end_tick
    FROM inserted_event ie
    CROSS JOIN (
        VALUES
            (-0.015000, 62, 70),
            (0.006000, 62, 70)
    ) AS eff(multiplier, start_tick, end_tick)
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
)
SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.7'
   AND lt.ticker = 'NVDA';

WITH inserted_event AS (
    INSERT INTO level_news_events (
        level_id,
        title,
        content,
        start_tick
    ) VALUES (
        'module-5.7',
        'Quality and Defensive Shares Gain as Growth Leadership Fades',
        E'As growth momentum cooled, steady cash-flow names attracted fresh institutional demand.\n' ||
        E'Banks and defensive sectors held firmer relative performance through the rotation.\n' ||
        E'The leadership handoff narrowed gains in previously dominant growth pockets.',
        62
    )
    RETURNING news_event_id
),
inserted_effect AS (
    INSERT INTO level_news_event_effects (
        news_event_id,
        multiplier,
        start_tick,
        end_tick
    ) SELECT
        ie.news_event_id,
        0.006000,
        62,
        70
    FROM inserted_event ie
)
INSERT INTO level_news_event_tickers (
    news_event_id,
    level_ticker_id
)
SELECT
    ie.news_event_id,
    lt.level_ticker_id
FROM inserted_event ie
JOIN level_tickers lt
    ON lt.level_id = 'module-5.7'
   AND lt.ticker IN ('JNJ', 'XOM', 'JPM');

-- ======================================
-- (No seed user_level_progress rows; users start fresh.
--  POST /user/ auto-enrolls each new user in 'module-1.1' on first sign-in.)
-- ======================================

-- ======================================
-- Populate achievements
-- ======================================
INSERT INTO achievements (achievement_id, title, hint, description, icon_key) VALUES
('achievement-first-level', 'Play your first level', 'Complete any Adventure Mode level.', 'Congrats on taking the first step! You''ve started your trading journey.', 'Baby'),
('achievement-5-levels', 'Complete 5 levels', 'Finish 5 Adventure Mode levels.', 'Great job! You''re making steady progress in your trading adventure.', 'Medal'),
('achievement-10-levels', 'Complete 10 levels', 'Finish 10 Adventure Mode levels.', 'Impressive! You''re becoming a skilled trader with each level you conquer.', 'Medal'),
('achievement-all-module-1', 'Master Module 1', 'Finish all levels in Module 1.', 'Fantastic! You''ve mastered the fundamentals of trading in Module 1.', 'Star'),
('achievement-all-module-2', 'Master Module 2', 'Finish all levels in Module 2.', 'Excellent work! You''ve advanced your trading skills by completing Module 2.', 'Star'),
('achievement-unlock-puzzle', 'Unlock Puzzle Mode', 'Finish all Adventure Mode modules.', 'Puzzle Mode unlocked: take on carefully crafted challenges.', 'Puzzle'),
('achievement-unlock-endless', 'Unlock Endless Mode', 'Earn all points milestones in Adventure Mode.', 'Endless Mode unlocked: trade without limits.', 'Infinity')
ON CONFLICT DO NOTHING;

-- ======================================
-- (No seed user_achievements or user_activity_events; populated at runtime
--  as users sign in and progress through levels.)
-- ======================================

-- ======================================
-- Populate module quizzes
-- ======================================
INSERT INTO module_quizzes (quiz_id, module, quiz_type, title, description, passing_score) VALUES
('MOD1_PRE', 1, 'pre', 'Module 1 Pre-Quiz', 'Check your baseline knowledge before Module 1.', 0),
('MOD1_POST', 1, 'post', 'Module 1 Post-Quiz', 'Assess what you learned after Module 1.', 0),
('MOD2_PRE', 2, 'pre', 'Module 2 Pre-Quiz', 'Check your baseline knowledge before Module 2: news, earnings expectations, moving average, and EMA.', 0),
('MOD2_POST', 2, 'post', 'Module 2 Post-Quiz', 'Assess what you learned after Module 2: news, earnings expectations, moving average, and EMA.', 0),
('MOD3_PRE', 3, 'pre', 'Module 3 Pre-Quiz', 'Check your baseline knowledge before Module 3: ticking execution, risk controls, short selling mechanics, and confirmation timing.', 0),
('MOD3_POST', 3, 'post', 'Module 3 Post-Quiz', 'Assess what you learned after Module 3: short lifecycle, stop/limit discipline, and MA/EMA-aided short timing.', 0),
('MOD4_PRE', 4, 'pre', 'Module 4 Pre-Quiz', 'Check your baseline knowledge before Module 4: macro expectations, uncertainty handling, and risk discipline.', 0),
('MOD4_POST', 4, 'post', 'Module 4 Post-Quiz', 'Assess what you learned after Module 4: conflicting macro signals, drawdown control, and defensive execution.', 0),
('MOD5_PRE', 5, 'pre', 'Module 5 Pre-Quiz', 'Check your baseline knowledge before Module 5: diversification, correlation, beta-volatility, and benchmark-relative performance.', 0),
('MOD5_POST', 5, 'post', 'Module 5 Post-Quiz', 'Assess what you learned after Module 5: portfolio construction, rebalancing discipline, and alpha versus benchmark.', 0)
ON CONFLICT DO NOTHING;

INSERT INTO module_quiz_questions (
    question_id,
    quiz_id,
    question_order,
    prompt,
    options,
    correct_option_index,
    explanation
) VALUES
('m1-pre-1', 'MOD1_PRE', 1, 'In Module 1, what does buying a stock mean?',
 '["You take a position that can gain or lose value as the price moves","You lock in a guaranteed profit","You borrow shares from another trader"]',
 0, 'Buying creates a long position whose value changes with market price.'),
('m1-pre-2', 'MOD1_PRE', 2, 'What does one candlestick represent?',
 '["The open, high, low, and close prices for one time interval","Your portfolio value for the whole level","Only the opening and closing prices for the entire week"]',
 0, 'A candlestick summarizes OHLC for one chart interval.'),
('m1-pre-3', 'MOD1_PRE', 3, 'How does a market order work?',
 '["It executes immediately at the best available market price","It only executes at a price you specify","It executes only when the level ends"]',
 0, 'Market orders prioritize immediate execution at available prices.'),
('m1-pre-4', 'MOD1_PRE', 4, 'Which trade results in a +$500 realized profit (ignoring fees)?',
 '["Buy 100 shares at $10, then sell 100 shares at $15","Buy 100 shares at $15, then sell 100 shares at $10","Buy 100 shares at $10 and never sell"]',
 0, 'Realized profit is (sell price - buy price) * shares, so (15 - 10) * 100 = 500.'),
('m1-post-1', 'MOD1_POST', 1, 'In Module 1, what does buying a stock mean?',
 '["You take a position that can gain or lose value as the price moves","You lock in a guaranteed profit","You borrow shares from another trader"]',
 0, 'Buying creates a long position whose value changes with market price.'),
('m1-post-2', 'MOD1_POST', 2, 'What does one candlestick represent?',
 '["The open, high, low, and close prices for one time interval","Your portfolio value for the whole level","Only the opening and closing prices for the entire week"]',
 0, 'A candlestick summarizes OHLC for one chart interval.'),
('m1-post-3', 'MOD1_POST', 3, 'How does a market order work?',
 '["It executes immediately at the best available market price","It only executes at a price you specify","It executes only when the level ends"]',
 0, 'Market orders prioritize immediate execution at available prices.'),
('m1-post-4', 'MOD1_POST', 4, 'Which trade results in a +$500 realized profit (ignoring fees)?',
 '["Buy 100 shares at $10, then sell 100 shares at $15","Buy 100 shares at $15, then sell 100 shares at $10","Buy 100 shares at $10 and never sell"]',
 0, 'Realized profit is (sell price - buy price) * shares, so (15 - 10) * 100 = 500.'),
('m2-pre-1', 'MOD2_PRE', 1, 'What is usually the first market impact of stock-specific news?',
 '["It immediately moves all stocks in the index equally","It tends to affect the referenced company''s stock first","It has no impact unless rates also change"]',
 1, 'Single-company news usually hits that stock first, then can spill over later.'),
('m2-pre-2', 'MOD2_PRE', 2, 'If earnings match high expectations but management guidance is upbeat, what can happen?',
 '["Price must fall because there was no earnings beat","Price can still rise as sentiment stays positive","There is usually no reaction at all"]',
 1, 'Forward guidance and tone can keep buying pressure alive even without a large numeric beat.'),
('m2-pre-3', 'MOD2_PRE', 3, 'What is a common reaction when actual earnings miss elevated expectations?',
 '["Selling pressure often appears as expectations reset lower","The stock is automatically halted for the full session","Price usually remains unchanged because miss events are fully ignored"]',
 0, 'When expectations were stretched, a miss often leads to rapid repricing.'),
('m2-pre-4', 'MOD2_PRE', 4, 'Which best describes a simple moving average (MA)?',
 '["The average of recent closing prices over a fixed number of ticks","The sum of daily volume over the whole level","The midpoint of only the latest candle"]',
 0, 'A simple MA smooths price by averaging closes over a rolling fixed window.'),
('m2-pre-5', 'MOD2_PRE', 5, 'How does EMA differ from a simple MA?',
 '["EMA weights old data more and reacts slower","EMA weights recent data more and reacts faster","EMA and MA always give identical readings"]',
 1, 'EMA emphasizes recent prices, so it responds faster to trend changes.'),
('m2-pre-6', 'MOD2_PRE', 6, 'During a fast viral spike and pullback, which indicator usually turns first?',
 '["Simple MA usually turns first","EMA usually turns first","Neither indicator can reflect reversals"]',
 1, 'EMA typically changes direction earlier because recent prices have larger weight.'),
('m2-post-1', 'MOD2_POST', 1, 'What is usually the first market impact of stock-specific news?',
 '["It immediately moves all stocks in the index equally","It tends to affect the referenced company''s stock first","It has no impact unless rates also change"]',
 1, 'Single-company news usually hits that stock first, then can spill over later.'),
('m2-post-2', 'MOD2_POST', 2, 'If earnings match high expectations but management guidance is upbeat, what can happen?',
 '["Price must fall because there was no earnings beat","Price can still rise as sentiment stays positive","There is usually no reaction at all"]',
 1, 'Forward guidance and tone can keep buying pressure alive even without a large numeric beat.'),
('m2-post-3', 'MOD2_POST', 3, 'What is a common reaction when actual earnings miss elevated expectations?',
 '["Selling pressure often appears as expectations reset lower","The stock is automatically halted for the full session","Price usually remains unchanged because miss events are fully ignored"]',
 0, 'When expectations were stretched, a miss often leads to rapid repricing.'),
('m2-post-4', 'MOD2_POST', 4, 'Which best describes a simple moving average (MA)?',
 '["The average of recent closing prices over a fixed number of ticks","The sum of daily volume over the whole level","The midpoint of only the latest candle"]',
 0, 'A simple MA smooths price by averaging closes over a rolling fixed window.'),
('m2-post-5', 'MOD2_POST', 5, 'How does EMA differ from a simple MA?',
 '["EMA weights old data more and reacts slower","EMA weights recent data more and reacts faster","EMA and MA always give identical readings"]',
 1, 'EMA emphasizes recent prices, so it responds faster to trend changes.'),
('m2-post-6', 'MOD2_POST', 6, 'During a fast viral spike and pullback, which indicator usually turns first?',
 '["Simple MA usually turns first","EMA usually turns first","Neither indicator can reflect reversals"]',
 1, 'EMA typically changes direction earlier because recent prices have larger weight.'),
('m3-pre-1', 'MOD3_PRE', 1, 'In a ticking market, what does the spread represent?',
 '["The difference between best ask and best bid","The difference between opening and closing price","The daily high minus low"]',
 0, 'Spread is ask - bid and reflects near-term transaction cost/liquidity.'),
('m3-pre-2', 'MOD3_PRE', 2, 'Why might a limit order be useful while prices are ticking?',
 '["It lets you define a worst acceptable execution price while waiting","It guarantees instant execution at any price","It always fills before market orders"]',
 0, 'Limit orders prioritize price control and can rest while market keeps moving.'),
('m3-pre-3', 'MOD3_PRE', 3, 'What happens when a stop-loss order is triggered?',
 '["It becomes a market order to prioritize exit","It cancels automatically","It converts into a moving average indicator"]',
 0, 'Stop-loss is commonly implemented as stop-market in this game.'),
('m3-pre-4', 'MOD3_PRE', 4, 'How does stop-limit differ from stop-loss?',
 '["Stop-limit adds a limit price after trigger, so fill is not guaranteed","Stop-limit always fills faster than stop-loss","Stop-limit ignores the trigger price"]',
 0, 'Stop-limit provides price control but can remain unfilled in fast moves.'),
('m3-pre-5', 'MOD3_PRE', 5, 'What does Sell Short mean in this game?',
 '["Borrow shares, sell first, then buy back later to close","Sell shares you already own and stay long","Place a stop order that automatically closes a long"]',
 0, 'Shorting opens a liability first: you sell borrowed shares, then buy to cover later.'),
('m3-pre-6', 'MOD3_PRE', 6, 'If you open a short at $100 and cover at $92 (100 shares), ignoring fees your PnL is:',
 '["+$800","-$800","+$8,000"]',
 0, 'Short PnL = (entry - cover) * qty = (100 - 92) * 100 = +800.'),
('m3-pre-7', 'MOD3_PRE', 7, 'What is the main risk unique to a short position?',
 '["Losses can keep growing as price rises","The maximum gain is unlimited","You cannot use limit orders to enter"]',
 0, 'A short loses when price rises; unlike long losses capped at zero price, short loss can keep expanding upward.'),
('m3-pre-8', 'MOD3_PRE', 8, 'Why combine MA/EMA confirmation with short entries in a bearish tape?',
 '["To avoid impulsive entries and reduce squeeze risk","Because indicators guarantee profit","Because shorting works without any timing discipline"]',
 0, 'MA/EMA context helps you wait for better alignment instead of chasing random downticks.'),
('m3-post-1', 'MOD3_POST', 1, 'If best bid is $99.90 and best ask is $100.10, what is the spread?',
 '["$0.20","$0.10","$1.00"]',
 0, 'Spread = ask - bid = 100.10 - 99.90 = 0.20.'),
('m3-post-2', 'MOD3_POST', 2, 'You want to buy only at $50.00 or better while monitoring news. Which order type fits best?',
 '["Limit buy at $50.00","Market buy","Stop-market buy"]',
 0, 'Limit buy controls maximum entry price while you keep observing.'),
('m3-post-3', 'MOD3_POST', 3, 'A long position needs downside protection if price breaks below support. Which order is most direct?',
 '["Sell stop (stop-loss)","Sell limit above market","Buy stop above market"]',
 0, 'A sell stop is the standard protective stop-loss for a long.'),
('m3-post-4', 'MOD3_POST', 4, 'What is the main tradeoff of a stop-limit order?',
 '["Better price control but possible non-fill","Guaranteed fill and best price","No trigger required"]',
 0, 'Stop-limit may not execute if price gaps through limit.'),
('m3-post-5', 'MOD3_POST', 5, 'You Sell Short 80 shares at $210 and later Buy to Cover at $198. Ignoring fees, PnL is:',
 '["+$960","-$960","+$9,600"]',
 0, 'Short PnL = (entry - cover) * qty = (210 - 198) * 80 = +960.'),
('m3-post-6', 'MOD3_POST', 6, 'After opening a short, which order can cap squeeze losses if price rises fast?',
 '["Buy stop or buy stop-limit","Sell limit below market","Do nothing and wait"]',
 0, 'For shorts, protective exits are buy-side conditional orders.'),
('m3-post-7', 'MOD3_POST', 7, 'A short setup bounces above MA while EMA turns up. The more disciplined action is:',
 '["Wait for bearish re-alignment before adding size","Add aggressively because trend must resume immediately","Ignore indicators and keep averaging up the short"]',
 0, 'Waiting for re-alignment helps avoid entering directly into squeeze continuation.'),
('m3-post-8', 'MOD3_POST', 8, 'Which workflow best matches Module 3.5/3.6 shorting discipline?',
 '["Confirm trend context, open short intentionally, manage squeeze risk, then buy to cover","Treat shorting as a mirrored long and ignore borrow/cover mechanics","Use market orders constantly without risk limits"]',
 0, 'Module 3 now expects explicit short lifecycle control plus confirmation-based timing.'),
('m4-pre-1', 'MOD4_PRE', 1, 'If CPI prints above consensus while the prior market was positioned for cooling inflation, what is the most likely immediate reaction?',
 '["Rates usually fall and growth stocks rally immediately","Rates can rise and valuation-sensitive equities may reprice lower","There is no effect because only realized earnings matter"]',
 1, 'Macro reactions depend on surprise versus expectations; hotter inflation can push rate expectations up and pressure duration-sensitive equities.'),
('m4-pre-2', 'MOD4_PRE', 2, 'In a mixed-signal session (hawkish speech, then softer data), what is a disciplined approach?',
 '["Trade every swing aggressively to maximize activity","Wait for cleaner confirmation and keep position size controlled","Ignore new information after your first trade idea"]',
 1, 'When signals conflict, selectivity and controlled sizing usually outperform reactive overtrading.'),
('m4-pre-3', 'MOD4_PRE', 3, 'What does a max drawdown mission primarily test?',
 '["How fast you can place orders","Whether you can cap peak-to-trough equity loss","Whether you can always finish with the highest gross exposure"]',
 1, 'Max drawdown measures downside control over the session, not order speed.'),
('m4-pre-4', 'MOD4_PRE', 4, 'Which behavior best matches uncertainty-first risk management?',
 '["Increase trade count whenever volatility rises","Reduce size, protect downside, and accept flat outcomes when conviction is weak","Hold losing positions until they recover"]',
 1, 'Defensive trading under uncertainty emphasizes capital preservation and flexible positioning.'),
('m4-pre-5', 'MOD4_PRE', 5, 'Why can "no trade" be valid in some macro levels?',
 '["Because inactivity always scores maximum points","Because preserving capital can be better than forcing low-conviction trades","Because mission rules are ignored when volatility is high"]',
 1, 'Some scenarios reward discipline where avoiding avoidable risk is a successful decision.'),
('m4-pre-6', 'MOD4_PRE', 6, 'When headlines alternate between relief and risk-off, what risk is most common?',
 '["Perfect one-direction trend continuation","Whipsaw from chasing late directional moves","Guaranteed fill quality improvement"]',
 1, 'Choppy narrative shifts often punish late momentum chasing and increase whipsaw risk.'),
('m4-post-1', 'MOD4_POST', 1, 'A macro print is better than last month but worse than consensus. Why might equities still sell off?',
 '["Because markets compare data to expectations, not only prior prints","Because positive year-over-year changes force an equity rally","Because consensus is irrelevant once trading starts"]',
 0, 'The surprise component versus consensus often drives immediate repricing.'),
('m4-post-2', 'MOD4_POST', 2, 'You ended flat PnL with low drawdown and low order count in a high-uncertainty level. This outcome is:',
 '["Usually a failure because profit must always be maximized","Potentially a successful defensive result","Invalid because at least one large loss is required"]',
 1, 'In uncertainty-driven missions, disciplined capital preservation can be a correct objective.'),
('m4-post-3', 'MOD4_POST', 3, 'If your max drawdown limit is 2%, what should you do after approaching that threshold?',
 '["Increase size to recover quickly","Tighten risk, reduce activity, and avoid forcing setups","Ignore the threshold because only final PnL matters"]',
 1, 'Drawdown constraints are meant to change behavior before losses compound.'),
('m4-post-4', 'MOD4_POST', 4, 'What is the key tradeoff when reducing total order count in choppy markets?',
 '["Lower transaction churn but potentially fewer opportunities","Guaranteed higher profits every session","No effect on risk-adjusted outcomes"]',
 0, 'Fewer trades can reduce noise-driven mistakes, though it may skip marginal opportunities.'),
('m4-post-5', 'MOD4_POST', 5, 'Which combination best reflects Module 4 discipline?',
 '["Expectation-aware interpretation + selective execution + drawdown control","High-frequency reaction to every headline + maximum leverage","Ignoring macro context and relying only on one indicator"]',
 0, 'Module 4 focuses on expectation-aware macro interpretation and defensive risk management.'),
('m4-post-6', 'MOD4_POST', 6, 'In a shock-rebound-shock sequence, what usually prevents mission failure?',
 '["Adding more trades after each reversal","Position sizing and downside limits that survive both legs","Waiting for guaranteed certainty before every action"]',
 1, 'Robust risk limits and sizing discipline are what persist through multi-leg volatility.'),
('m5-pre-1', 'MOD5_PRE', 1, 'Why is holding many tickers not always true diversification?',
 '["Because all tickers always move independently","Because holdings can still be concentrated in one sector or one risk factor","Because diversification only matters for bonds"]',
 1, 'True diversification depends on risk exposure, not ticker count alone.'),
('m5-pre-2', 'MOD5_PRE', 2, 'Which metric directly captures single-name concentration?',
 '["Largest position weight","Total number of orders","Average bid-ask spread"]',
 0, 'Largest position weight is a direct concentration measure.'),
('m5-pre-3', 'MOD5_PRE', 3, 'What does high pairwise correlation among holdings imply?',
 '["Portfolio risk is automatically low","Holdings may fall together during a theme unwind","Correlation has no effect when there are 5+ positions"]',
 1, 'High correlation means losses can arrive together.'),
('m5-pre-4', 'MOD5_PRE', 4, 'Portfolio beta of 1.4 generally means:',
 '["Portfolio tends to move 40% less than market","Portfolio tends to move 40% more than market","Portfolio has no systematic market exposure"]',
 1, 'Beta above 1 indicates amplified market sensitivity.'),
('m5-pre-5', 'MOD5_PRE', 5, 'Why track rolling portfolio volatility?',
 '["To estimate how unstable returns are over recent ticks","To guarantee next-tick direction","To replace all position sizing decisions"]',
 0, 'Rolling volatility helps manage risk budget and drawdown likelihood.'),
('m5-pre-6', 'MOD5_PRE', 6, 'What is a key purpose of rebalancing?',
 '["Increase concentration in winners indefinitely","Restore target risk exposure after weights drift","Eliminate the need for stop-loss rules"]',
 1, 'Rebalancing brings exposure back in line with risk intent.'),
('m5-pre-7', 'MOD5_PRE', 7, 'Excess return versus benchmark is:',
 '["Portfolio return minus benchmark return","Benchmark return minus portfolio return","Total return divided by number of positions"]',
 0, 'Excess return measures active outperformance over the benchmark.'),
('m5-pre-8', 'MOD5_PRE', 8, 'In a rotation regime, the most robust workflow is:',
 '["Hold previous leaders unchanged","Reassess sector weights and rebalance within a defined window","Trade only the highest-volatility ticker"]',
 1, 'Rotation requires active weight management and timing discipline.'),
('m5-post-1', 'MOD5_POST', 1, 'Your largest position is 58% of invested capital. What is the primary risk?',
 '["Higher diversification quality","Concentration risk from one-name dependency","Lower benchmark tracking error by default"]',
 1, 'A 58% single-name weight is concentrated risk.'),
('m5-post-2', 'MOD5_POST', 2, 'If two sectors each hold 45% weight and move together, the portfolio is:',
 '["Diversified because there are two sectors","Still vulnerable to correlated drawdowns","Immune to benchmark underperformance"]',
 1, 'Sector count alone is insufficient when correlation is high.'),
('m5-post-3', 'MOD5_POST', 3, 'Portfolio return is +3.2% while benchmark is +1.9%. Excess return is:',
 '["+1.3%","-1.3%","+5.1%"]',
 0, 'Excess return = 3.2% - 1.9% = +1.3%.'),
('m5-post-4', 'MOD5_POST', 4, 'A rebalance mission with trigger tick 42 and window 8 means:',
 '["First qualifying rebalance must occur by tick 50","Rebalancing is optional after tick 42","Any trade before tick 42 auto-completes mission"]',
 0, 'The qualifying rebalance must happen within the trigger window.'),
('m5-post-5', 'MOD5_POST', 5, 'When beta is within cap but volatility breaches limit, best interpretation is:',
 '["Systematic sensitivity is controlled but realized swings are still too high","Both market sensitivity and realized swings are controlled","Volatility is irrelevant once beta is capped"]',
 0, 'Beta and volatility capture different dimensions of risk.'),
('m5-post-6', 'MOD5_POST', 6, 'Why can a defensive tagged holding improve mission reliability?',
 '["It can reduce concentration and dampen portfolio swings in stress windows","It guarantees positive PnL every level","It removes the need to monitor sector weight"]',
 0, 'Defensive sleeves can stabilize outcomes when growth themes unwind.'),
('m5-post-7', 'MOD5_POST', 7, 'A portfolio beats benchmark but breaches max single weight mission. The correct conclusion is:',
 '["All passing goals are met because return was higher","Risk-adjusted mandate failed despite alpha","Mission should auto-convert to bonus"]',
 1, 'Module 5 evaluates both outperformance and risk structure.'),
('m5-post-8', 'MOD5_POST', 8, 'What best summarizes Module 5 skill?',
 '["Maximize trade count to capture every swing","Construct and maintain a diversified, risk-budgeted portfolio that outperforms benchmark","Focus only on one high-conviction ticker"]',
 1, 'Portfolio construction combines allocation discipline with benchmark-relative performance.')
ON CONFLICT DO NOTHING;

-- (No seed user_module_quiz_progress; populated at runtime per user.)



