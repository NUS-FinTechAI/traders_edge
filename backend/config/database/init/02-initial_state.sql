-- ======================================
-- Populate fake users
-- ======================================
INSERT INTO users (user_id, user_name, user_email) VALUES
('mingyuanc', 'Ming Yuan', 'mingyuan.c@u.nus.edu')
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate fake tutorial levels
-- ======================================
INSERT INTO tutorial_levels (tutorial_id, title, level_order, module, metadata) VALUES
('module-1.1', 'Intro to Trader Edge', 1, 1, '{"start_date":"2025-01-02","end_date":"2025-01-10","news":{},"starting_tickers":["AAPL"],"final_cash_points_multiplier":0.1,"passing_criteria":{"type":"all_of","missions":[{"id":"pnl_non_negative","type":"pnl_at_end","min_pnl":0,"title":"Finish with non-negative PnL","description":"End the level with at least $0 PnL.","points":100}]},"bonus_missions":[{"id":"use_market_order_once","type":"use_order_type","order_type":"market","min_count":1,"title":"Use a market order","description":"Place at least one market order.","points":50},{"id":"max_loss_500","type":"pnl_at_end","min_pnl":-500,"title":"Do not lose more than $500","description":"Keep your final PnL above -$500.","points":50}],"available_tools":{"news":false,"market_order":true,"limit_order":false},"unlocks":[{"feature":"market_order","title":"Market Orders Unlocked","description":"You can now place market orders for immediate execution.","tutorial_id":"module-1.1"}]}'),
('module-1.2', 'Buy Low, Sell High', 2, 1, '{"start_date":"2025-09-29","end_date":"2025-10-10","news":{},"context":"(Hint) The fair price for apple stock is $256.7","starting_tickers":["AAPL"],"final_cash_points_multiplier":0.1,"passing_criteria":{"type":"all_of","missions":[{"id":"pnl_non_negative","type":"pnl_at_end","min_pnl":0,"title":"Finish with non-negative PnL","description":"End the level with at least $0 PnL.","points":100}]},"bonus_missions":[{"id":"use_market_order_once","type":"use_order_type","order_type":"market","min_count":1,"title":"Use a market order","description":"Place at least one market order.","points":50},{"id":"max_loss_500","type":"pnl_at_end","min_pnl":-500,"title":"Do not lose more than $500","description":"Keep your final PnL above -$500.","points":50}],"available_tools":{"news":false,"market_order":true,"limit_order":false},"unlocks":[]}'),
('module-1.3', 'Earnings Pt 1', 3, 1, '{"start_date":"2025-06-23","end_date":"2025-07-04","news":{},"starting_tickers":["AAPL"],"final_cash_points_multiplier":0.1,"passing_criteria":{"type":"all_of","missions":[{"id":"pnl_non_negative","type":"pnl_at_end","min_pnl":0,"title":"Finish with non-negative PnL","description":"End the level with at least $0 PnL.","points":100}]},"bonus_missions":[{"id":"use_market_order_once","type":"use_order_type","order_type":"market","min_count":1,"title":"Use a market order","description":"Place at least one market order.","points":50},{"id":"max_loss_500","type":"pnl_at_end","min_pnl":-500,"title":"Do not lose more than $500","description":"Keep your final PnL above -$500.","points":50}],"available_tools":{"news":false,"market_order":true,"limit_order":false},"unlocks":[]}'),
('module-1.4', 'Earnings Pt 2', 4, 1, '{"start_date":"2025-10-10","end_date":"2025-10-24","news":{},"context":"PGR, Corporation is an American insurance company. Progressive is currently the #2 auto insurer in the United States behind State Farm. Earnings is on 15 OCT","starting_tickers":["PGR"],"final_cash_points_multiplier":0.1,"passing_criteria":{"type":"all_of","missions":[{"id":"pnl_non_negative","type":"pnl_at_end","min_pnl":0,"title":"Finish with non-negative PnL","description":"End the level with at least $0 PnL.","points":100}]},"bonus_missions":[{"id":"use_market_order_once","type":"use_order_type","order_type":"market","min_count":1,"title":"Use a market order","description":"Place at least one market order.","points":50},{"id":"max_loss_500","type":"pnl_at_end","min_pnl":-500,"title":"Do not lose more than $500","description":"Keep your final PnL above -$500.","points":50}],"available_tools":{"news":false,"market_order":true,"limit_order":false},"unlocks":[]}'),
('module-1.5', 'Module 1 recap', 5, 1, '{"start_date":"2025-07-21","end_date":"2025-08-22","news":{},"context":"DAL, DELTA is one of americas largest commercial airlines. Delta has earning on 9 Aug and if it beats earnings, analyst predicts the fair price would be around 59 dollar","starting_tickers":["DAL"],"final_cash_points_multiplier":0.1,"passing_criteria":{"type":"all_of","missions":[{"id":"pnl_non_negative","type":"pnl_at_end","min_pnl":0,"title":"Finish with non-negative PnL","description":"End the level with at least $0 PnL.","points":100}]},"bonus_missions":[{"id":"use_market_order_once","type":"use_order_type","order_type":"market","min_count":1,"title":"Use a market order","description":"Place at least one market order.","points":50},{"id":"max_loss_500","type":"pnl_at_end","min_pnl":-500,"title":"Do not lose more than $500","description":"Keep your final PnL above -$500.","points":50}],"available_tools":{"news":false,"market_order":true,"limit_order":false},"unlocks":[]}'),
('module-2.1', 'Module 2 Intro', 1, 2, '{"start_date":"2025-03-03","end_date":"2025-03-17","news":{},"starting_tickers":["MSFT"],"final_cash_points_multiplier":0.1,"passing_criteria":{"type":"all_of","missions":[{"id":"pnl_non_negative","type":"pnl_at_end","min_pnl":0,"title":"Finish with non-negative PnL","description":"End the level with at least $0 PnL.","points":100}]},"bonus_missions":[{"id":"use_market_order_once","type":"use_order_type","order_type":"market","min_count":1,"title":"Use a market order","description":"Place at least one market order.","points":50},{"id":"max_loss_500","type":"pnl_at_end","min_pnl":-500,"title":"Do not lose more than $500","description":"Keep your final PnL above -$500.","points":50}],"available_tools":{"news":true,"market_order":true,"limit_order":false},"unlocks":[]}'),
('module-2.2', 'Reading the News', 2, 2, '{"start_date":"2025-04-01","end_date":"2025-04-15","news":{"4":{"MSFT":["Regulatory update on enterprise AI rollouts"]}},"starting_tickers":["MSFT"],"final_cash_points_multiplier":0.1,"passing_criteria":{"type":"all_of","missions":[{"id":"pnl_non_negative","type":"pnl_at_end","min_pnl":0,"title":"Finish with non-negative PnL","description":"End the level with at least $0 PnL.","points":100}]},"bonus_missions":[{"id":"use_market_order_once","type":"use_order_type","order_type":"market","min_count":1,"title":"Use a market order","description":"Place at least one market order.","points":50},{"id":"max_loss_500","type":"pnl_at_end","min_pnl":-500,"title":"Do not lose more than $500","description":"Keep your final PnL above -$500.","points":50}],"available_tools":{"news":true,"market_order":true,"limit_order":false},"unlocks":[{"feature":"news","title":"News Feed Unlocked","description":"You can now view scheduled news events during levels.","tutorial_id":"module-2.2"}]}')
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate fake tutorial progress
-- ======================================
INSERT INTO user_tutorial_progress (user_id, tutorial_id) VALUES
('mingyuanc', 'module-1.1')
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate fake puzzle levels
-- ======================================
INSERT INTO puzzle_levels (puzzle_id, title, level_order, metadata) VALUES
('puzzle-1.1', 'Asian Financial Crisis', 1, '{"start_date": "1997-07-01","end_date": "1997-10-31","news": {"1997-07-02": {"TM": ["Thai baht devaluation sparks regional turmoil"]},"1997-08-14": {"TM": ["Contagion concerns weigh on Japanese exporters"]}}, "context": "Regional currency devaluations in 1997 trigger capital flight, yen volatility, and export demand risk; assess Toyota sensitivity to Asia turmoil.", "starting_tickers": ["TM"]}'),
('puzzle-1.2', 'Coronavirus Crash', 2, '{"start_date": "2020-02-15","end_date": "2020-06-15","news": {"2020-03-09": {"CCL": ["Italy locks down; travel demand collapses"]},"2020-03-11": {"CCL": ["WHO declares pandemic"]},"2020-03-14": {"CCL": ["CDC issues no-sail order for cruise ships"]}}, "context": "Early 2020 pandemic drives lockdowns, travel bans, and a no sail order; evaluate the severe revenue shock to cruise lines.", "starting_tickers": ["CCL"]}')
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate fake puzzle progress
-- ======================================
INSERT INTO user_puzzle_progress (user_id, puzzle_id) VALUES
('mingyuanc', 'puzzle-1.1')
ON CONFLICT DO NOTHING;

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
('achievement-unlock-endless', 'Unlock Endless Mode', 'Earn all stars in Adventure Mode.', 'Endless Mode unlocked: trade without limits.', 'Infinity')
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate user achievements
-- ======================================
INSERT INTO user_achievements (user_id, achievement_id) VALUES
('mingyuanc', 'achievement-first-level')
ON CONFLICT DO NOTHING;

-- ======================================
-- Populate user activity events
-- ======================================
INSERT INTO user_activity_events (user_id, event_type, event_date, metadata) VALUES
('mingyuanc', 'level_completed', '2025-10-30', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-10-30', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-10-30', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-02', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-04', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-07', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-07', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-07', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-07', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-10', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-12', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-12', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-12', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-15', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-18', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-21', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-24', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-27', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-11-30', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-02', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-05', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-07', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-10', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-12', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-14', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-17', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-19', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-22', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-24', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-26', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-28', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-30', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-30', '{}'::jsonb),
('mingyuanc', 'level_completed', '2025-12-30', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-02', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-04', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-06', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-08', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-10', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-12', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-15', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-18', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-20', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-22', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-25', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-25', '{}'::jsonb),
('mingyuanc', 'level_completed', '2026-01-27', '{}'::jsonb)
ON CONFLICT DO NOTHING;


-- ======================================
-- Populate module 1 quizzes (pre/post)
-- ======================================
INSERT INTO module_quizzes (quiz_id, module, quiz_type, title, description, passing_score) VALUES
('MOD1_PRE', 1, 'pre', 'Module 1 Pre-Quiz', 'Check your baseline knowledge before Module 1.', 0),
('MOD1_POST', 1, 'post', 'Module 1 Post-Quiz', 'Assess what you learned after Module 1.', 0)
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
('m1-pre-1', 'MOD1_PRE', 1, 'What does a stock ticker represent?',
 '["The company''s trading symbol on an exchange","The total number of shares a company has","A company''s annual revenue"]',
 0, 'A ticker is the short trading symbol used to identify a company on an exchange.'),
('m1-pre-2', 'MOD1_PRE', 2, 'Which order type executes immediately at the best available price?',
 '["Market order","Limit order","Stop order"]',
 0, 'Market orders execute right away at the best available price.'),
('m1-pre-3', 'MOD1_PRE', 3, 'A limit buy order will only execute when the price is:',
 '["At or below your limit price","At or above your limit price","Exactly the last close price"]',
 0, 'Limit buys only fill at your limit price or better (lower).'),
('m1-pre-4', 'MOD1_PRE', 4, 'Reserved cash represents:',
 '["Cash held for open orders","Cash already spent on filled orders","Cash earned from dividends"]',
 0, 'Reserved cash is held to cover open orders and is not available for new trades.'),
('m1-post-1', 'MOD1_POST', 1, 'What does a stock ticker represent?',
 '["The company''s trading symbol on an exchange","The total number of shares a company has","A company''s annual revenue"]',
 0, 'A ticker is the short trading symbol used to identify a company on an exchange.'),
('m1-post-2', 'MOD1_POST', 2, 'Which order type executes immediately at the best available price?',
 '["Market order","Limit order","Stop order"]',
 0, 'Market orders execute right away at the best available price.'),
('m1-post-3', 'MOD1_POST', 3, 'A limit buy order will only execute when the price is:',
 '["At or below your limit price","At or above your limit price","Exactly the last close price"]',
 0, 'Limit buys only fill at your limit price or better (lower).'),
('m1-post-4', 'MOD1_POST', 4, 'Reserved cash represents:',
 '["Cash held for open orders","Cash already spent on filled orders","Cash earned from dividends"]',
 0, 'Reserved cash is held to cover open orders and is not available for new trades.')
ON CONFLICT DO NOTHING;
