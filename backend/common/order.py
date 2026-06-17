from datetime import datetime

from pydantic import BaseModel, Field
from utils.constants import Direction, OrderAction, OrderType, Status


class Order(BaseModel):
    order_id: str | None  # None when sent from FE
    user_id: str

    action: OrderAction
    direction: Direction
    order_type: OrderType
    ticker: str
    status: Status = Status.OPEN
    qty: int
    qty_left: int = 0
    # For LIMIT and STOP_LIMIT this is the limit price.
    # For STOP (legacy compatibility) this may also carry the stop trigger.
    price: float | None
    # Trigger price used by STOP and STOP_LIMIT orders.
    stop_price: float | None = None
    price_filled: float = 0  # if partial order would be weighted average

    # TODO find a better place to store this, prob in game state
    reserved_funds: float = 0

    tick: int = -1  # current tick in which the order was submitted
    filled_tick: int = 0  # current tick in which the order was filled / canceled
    ts: str = Field(default_factory=lambda: datetime.now().isoformat())

    def model_post_init(self, __context):
        self.qty_left = self.qty
