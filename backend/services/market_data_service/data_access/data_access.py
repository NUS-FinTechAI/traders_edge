from datetime import date

import pandas as pd
import yfinance as yf


def get_historical_data_for(
    ticker: str, start: date, end: date, interval: str = "1d"
) -> pd.DataFrame:
    """
    Returns a pandas dataframe with the following column names
    Open, High, Low, Close, Volume, Dividends, Stock splits
    """
    # TODO: OPTIONAL add check to ensure ticker is present
    data = yf.Ticker(ticker)
    return data.history(start=start, end=end, interval=interval, raise_errors=True)


def get_eps(ticker: str) -> pd.DataFrame:
    """
    Returns a pandas dataframe
    df has a date index named quarter with the following column names
    epsActual  epsEstimate  epsDifference  surprisePercent
    """
    return yf.Ticker(ticker).earnings_history
