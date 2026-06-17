from typing import Any, Dict, List, Literal, TypeAlias

from common import Order
from pydantic import BaseModel, ConfigDict, Field
from utils.constants import Direction, OrderAction, OrderType


class LevelAvailableToolsModel(BaseModel):
    # Preserve known keys while allowing future tool keys from tool_definitions.
    model_config = ConfigDict(extra="allow")
    news: bool = False
    market_order: bool = False
    short_selling: bool = False
    limit_order: bool = False
    stop_order: bool = False
    stop_limit_order: bool = False
    bid_ask_spread: bool = False
    moving_average: bool = False
    exponential_moving_average: bool = False
    interest_rate_panel: bool = False
    inflation_panel: bool = False
    drawdown_panel: bool = False
    portfolio_allocation_panel: bool = False
    sector_exposure_panel: bool = False
    fundamentals_panel: bool = False
    correlation_panel: bool = False
    beta_volatility_panel: bool = False
    benchmark_panel: bool = False
    rebalancing_prompt: bool = False


class TutorialUnlockModel(BaseModel):
    feature: str
    title: str
    description: str
    tool_tutorial_id: str | None = None


class TutorialMissionModel(BaseModel):
    id: str
    type: Literal[
        "use_order_type",
        "use_trade_action",
        "pnl_at_end",
        "max_total_orders",
        "max_drawdown_pct",
        "min_distinct_positions",
        "min_distinct_sectors",
        "max_single_position_weight",
        "max_sector_weight",
        "exclude_ticker",
        "require_ticker_tag",
        "require_low_correlation_holding",
        "max_portfolio_beta",
        "max_portfolio_volatility",
        "rebalance_within_ticks",
        "min_excess_return_vs_benchmark",
        "min_excess_return_vs_reference",
    ]
    title: str = ""
    description: str = ""
    points: int = 0
    mission_params: Dict[str, Any] = Field(default_factory=dict)


class TutorialMissionCriteriaModel(BaseModel):
    type: Literal["all_of", "any_of"] = "all_of"
    missions: List[TutorialMissionModel] = Field(default_factory=list)


# news (title, content, multiplier, duration_ticks)
NewsEventTuple: TypeAlias = tuple[str, str, float, int]
# ticker -> list of displayable news entries attached to that ticker.
NewsByTicker: TypeAlias = Dict[str, List[NewsEventTuple]]
# (multiplier, duration_ticks) for one scheduled market-impact window.
NewsEffectTuple: TypeAlias = tuple[float, int]
# ticker -> list of effect windows that begin on a specific tick.
NewsEffectsByTicker: TypeAlias = Dict[str, List[NewsEffectTuple]]


class MacroFactorModel(BaseModel):
    factor_key: str
    title: str
    current_value: float
    previous_value: float | None = None
    last_change_bps: int | None = None
    market_stance_note: str = ""
    display_order: int = 1


class LevelStartingPositionModel(BaseModel):
    qty: int = Field(default=0, ge=0)
    cost_basis: float = Field(default=0, ge=0)


class TickerMetadataModel(BaseModel):
    company_name: str = ""
    company_description: str = ""
    sector_key: str = "unknown"
    pe_ratio: float | None = None
    roe_pct: float | None = None
    debt_to_equity: float | None = None
    beta: float | None = None
    volatility_hint: float | None = None
    ticker_tags: list[str] = Field(default_factory=list)


class ReferencePortfolioComponentModel(BaseModel):
    ticker: str
    weight: float
    display_order: int = 1


class ReferencePortfolioModel(BaseModel):
    reference_key: str
    reference_role: Literal["benchmark", "reference"]
    title: str
    description: str = ""
    display_order: int = 1
    components: list[ReferencePortfolioComponentModel] = Field(default_factory=list)


class PortfolioAllocationItemModel(BaseModel):
    ticker: str
    weight: float
    value: float
    qty: int = 0
    long_qty: int = 0
    short_qty: int = 0


class PortfolioSectorExposureItemModel(BaseModel):
    sector_key: str
    weight: float
    value: float


class PortfolioRiskSnapshotModel(BaseModel):
    invested_value: float = 0
    largest_position_weight: float = 0
    largest_sector_weight: float = 0
    hhi: float = 0
    beta: float | None = None
    volatility: float | None = None
    average_correlation: float | None = None
    min_avg_abs_correlation: float | None = None


class PortfolioBenchmarkSnapshotModel(BaseModel):
    benchmark_key: str | None = None
    benchmark_return: float | None = None
    portfolio_return: float | None = None
    excess_return: float | None = None


class PortfolioReferenceReturnModel(BaseModel):
    reference_key: str
    role: Literal["benchmark", "reference"]
    title: str
    return_pct: float
    excess_return: float


class PortfolioWarningsModel(BaseModel):
    rebalance_due: bool = False
    messages: list[str] = Field(default_factory=list)


class PortfolioAnalyticsModel(BaseModel):
    allocation: list[PortfolioAllocationItemModel] = Field(default_factory=list)
    sectors: list[PortfolioSectorExposureItemModel] = Field(default_factory=list)
    risk: PortfolioRiskSnapshotModel = Field(default_factory=PortfolioRiskSnapshotModel)
    benchmark: PortfolioBenchmarkSnapshotModel = Field(
        default_factory=PortfolioBenchmarkSnapshotModel
    )
    references: list[PortfolioReferenceReturnModel] = Field(default_factory=list)
    warnings: PortfolioWarningsModel = Field(default_factory=PortfolioWarningsModel)


# (multiplier, duration_ticks, title, content, factor_key)
MacroEffectTuple: TypeAlias = tuple[float, int, str, str, str]
# ticker -> list of macro effect windows that begin on a specific tick.
MacroEffectsByTicker: TypeAlias = Dict[str, List[MacroEffectTuple]]


class LevelDataModel(BaseModel):
    level_id: str
    level_type: Literal["tutorial", "puzzle"]
    tick_mode: Literal["manual", "auto"]
    manual_start: bool = False
    auto_tick_interval_seconds: int | None

    start_date: str
    end_date: str
    # Should be of type from utils.constants import YFINANCE_INTERVALS
    interval: str = "1d"  # TODO required remove default value
    total_ticks: int = 0  # required
    preloaded_ticks: int = 0
    news: Dict[int, NewsByTicker]  # display tick -> ticker -> (title, content, multiplier, duration)
    # Optional effect schedule for multi-window news impact:
    # start tick -> ticker -> list[(multiplier, duration)]
    news_effects: Dict[int, NewsEffectsByTicker] = Field(default_factory=dict)
    macro_factors: List[MacroFactorModel] = Field(default_factory=list)
    # start tick -> ticker -> list[(multiplier, duration, title, content, factor_key)]
    macro_effects: Dict[int, MacroEffectsByTicker] = Field(default_factory=dict)
    starting_tickers: List[str]
    starting_positions: Dict[str, LevelStartingPositionModel] = Field(
        default_factory=dict
    )
    ticker_metadata: Dict[str, TickerMetadataModel] = Field(default_factory=dict)
    reference_portfolios: List[ReferencePortfolioModel] = Field(default_factory=list)
    starting_cash: float
    context: str = ""
    level_tutorial_id: str | None = None
    is_manual_tick: bool = False

    # Tutorial mission metadata. Kept optional for puzzle mode compatibility.
    final_cash_points_multiplier: float = 0
    passing_criteria: TutorialMissionCriteriaModel = Field(
        default_factory=TutorialMissionCriteriaModel
    )
    bonus_missions: List[TutorialMissionModel] = Field(default_factory=list)
    unlocks: List[TutorialUnlockModel] = Field(default_factory=list)
    available_tools: LevelAvailableToolsModel = Field(
        default_factory=LevelAvailableToolsModel
    )
    ticker_configs: List[Dict[str, Any]] = Field(default_factory=list)


class Position(BaseModel):
    long_avail_qty: int = 0
    long_reserved_qty: int = 0
    long_cost_basis: float = 0
    short_avail_qty: int = 0
    short_reserved_qty: int = 0
    short_entry_price: float = 0


class OrderFill(BaseModel):
    fill_id: str
    order_id: str
    user_id: str
    action: OrderAction
    direction: Direction
    order_type: OrderType
    ticker: str
    qty: int
    qty_left: int
    price: float
    cumulative_qty_filled: int
    tick: int
    ts: str


class GameStateModel(BaseModel):
    avail_cash: float
    reserved_cash: float = 0
    positions: dict[str, Position] = Field(default_factory=dict)
    logbook: List[Order] = Field(default_factory=list)  # Append only
    fills: List[OrderFill] = Field(default_factory=list)  # Append only
    tick: int = -1


class MultiplayerGameStateModel(BaseModel):
    user_states: Dict[str, GameStateModel] = Field(default_factory=dict)
    logbook: List[Order] = Field(default_factory=list)  # Append only
    tick: int = -1
