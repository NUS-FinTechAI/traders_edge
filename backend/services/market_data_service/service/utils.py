import numpy as np
import pandas as pd


def calculate_pe(df: pd.DataFrame) -> pd.DataFrame:
    df["PE"] = df["Close"] / df["EPS"]
    return df


def calculate_ma(df: pd.DataFrame) -> pd.DataFrame:
    df["MA5"] = df["Close"].rolling(window=5).mean()
    df["MA10"] = df["Close"].rolling(window=10).mean()
    df["MA20"] = df["Close"].rolling(window=20).mean()
    return df


def calculate_rsi(df: pd.DataFrame) -> pd.DataFrame:
    delta = df["Close"].diff(1)
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.rolling(window=14, min_periods=14).mean()
    avg_loss = loss.rolling(window=14, min_periods=14).mean()
    rs = avg_gain / avg_loss
    df["RSI"] = 100 - (100 / (1 + rs))
    return df


def calculate_vwap(df: pd.DataFrame) -> pd.DataFrame:
    df["VWAP"] = (df["Close"] * df["Volume"]).cumsum() / df["Volume"].cumsum()
    return df


def calculate_bollinger_bands(df: pd.DataFrame) -> pd.DataFrame:
    df["SMA20"] = df["Close"].rolling(window=20).mean()
    df["Std20"] = df["Close"].rolling(window=20).std()
    df["Upper_band"] = df["SMA20"] + (df["Std20"] * 2)
    df["Lower_band"] = df["SMA20"] - (df["Std20"] * 2)
    return df


def calculate_atr(df: pd.DataFrame) -> pd.DataFrame:
    high_low = df["High"] - df["Low"]
    high_prev_close = (df["High"] - df["Close"].shift(1)).abs()
    low_prev_close = (df["Low"] - df["Close"].shift(1)).abs()
    tr = pd.concat([high_low, high_prev_close, low_prev_close], axis=1).max(axis=1)
    df["ATR14"] = tr.rolling(window=14).mean()
    return df


def calculate_sharpe_ratio(
    df: pd.DataFrame, risk_free_rate: float = 0.04
) -> pd.DataFrame:
    daily_returns = df["Close"].pct_change()
    excess_returns = daily_returns - (risk_free_rate / 252)
    sharpe_daily = (
        excess_returns.rolling(window=252).mean()
        / excess_returns.rolling(window=252).std()
    )
    df["Sharpe_Ratio"] = sharpe_daily * np.sqrt(252)
    return df


def calculate_macd(df: pd.DataFrame) -> pd.DataFrame:
    ema12 = df["Close"].ewm(span=12, adjust=False).mean()
    ema26 = df["Close"].ewm(span=26, adjust=False).mean()
    df["MACD"] = ema12 - ema26
    df["MACD_Signal"] = df["MACD"].ewm(span=9, adjust=False).mean()
    df["MACD_Hist"] = df["MACD"] - df["MACD_Signal"]
    return df


def calculate_beta(df: pd.DataFrame, benchmark_returns: pd.Series) -> pd.DataFrame:
    daily_returns = df["Close"].pct_change()
    df["Beta"] = (
        daily_returns.rolling(window=252).cov(benchmark_returns)
        / benchmark_returns.rolling(window=252).var()
    )
    return df


def calculate_alpha(df: pd.DataFrame) -> pd.DataFrame:
    pass


def calculate_indicators(df: pd.DataFrame, risk_free_rate: float = 0.04):
    """
    Calculate technical and risk indicators for a stock DataFrame.

    Parameters:
    - df: DataFrame with columns ['Open', 'High', 'Low', 'Close', 'Volume']
    - risk_free_rate: annual risk-free rate for Sharpe ratio (default 4%)
    - benchmark_returns: pd.Series of benchmark returns for Beta calculation
    """
    # --- PE ratio ---
    df = calculate_pe(df)
    # --- Moving Averages ---
    df = calculate_ma(df)
    # --- RSI ---
    df = calculate_rsi(df)
    # --- VWAP ---
    df = calculate_vwap(df)
    # --- Bollinger Bands ---
    df = calculate_bollinger_bands(df)
    # --- ATR (True Range) ---
    df = calculate_atr(df)
    # --- Sharpe Ratio (annualized) ---
    df = calculate_sharpe_ratio(df)
    # --- Beta relative to benchmark (if provided) ---
    # df = calculate_beta(df, benchmark_returns)
    # --- MACD ---
    df = calculate_macd(df)

    return df.fillna(-1)
