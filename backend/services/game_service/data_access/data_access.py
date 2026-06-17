from typing import Any

from config.database.postgres import get_db_cursor
from services.game_service.models.game import (
    MacroEffectsByTicker,
    NewsByTicker,
    NewsEffectsByTicker,
)


def _build_level_news(
    level_id: str, tick_mode: str
) -> tuple[dict[int, NewsByTicker], dict[int, NewsEffectsByTicker]]:
    # `news`: display payload keyed by display tick -> ticker -> list of articles.
    # This is what the player sees in the UI
    news: dict[int, NewsByTicker] = {}
    # `news_effects`: simulator payload keyed by effect start tick -> ticker -> list of
    # (multiplier, duration) windows. This drives fair-price changes.
    news_effects: dict[int, NewsEffectsByTicker] = {}

    with get_db_cursor() as cursor:
        # fetch visible articles and their display tick.
        cursor.execute(
            """
            SELECT lne.news_event_id, lt.ticker, lne.title, lne.content, lne.start_tick
            FROM level_news_events lne
            JOIN level_news_event_tickers lnet ON lnet.news_event_id = lne.news_event_id
            JOIN level_tickers lt ON lt.level_ticker_id = lnet.level_ticker_id
            WHERE lne.level_id = %s
            ORDER BY lne.start_tick, lne.news_event_id, lt.display_order, lt.level_ticker_id
        """,
            (level_id,),
        )
        for (
            news_event_id,
            ticker,
            title,
            content,
            start_tick,
        ) in cursor.fetchall():
            tick = int(start_tick)
            tick_bucket = news.setdefault(tick, {})
            ticker_bucket = tick_bucket.setdefault(ticker, [])
            # DB-backed payload remains display-oriented; effect windows are loaded from level_news_event_effects.
            ticker_bucket.append((title, content, 0.0, 0))

        # auto/orderbook only: load price-impact windows.
        # Manual/yfinance levels still show news, but do not apply synthetic multiplier windows in the tick loop.
        if tick_mode != "manual":
            cursor.execute(
                """
                SELECT lne.news_event_id, lt.ticker, lnee.multiplier, lnee.start_tick, lnee.end_tick
                FROM level_news_event_effects lnee
                JOIN level_news_events lne ON lne.news_event_id = lnee.news_event_id
                JOIN level_news_event_tickers lnet ON lnet.news_event_id = lne.news_event_id
                JOIN level_tickers lt ON lt.level_ticker_id = lnet.level_ticker_id
                WHERE lne.level_id = %s
                ORDER BY lnee.start_tick, lne.news_event_id, lnee.news_event_effect_id, lt.display_order, lt.level_ticker_id
            """,
                (level_id,),
            )
            for (
                _news_event_id,
                ticker,
                multiplier,
                start_tick,
                end_tick,
            ) in cursor.fetchall():
                duration = end_tick - start_tick + 1
                if duration <= 0:
                    continue
                # Group by effect start tick so engines can pull effects in O(1) for current tick.
                tick_bucket = news_effects.setdefault(start_tick, {})
                ticker_bucket = tick_bucket.setdefault(ticker, [])
                ticker_bucket.append((multiplier, duration))

    return news, news_effects


def _build_level_macro_data(
    level_id: str, tick_mode: str
) -> tuple[list[dict[str, Any]], dict[int, MacroEffectsByTicker]]:
    macro_factors: list[dict[str, Any]] = []
    macro_effects: dict[int, MacroEffectsByTicker] = {}

    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT macro_factor_id, factor_key::text, title, current_value, previous_value,
                   last_change_bps, market_stance_note, display_order
            FROM level_macro_factors
            WHERE level_id = %s
            ORDER BY display_order, macro_factor_id
        """,
            (level_id,),
        )
        for (
            _macro_factor_id,
            factor_key,
            title,
            current_value,
            previous_value,
            last_change_bps,
            market_stance_note,
            display_order,
        ) in cursor.fetchall():
            macro_factors.append(
                {
                    "factor_key": factor_key,
                    "title": title,
                    "current_value": float(current_value),
                    "previous_value": float(previous_value)
                    if previous_value is not None
                    else None,
                    "last_change_bps": int(last_change_bps)
                    if last_change_bps is not None
                    else None,
                    "market_stance_note": market_stance_note or "",
                    "display_order": int(display_order or 1),
                }
            )

        if tick_mode != "manual":
            cursor.execute(
                """
                SELECT lt.ticker,
                       lmfe.multiplier,
                       lmfe.start_tick,
                       lmfe.end_tick,
                       lmfe.title,
                       lmfe.content,
                       lmf.factor_key::text
                FROM level_macro_factor_effects lmfe
                JOIN level_macro_factors lmf
                    ON lmf.macro_factor_id = lmfe.macro_factor_id
                JOIN level_macro_factor_effect_tickers lmfet
                    ON lmfet.macro_factor_effect_id = lmfe.macro_factor_effect_id
                JOIN level_tickers lt
                    ON lt.level_ticker_id = lmfet.level_ticker_id
                WHERE lmf.level_id = %s
                ORDER BY lmfe.start_tick, lmfe.macro_factor_effect_id, lt.display_order, lt.level_ticker_id
            """,
                (level_id,),
            )
            for (
                ticker,
                multiplier,
                start_tick,
                end_tick,
                title,
                content,
                factor_key,
            ) in cursor.fetchall():
                duration = end_tick - start_tick + 1
                if duration <= 0:
                    continue
                tick_bucket = macro_effects.setdefault(start_tick, {})
                ticker_bucket = tick_bucket.setdefault(ticker, [])
                ticker_bucket.append(
                    (float(multiplier), int(duration), title, content, factor_key)
                )

    return macro_factors, macro_effects


def _build_ticker_metadata(level_id: str) -> dict[str, dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT lt.ticker,
                   COALESCE(ltm.company_name, ''),
                   COALESCE(ltm.company_description, ''),
                   COALESCE(ltm.sector_key, 'unknown'),
                   ltm.pe_ratio,
                   ltm.roe_pct,
                   ltm.debt_to_equity,
                   ltm.beta,
                   ltm.volatility_hint,
                   COALESCE(ltm.ticker_tags, '[]'::jsonb)
            FROM level_tickers lt
            LEFT JOIN level_ticker_metadata ltm
              ON ltm.level_ticker_id = lt.level_ticker_id
            WHERE lt.level_id = %s
            ORDER BY lt.display_order, lt.level_ticker_id
            """,
            (level_id,),
        )
        rows = cursor.fetchall()

    payload: dict[str, dict[str, Any]] = {}
    for (
        ticker,
        company_name,
        company_description,
        sector_key,
        pe_ratio,
        roe_pct,
        debt_to_equity,
        beta,
        volatility_hint,
        ticker_tags,
    ) in rows:
        parsed_tags = [
            str(tag).strip()
            for tag in (ticker_tags or [])
            if isinstance(tag, str) and str(tag).strip()
        ]
        payload[ticker] = {
            "company_name": company_name or "",
            "company_description": company_description or "",
            "sector_key": sector_key or "unknown",
            "pe_ratio": float(pe_ratio) if pe_ratio is not None else None,
            "roe_pct": float(roe_pct) if roe_pct is not None else None,
            "debt_to_equity": float(debt_to_equity)
            if debt_to_equity is not None
            else None,
            "beta": float(beta) if beta is not None else None,
            "volatility_hint": float(volatility_hint)
            if volatility_hint is not None
            else None,
            "ticker_tags": parsed_tags,
        }
    return payload


def _build_reference_portfolios(level_id: str) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT lrp.reference_key,
                   lrp.reference_role,
                   lrp.title,
                   lrp.description,
                   lrp.display_order,
                   lt.ticker,
                   lrpc.weight,
                   lrpc.display_order
            FROM level_reference_portfolios lrp
            LEFT JOIN level_reference_portfolio_components lrpc
              ON lrpc.reference_portfolio_id = lrp.reference_portfolio_id
            LEFT JOIN level_tickers lt
              ON lt.level_ticker_id = lrpc.level_ticker_id
            WHERE lrp.level_id = %s
            ORDER BY lrp.display_order, lrp.reference_portfolio_id,
                     lrpc.display_order, lrpc.reference_component_id
            """,
            (level_id,),
        )
        rows = cursor.fetchall()

    grouped: dict[tuple[str, str], dict[str, Any]] = {}
    for (
        reference_key,
        reference_role,
        title,
        description,
        portfolio_display_order,
        ticker,
        weight,
        component_display_order,
    ) in rows:
        bucket_key = (reference_key, reference_role)
        entry = grouped.get(bucket_key)
        if entry is None:
            entry = {
                "reference_key": reference_key,
                "reference_role": reference_role,
                "title": title,
                "description": description or "",
                "display_order": int(portfolio_display_order or 1),
                "components": [],
            }
            grouped[bucket_key] = entry
        if ticker is None or weight is None:
            continue
        entry["components"].append(
            {
                "ticker": ticker,
                "weight": float(weight),
                "display_order": int(component_display_order or 1),
            }
        )

    references = list(grouped.values())
    references.sort(key=lambda item: (item["display_order"], item["reference_key"]))
    for item in references:
        item["components"].sort(
            key=lambda component: (component["display_order"], component["ticker"])
        )
    return references


def _build_available_tools(level_id: str) -> dict[str, bool]:
    tools = {
        "news": False,
        "market_order": False,
        "short_selling": False,
        "limit_order": False,
        "stop_order": False,
        "stop_limit_order": False,
        "bid_ask_spread": False,
        "moving_average": False,
        "exponential_moving_average": False,
        "interest_rate_panel": False,
        "inflation_panel": False,
        "drawdown_panel": False,
        "portfolio_allocation_panel": False,
        "sector_exposure_panel": False,
        "fundamentals_panel": False,
        "correlation_panel": False,
        "beta_volatility_panel": False,
        "benchmark_panel": False,
        "rebalancing_prompt": False,
    }
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT td.tool_key, lta.enabled
            FROM level_tool_availability lta
            JOIN tool_definitions td ON td.tool_id = lta.tool_id
            WHERE lta.level_id = %s
        """,
            (level_id,),
        )
        for tool_key, enabled in cursor.fetchall():
            tools[tool_key] = bool(enabled)
    return tools


def _build_unlocks(level_id: str) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT td.tool_key, lu.title, lu.description, td.tool_tutorial_id
            FROM level_unlocks lu
            JOIN tool_definitions td ON td.tool_id = lu.tool_id
            WHERE lu.source_level_id = %s
            ORDER BY lu.level_unlock_id
        """,
            (level_id,),
        )
        rows = cursor.fetchall()
    return [
        {
            "feature": tool_key,
            "title": title,
            "description": description,
            "tool_tutorial_id": tool_tutorial_id,
        }
        for tool_key, title, description, tool_tutorial_id in rows
    ]


def _build_missions(
    level_id: str, passing_criteria_type: str
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT mission_key, mission_group, mission_type, title, description, points,
                   mission_params
            FROM level_missions
            WHERE level_id = %s
            ORDER BY display_order, level_mission_id
        """,
            (level_id,),
        )
        rows = cursor.fetchall()

    passing_missions: list[dict[str, Any]] = []
    bonus_missions: list[dict[str, Any]] = []
    for (
        mission_key,
        mission_group,
        mission_type,
        title,
        description,
        points,
        mission_params,
    ) in rows:
        payload = {
            "id": mission_key,
            "type": mission_type,
            "title": title,
            "description": description,
            "points": int(points or 0),
            "mission_params": dict(mission_params or {}),
        }
        if mission_group == "passing":
            passing_missions.append(payload)
        else:
            bonus_missions.append(payload)

    return {
        "type": passing_criteria_type,
        "missions": passing_missions,
    }, bonus_missions


def _get_level(level_id: str, expected_level_type: str) -> dict[str, Any] | None:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT level_id, level_type, title, module, level_order, context, tick_mode,
                   manual_start, level_tutorial_id, total_ticks, preloaded_ticks, auto_tick_interval_seconds,
                   starting_cash, final_cash_points_multiplier, passing_criteria_type
            FROM levels
            WHERE level_id = %s AND level_type = %s
        """,
            (level_id, expected_level_type),
        )
        row = cursor.fetchone()
        if row is None:
            return None

        (
            db_level_id,
            db_level_type,
            _title,
            _module,
            _level_order,
            context,
            tick_mode,
            manual_start,
            level_tutorial_id,
            total_ticks,
            preloaded_ticks,
            auto_tick_interval_seconds,
            starting_cash,
            final_cash_points_multiplier,
            passing_criteria_type,
        ) = row

        cursor.execute(
            """
            SELECT level_ticker_id, ticker, simulator_type,
                   history_start_date::text, history_end_date::text, history_interval,
                   initial_fair_price, base_volume, volatility, has_npc_orders, rng_seed,
                   starting_position_qty, starting_position_cost_basis
            FROM level_tickers
            WHERE level_id = %s
            ORDER BY display_order, level_ticker_id
        """,
            (level_id,),
        )
        ticker_rows = cursor.fetchall()

    starting_tickers = [ticker for _, ticker, *_ in ticker_rows]
    primary_ticker_row = ticker_rows[0] if ticker_rows else None
    starting_positions: dict[str, dict[str, Any]] = {}
    ticker_metadata = _build_ticker_metadata(level_id)
    reference_portfolios = _build_reference_portfolios(level_id)

    start_date = "1970-01-01"
    end_date = "1970-01-01"
    interval = "1d"
    if primary_ticker_row is not None:
        (
            _lt_id,
            _ticker,
            simulator_type,
            history_start_date,
            history_end_date,
            history_interval,
            *_rest,
        ) = primary_ticker_row
        if history_start_date:
            start_date = history_start_date
        if history_end_date:
            end_date = history_end_date
        if simulator_type == "yfinance" and history_interval:
            interval = history_interval

    if tick_mode == "auto":
        interval = str(auto_tick_interval_seconds or 1)

    news, news_effects = _build_level_news(level_id=level_id, tick_mode=tick_mode)
    macro_factors, macro_effects = _build_level_macro_data(
        level_id=level_id, tick_mode=tick_mode
    )
    passing_criteria, bonus_missions = _build_missions(
        level_id=level_id,
        passing_criteria_type=passing_criteria_type or "all_of",
    )

    ticker_configs: list[dict[str, Any]] = []
    for (
        _lt_id,
        ticker,
        simulator_type,
        history_start_date,
        history_end_date,
        history_interval,
        initial_fair_price,
        base_volume,
        volatility,
        has_npc_orders,
        rng_seed,
        starting_position_qty,
        starting_position_cost_basis,
    ) in ticker_rows:
        qty = int(starting_position_qty or 0)
        if qty > 0:
            starting_positions[ticker] = {
                "qty": qty,
                "cost_basis": float(starting_position_cost_basis),
            }
        ticker_configs.append(
            {
                "ticker": ticker,
                "simulator_type": simulator_type,
                "history_start_date": history_start_date,
                "history_end_date": history_end_date,
                "history_interval": history_interval,
                "initial_fair_price": float(initial_fair_price)
                if initial_fair_price is not None
                else None,
                "base_volume": base_volume,
                "volatility": float(volatility) if volatility is not None else None,
                "has_npc_orders": has_npc_orders,
                "rng_seed": rng_seed,
            }
        )

    return {
        "level_id": db_level_id,
        "level_type": db_level_type,
        "tick_mode": tick_mode,
        "manual_start": bool(manual_start),
        "auto_tick_interval_seconds": auto_tick_interval_seconds,
        # Legacy-compatible runtime fields currently used by the engine.
        "start_date": start_date,
        "end_date": end_date,
        "interval": interval,
        "total_ticks": int(total_ticks),
        "preloaded_ticks": int(preloaded_ticks or 0),
        "news": news,
        "news_effects": news_effects,
        "macro_factors": macro_factors,
        "macro_effects": macro_effects,
        "starting_tickers": starting_tickers,
        "starting_positions": starting_positions,
        "ticker_metadata": ticker_metadata,
        "reference_portfolios": reference_portfolios,
        "starting_cash": float(starting_cash),
        "context": context or "",
        "level_tutorial_id": level_tutorial_id,
        "is_manual_tick": tick_mode == "manual",
        "final_cash_points_multiplier": float(final_cash_points_multiplier or 0),
        "passing_criteria": passing_criteria,
        "bonus_missions": bonus_missions,
        "unlocks": _build_unlocks(level_id),
        "available_tools": _build_available_tools(level_id),
        # New normalized structure for future engine refactor.
        "ticker_configs": ticker_configs,
    }


def get_tutorial_level(tutorial_id: str) -> dict[str, Any] | None:
    return _get_level(level_id=tutorial_id, expected_level_type="tutorial")


def update_tutorial_status(
    tutorial_id: str,
    completed: bool,
    stars: int,
    score: int,
    user_id: str,
):
    _ = stars  # Deprecated and intentionally ignored.

    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            """
        INSERT INTO user_level_progress (user_id, level_id, best_points, attempted, completed, attempts, last_attempted)
        VALUES (%s, %s, %s, true, %s, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, level_id) DO UPDATE SET
            best_points = CASE WHEN excluded.best_points > user_level_progress.best_points
                          THEN excluded.best_points
                          ELSE user_level_progress.best_points
                     END,
            attempted = true,
            completed = CASE
                            WHEN user_level_progress.completed = true THEN true
                            ELSE excluded.completed
                        END,
            attempts = user_level_progress.attempts + 1,
            last_attempted = CURRENT_TIMESTAMP
        """,
            (user_id, tutorial_id, score, completed),
        )
        cursor.execute(
            """
                SELECT module, level_order
                FROM levels
                WHERE level_id = %s AND level_type = 'tutorial'
            """,
            (tutorial_id,),
        )
        row = cursor.fetchone()

        # Return if not completed or there is no such row.
        if not row or not completed:
            return

        module, level_order = row

        cursor.execute(
            """
            SELECT level_id
            FROM levels
            WHERE level_type = 'tutorial' AND module = %s AND level_order = %s
        """,
            (module, level_order + 1),
        )
        next_level = cursor.fetchone()

        if next_level:
            next_tutorial_id = next_level[0]
            cursor.execute(
                """
            INSERT INTO user_level_progress (user_id, level_id, best_points, attempted, completed, attempts, last_attempted)
            VALUES (%s, %s, 0, false, false, 0, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, level_id) DO NOTHING
            """,
                (user_id, next_tutorial_id),
            )


def get_available_levels(user_id: str) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT l.level_id, l.title, l.level_order, l.module,
                   ulp.best_points, ulp.attempted, ulp.completed
            FROM levels l
            LEFT JOIN user_level_progress ulp
                   ON l.level_id = ulp.level_id AND ulp.user_id = %s
            WHERE l.level_type = 'tutorial'
            ORDER BY l.module, l.level_order
        """,
            (user_id,),
        )

        levels = []
        columns = [desc[0] for desc in cursor.description]
        for row in cursor.fetchall():
            row_dict = dict(zip(columns, row))
            row_dict["available"] = (
                True if row_dict.get("attempted") is not None else False
            )
            row_dict["attempted"] = bool(row_dict.get("attempted"))
            row_dict["completed"] = bool(row_dict.get("completed"))
            row_dict["progress"] = {}
            # Keep compatibility key expected by existing FE/API clients.
            row_dict["tutorial_id"] = row_dict["level_id"]
            levels.append(row_dict)
        return levels


# Puzzle mode is gated on completing the final tutorial of module 1. Until the
# user has a `user_level_progress` row for PUZZLE_UNLOCK_GATE_LEVEL_ID with
# `completed = true`, all puzzle levels surface as `available = false`. The
# product motivation: puzzles assume mechanics taught across module 1, so we
# don't dangle them in front of users who haven't been through the tutorials.
PUZZLE_UNLOCK_GATE_LEVEL_ID = "module-1.4"


def get_available_puzzle_levels(user_id: str) -> list[dict[str, Any]]:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT l.level_id, l.title, l.level_order,
                   ulp.best_points, ulp.attempted,
                   COALESCE(gate.completed, false) AS puzzle_unlocked
            FROM levels l
            LEFT JOIN user_level_progress ulp
                   ON l.level_id = ulp.level_id AND ulp.user_id = %s
            LEFT JOIN user_level_progress gate
                   ON gate.level_id = %s AND gate.user_id = %s
            WHERE l.level_type = 'puzzle'
            ORDER BY l.level_order
            """,
            (user_id, PUZZLE_UNLOCK_GATE_LEVEL_ID, user_id),
        )
        rows = cursor.fetchall()
        levels = []
        if rows is None:
            return []

        columns = [desc[0] for desc in cursor.description]
        for row in rows:
            row_dict = dict(zip(columns, row))
            # Gate trumps everything: even if a puzzle row exists from a prior
            # state, the user must have cleared module-1.4 to see puzzles.
            row_dict["available"] = bool(row_dict.pop("puzzle_unlocked"))
            row_dict["attempted"] = bool(row_dict.get("attempted"))
            row_dict["progress"] = {}
            row_dict["puzzle_id"] = row_dict["level_id"]
            levels.append(row_dict)
        return levels


def is_level_available_for_user(user_id: str, level_id: str) -> bool:
    """Single-level access gate. Source of truth for who can play what.

    Mirrors the row-shape produced by :func:`get_available_levels` /
    :func:`get_available_puzzle_levels`, but does it in one round-trip
    against a known level_id — used by the single-player WS handler
    before it instantiates :class:`SinglePlayerGameEngine`, so a client
    that types a locked URL into the address bar gets rejected
    server-side regardless of frontend behavior.

    - Tutorial levels: available iff the user has a `user_level_progress`
      row for the level. New rows are inserted on completion of the
      prior level by :func:`update_tutorial_status` (see lines ~592-627);
      the auto-enrolled `module-1.1` row from `create_user` is the
      starting case.
    - Puzzle levels: gated globally on ``PUZZLE_UNLOCK_GATE_LEVEL_ID``
      being ``completed = true`` (the rule PR 5 added). Once the gate
      passes, every puzzle is reachable.

    Returns False for unknown level_ids (defensive — a forged client
    can't trick the engine into running an arbitrary level just by
    passing a typo).
    """
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT l.level_type::text,
                   ulp.attempted IS NOT NULL AS has_progress_row,
                   COALESCE(gate.completed, false) AS puzzle_unlocked
            FROM levels l
            LEFT JOIN user_level_progress ulp
                   ON ulp.level_id = l.level_id AND ulp.user_id = %s
            LEFT JOIN user_level_progress gate
                   ON gate.level_id = %s AND gate.user_id = %s
            WHERE l.level_id = %s
            """,
            (user_id, PUZZLE_UNLOCK_GATE_LEVEL_ID, user_id, level_id),
        )
        row = cursor.fetchone()
        if row is None:
            return False
        level_type, has_progress_row, puzzle_unlocked = row
        if level_type == "tutorial":
            return bool(has_progress_row)
        if level_type == "puzzle":
            return bool(puzzle_unlocked)
        return False


def get_leaderboard(tutorial_id: str):
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT u.user_id, u.user_name, ulp.best_points
            FROM user_level_progress ulp
            JOIN users u ON u.user_id = ulp.user_id
            WHERE ulp.level_id = %s AND ulp.completed = true
            ORDER BY ulp.best_points DESC
            LIMIT 10
            """,
            (tutorial_id,),
        )
        cols = [d[0] for d in cursor.description]
        return [dict(zip(cols, row)) for row in cursor.fetchall()]


# =====================
# Puzzle-specific APIs
# =====================
def get_puzzle_level(puzzle_id: str) -> dict[str, Any] | None:
    return _get_level(level_id=puzzle_id, expected_level_type="puzzle")


#
# RESUME LOGIC - NOT BEING USED
#
def save_user_tutorial_progress(user_id: str, tutorial_id: str, progress: dict):
    _ = progress
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            """
            INSERT INTO user_level_progress (user_id, level_id, attempted, completed, best_points, attempts, last_attempted)
            VALUES (%s, %s, true, false, 0, 0, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, level_id) DO UPDATE SET
                attempted = true,
                last_attempted = CURRENT_TIMESTAMP
            """,
            (user_id, tutorial_id),
        )


def get_user_tutorial_progress(user_id: str, tutorial_id: str) -> dict:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
        SELECT attempted, completed, best_points, attempts, last_attempted
        FROM user_level_progress
        WHERE user_id = %s AND level_id = %s
        """,
            (user_id, tutorial_id),
        )

        row = cursor.fetchone()
        if row is None:
            return {}

        columns = [desc[0] for desc in cursor.description]
        return dict(zip(columns, row))


def save_user_puzzle_progress(user_id: str, puzzle_id: str, progress: dict):
    _ = progress
    with get_db_cursor(commit=True) as cursor:
        cursor.execute(
            """
            INSERT INTO user_level_progress (user_id, level_id, attempted, completed, best_points, attempts, last_attempted)
            VALUES (%s, %s, true, false, 0, 0, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, level_id) DO UPDATE SET
                attempted = true,
                last_attempted = CURRENT_TIMESTAMP
            """,
            (user_id, puzzle_id),
        )


def get_user_puzzle_progress(user_id: str, puzzle_id: str) -> dict:
    with get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT attempted, completed, best_points, attempts, last_attempted
            FROM user_level_progress
            WHERE user_id = %s AND level_id = %s
            """,
            (user_id, puzzle_id),
        )
        row = cursor.fetchone()
        if row is None:
            return {}

        columns = [desc[0] for desc in cursor.description]
        return dict(zip(columns, row))
