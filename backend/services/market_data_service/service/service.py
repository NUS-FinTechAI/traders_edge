from datetime import date, timedelta

import pandas as pd

from ..data_access import data_access as da
from .utils import calculate_indicators

# 369 to account for weekends and holidays
# We need a minimum of 252 rows to calculate sharpe ratio
LOOKBACK_DAYS = 369


def get_stock_info_for(
    ticker: str,
    start: str | date,
    end: str | date,
    fields: None | list[str] = None,
    interval: str = "1d",
) -> pd.DataFrame:
    if interval != "1d":
        raise Exception("Intervals apart from 1d is currently not supported")

    padded_start = start - timedelta(days=LOOKBACK_DAYS)

    df = da.get_historical_data_for(ticker, padded_start, end, interval)
    df.index = df.index.tz_localize(None).date

    # Due to limitation, I am only able to get EPS for the last 4 quarters
    eps = da.get_eps(ticker)
    df["EPS"] = eps["epsActual"].reindex(df.index, method="ffill")
    df = calculate_indicators(df)

    if fields:
        df = df[fields]

    return df.loc[start:end]
