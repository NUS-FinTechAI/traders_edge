from datetime import date, timedelta

import pytest
from common import Order
from services.game_service.models.game import Position, TutorialMissionCriteriaModel, TutorialMissionModel
from services.game_service.service.single_player_engine import SinglePlayerGameEngine
from utils.constants import Direction, OrderType, OrderAction

pytestmark = pytest.mark.asyncio


class _MutablePriceSimulator:
    def __init__(self, price: float):
        self.price = float(price)

    def best_bid(self) -> float:
        return self.price

    def best_ask(self) -> float:
        return self.price

    def next_tick(self, _changes):
        return {
            "open": self.price,
            "high": self.price,
            "low": self.price,
            "close": self.price,
        }


@pytest.fixture
def module5_data_access(monkeypatch):
    def mock_get_tutorial_level(level_id: str):
        return {
            "level_id": level_id,
            "level_type": "tutorial",
            "tick_mode": "auto",
            "manual_start": True,
            "auto_tick_interval_seconds": 60,
            "starting_cash": 0.0,
            "final_cash_points_multiplier": 0.0,
            "start_date": (date.today() - timedelta(days=30)).isoformat(),
            "end_date": date.today().isoformat(),
            "total_ticks": 120,
            "preloaded_ticks": 0,
            "starting_tickers": ["AAPL", "MSFT"],
            "starting_positions": {
                "AAPL": {"qty": 20, "cost_basis": 100.0},
                "MSFT": {"qty": 30, "cost_basis": 100.0},
            },
            "ticker_metadata": {
                "AAPL": {
                    "company_name": "Apple Inc.",
                    "sector_key": "technology",
                    "pe_ratio": 30.0,
                    "roe_pct": 45.0,
                    "debt_to_equity": 1.7,
                    "beta": 1.2,
                    "volatility_hint": 0.018,
                    "ticker_tags": ["defensive", "quality"],
                },
                "MSFT": {
                    "company_name": "Microsoft Corporation",
                    "sector_key": "healthcare",
                    "pe_ratio": 34.0,
                    "roe_pct": 39.0,
                    "debt_to_equity": 0.4,
                    "beta": 0.8,
                    "volatility_hint": 0.014,
                    "ticker_tags": ["quality"],
                },
            },
            "reference_portfolios": [
                {
                    "reference_key": "core_equal_weight",
                    "reference_role": "benchmark",
                    "title": "Core Equal Weight Benchmark",
                    "description": "",
                    "display_order": 1,
                    "components": [
                        {"ticker": "AAPL", "weight": 0.5, "display_order": 1},
                        {"ticker": "MSFT", "weight": 0.5, "display_order": 2},
                    ],
                }
            ],
            "is_manual_tick": False,
            "news": {},
            "news_effects": {},
            "macro_factors": [],
            "macro_effects": {},
            "context": "Module 5 test level",
            "passing_criteria": {"type": "all_of", "missions": []},
            "bonus_missions": [],
            "unlocks": [],
            "available_tools": {
                "news": True,
                "market_order": True,
                "limit_order": True,
                "stop_order": True,
                "stop_limit_order": True,
                "bid_ask_spread": True,
                "moving_average": True,
                "exponential_moving_average": True,
                "interest_rate_panel": False,
                "inflation_panel": False,
                "drawdown_panel": True,
                "portfolio_allocation_panel": True,
                "sector_exposure_panel": True,
                "fundamentals_panel": True,
                "correlation_panel": True,
                "beta_volatility_panel": True,
                "benchmark_panel": True,
                "rebalancing_prompt": True,
            },
            "ticker_configs": [
                {
                    "ticker": "AAPL",
                    "simulator_type": "orderbook",
                    "initial_fair_price": 100.0,
                    "base_volume": 10,
                    "volatility": 10,
                    "has_npc_orders": False,
                    "rng_seed": 42,
                },
                {
                    "ticker": "MSFT",
                    "simulator_type": "orderbook",
                    "initial_fair_price": 100.0,
                    "base_volume": 10,
                    "volatility": 10,
                    "has_npc_orders": False,
                    "rng_seed": 43,
                },
            ],
        }

    monkeypatch.setattr(
        "services.game_service.service.single_player_engine.da.get_tutorial_level",
        mock_get_tutorial_level,
    )
    monkeypatch.setattr(
        "services.game_service.service.single_player_engine.da.update_tutorial_status",
        lambda *args, **kwargs: None,
    )


async def test_get_fe_game_state_exposes_portfolio_analytics(module5_data_access):
    engine = SinglePlayerGameEngine(
        user_id="user1", level_id="module-5.2", manual_tick_override=False
    )
    engine.ticker_to_simulator["AAPL"] = _MutablePriceSimulator(100.0)
    engine.ticker_to_simulator["MSFT"] = _MutablePriceSimulator(100.0)
    engine._capture_starting_baselines()
    engine._reset_runtime_risk_metrics()

    fe_state = await engine.get_fe_game_state()

    assert "portfolio_analytics" in fe_state
    analytics = fe_state["portfolio_analytics"]
    assert analytics["allocation"]
    assert analytics["risk"]["largest_position_weight"] > 0
    assert analytics["benchmark"]["benchmark_key"] == "core_equal_weight"


async def test_module5_mission_types_evaluate_from_mission_params(module5_data_access):
    engine = SinglePlayerGameEngine(
        user_id="user1", level_id="module-5.2", manual_tick_override=False
    )
    engine.ticker_to_simulator["AAPL"] = _MutablePriceSimulator(100.0)
    engine.ticker_to_simulator["MSFT"] = _MutablePriceSimulator(100.0)
    engine._capture_starting_baselines()
    engine._reset_runtime_risk_metrics()

    engine.ticker_to_simulator["AAPL"].price = 110.0
    engine.ticker_to_simulator["MSFT"].price = 130.0
    await engine.get_fe_game_state()

    engine.level_data.passing_criteria = TutorialMissionCriteriaModel(
        type="all_of",
        missions=[
            TutorialMissionModel(
                id="min_positions",
                type="min_distinct_positions",
                mission_params={"min_positions": 2},
            ),
            TutorialMissionModel(
                id="min_sectors",
                type="min_distinct_sectors",
                mission_params={"min_sectors": 2},
            ),
            TutorialMissionModel(
                id="max_single",
                type="max_single_position_weight",
                mission_params={"max_weight": 0.7},
            ),
            TutorialMissionModel(
                id="tag_required",
                type="require_ticker_tag",
                mission_params={"tag": "defensive", "min_count": 1},
            ),
            TutorialMissionModel(
                id="beta_cap",
                type="max_portfolio_beta",
                mission_params={"max_beta": 1.0},
            ),
            TutorialMissionModel(
                id="beat_benchmark",
                type="min_excess_return_vs_benchmark",
                mission_params={
                    "benchmark_key": "core_equal_weight",
                    "min_excess_return": 0.015,
                    "require_final": True,
                },
            ),
        ],
    )
    engine.level_data.bonus_missions = []
    engine._reset_runtime_risk_metrics()
    await engine.get_fe_game_state()

    progress = engine._build_mission_progress(force_final=True)
    missions = progress["missions"]

    assert missions["min_positions"]["completed"] is True
    assert missions["min_sectors"]["completed"] is True
    assert missions["max_single"]["completed"] is True
    assert missions["tag_required"]["completed"] is True
    assert missions["beta_cap"]["completed"] is True
    assert missions["beat_benchmark"]["completed"] is True


async def test_rebalance_within_ticks_mission_tracks_trigger_window(module5_data_access):
    engine = SinglePlayerGameEngine(
        user_id="user1", level_id="module-5.5", manual_tick_override=False
    )
    engine.ticker_to_simulator["AAPL"] = _MutablePriceSimulator(100.0)
    engine.ticker_to_simulator["MSFT"] = _MutablePriceSimulator(100.0)
    engine.game_state.positions["AAPL"] = Position(
        long_avail_qty=80, long_reserved_qty=0, long_cost_basis=100.0
    )
    engine.game_state.positions["MSFT"] = Position(
        long_avail_qty=20, long_reserved_qty=0, long_cost_basis=100.0
    )

    engine.level_data.passing_criteria = TutorialMissionCriteriaModel(
        type="all_of",
        missions=[
            TutorialMissionModel(
                id="rebalance_window",
                type="rebalance_within_ticks",
                mission_params={
                    "trigger_tick": 2,
                    "max_ticks_after_trigger": 4,
                    "min_rebalance_shift": 0.10,
                    "max_single_weight_after_rebalance": 0.80,
                },
            )
        ],
    )
    engine.level_data.bonus_missions = []
    engine._capture_starting_baselines()
    engine._reset_runtime_risk_metrics()

    engine.game_state.tick = 2
    await engine.get_fe_game_state()

    engine.game_state.positions["AAPL"] = Position(
        long_avail_qty=50, long_reserved_qty=0, long_cost_basis=100.0
    )
    engine.game_state.positions["MSFT"] = Position(
        long_avail_qty=50, long_reserved_qty=0, long_cost_basis=100.0
    )
    engine.game_state.logbook.append(
        Order(
            order_id="rebalance_1",
            user_id="user1",
            action=OrderAction.SELL,
            direction=Direction.SELL,
            order_type=OrderType.MARKET,
            ticker="AAPL",
            qty=30,
            price=None,
            tick=3,
        )
    )
    engine.game_state.tick = 3
    await engine.get_fe_game_state()

    progress = engine._build_mission_progress(force_final=True)
    assert progress["missions"]["rebalance_window"]["completed"] is True
    assert progress["missions"]["rebalance_window"]["value"] >= 0.10

