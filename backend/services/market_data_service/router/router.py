from datetime import date, timedelta

from fastapi import APIRouter, HTTPException, Query

from ..service import service

router = APIRouter(
    prefix="/market-data",
    tags=["market-data"],
)


def default_start_date():
    return date.today() - timedelta(days=7)


@router.get("/ticker/{ticker}")
async def get_stock_info_for(
    ticker: str,
    start: date = Query(
        default=default_start_date(),
        description="Query start date, default to a week ago",
    ),
    end: date = Query(
        default=date.today(),
        description="Query end date, default to today, NOTE: not inclusive",
    ),
    indicators: list[str] | None = Query(
        default=None, description="indicators to include"
    ),
    interval: str = Query(default="1d", description="interval of the data"),
):
    if interval != "1d":
        raise HTTPException(
            status_code=418, detail="Intervals apart from 1d is currently not supported"
        )
    ret = service.get_stock_info_for(ticker, start, end, indicators, interval).to_dict()
    return ret
