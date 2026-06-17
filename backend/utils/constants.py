from enum import Enum
from typing import Literal


class OrderType(str, Enum):
    LIMIT = "Limit"
    MARKET = "Market"
    STOP = "Stop"
    STOP_LIMIT = "StopLimit"


class Direction(str, Enum):
    BUY = "Buy"
    SELL = "Sell"


class OrderAction(str, Enum):
    BUY = "Buy"
    SELL = "Sell"
    SELL_SHORT = "SellShort"
    BUY_TO_COVER = "BuyToCover"


class Status(str, Enum):
    OPEN = "Open"
    CANCELED = "Canceled"
    FILLED = "Filled"
    PARTIALLY_FILLED = "Partially Filled"


INTRADAY_INTERVALS = {"1m", "2m", "5m", "15m", "30m", "60m", "90m", "1h"}

INTERDAY_INTERVALS = {"1d", "5d", "1wk", "1mo", "3mo"}

YFINANCE_INTERVALS = INTERDAY_INTERVALS | INTRADAY_INTERVALS

NPC_ORDER_PREFIX = "NPC_ORDER"

BROADCAST_USER_ID = "all"

SHORT_EXPOSURE_CAP_FRACTION = 1.0
MARKET_BUY_RESERVE_MULTIPLIER = 1.1
