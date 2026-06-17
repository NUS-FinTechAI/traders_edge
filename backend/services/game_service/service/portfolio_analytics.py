import math
from statistics import pstdev
from typing import Any

from services.game_service.models.game import Position


def _safe_float(value: Any) -> float | None:
    if value is None:
        return None
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(parsed) or math.isinf(parsed):
        return None
    return parsed


def _series_returns(values: list[float], lookback: int) -> list[float]:
    if len(values) < 2:
        return []
    window = values[-(lookback + 1) :] if lookback > 0 else values[:]
    returns: list[float] = []
    for prev, cur in zip(window[:-1], window[1:]):
        if prev == 0:
            continue
        returns.append((cur - prev) / prev)
    return returns


def _pearson_corr(xs: list[float], ys: list[float]) -> float | None:
    n = min(len(xs), len(ys))
    if n < 2:
        return None
    x = xs[-n:]
    y = ys[-n:]
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    dev_x = [value - mean_x for value in x]
    dev_y = [value - mean_y for value in y]
    std_x = math.sqrt(sum(delta * delta for delta in dev_x))
    std_y = math.sqrt(sum(delta * delta for delta in dev_y))
    if std_x == 0 or std_y == 0:
        return None
    cov = sum(dx * dy for dx, dy in zip(dev_x, dev_y))
    return cov / (std_x * std_y)


def _build_reference_returns(
    *,
    reference_portfolios: list[dict[str, Any]],
    prices_by_ticker: dict[str, float],
    starting_prices_by_ticker: dict[str, float],
    portfolio_return: float,
) -> tuple[list[dict[str, Any]], dict[str, float], dict[str, Any]]:
    references: list[dict[str, Any]] = []
    reference_returns: dict[str, float] = {}
    benchmark_snapshot = {
        "benchmark_key": None,
        "portfolio_return": portfolio_return,
        "benchmark_return": None,
        "excess_return": None,
    }

    ordered_refs = sorted(
        reference_portfolios,
        key=lambda item: (int(item.get("display_order", 1)), item.get("reference_key", "")),
    )
    for reference in ordered_refs:
        reference_key = str(reference.get("reference_key") or "").strip()
        if not reference_key:
            continue
        role = str(reference.get("reference_role") or "reference").strip().lower()
        title = str(reference.get("title") or reference_key).strip()
        components = reference.get("components") or []
        reference_return = 0.0
        for component in components:
            ticker = str(component.get("ticker") or "").strip()
            weight = _safe_float(component.get("weight")) or 0.0
            start_price = _safe_float(starting_prices_by_ticker.get(ticker))
            current_price = _safe_float(prices_by_ticker.get(ticker))
            if weight <= 0 or not start_price or not current_price or start_price == 0:
                continue
            reference_return += weight * ((current_price / start_price) - 1.0)
        excess_return = portfolio_return - reference_return
        reference_returns[reference_key] = reference_return
        references.append(
            {
                "reference_key": reference_key,
                "role": "benchmark" if role == "benchmark" else "reference",
                "title": title,
                "return_pct": reference_return,
                "excess_return": excess_return,
            }
        )

    for reference in references:
        if reference["role"] != "benchmark":
            continue
        benchmark_snapshot = {
            "benchmark_key": reference["reference_key"],
            "portfolio_return": portfolio_return,
            "benchmark_return": reference["return_pct"],
            "excess_return": reference["excess_return"],
        }
        break

    return references, reference_returns, benchmark_snapshot


def build_portfolio_analytics(
    *,
    tickers: list[str],
    positions: dict[str, Position],
    prices_by_ticker: dict[str, float],
    ticker_metadata: dict[str, Any],
    reference_portfolios: list[dict[str, Any]],
    starting_prices_by_ticker: dict[str, float],
    starting_net_worth: float,
    current_net_worth: float,
    net_worth_history: list[float],
    price_history_by_ticker: dict[str, list[float]],
    rebalance_due: bool = False,
    volatility_lookback: int = 20,
    correlation_lookback: int = 20,
) -> tuple[dict[str, Any], dict[str, Any]]:
    invested_value = 0.0
    holdings: dict[str, dict[str, Any]] = {}
    for ticker in tickers:
        position = positions.get(ticker, Position())
        long_qty = int(position.long_avail_qty + position.long_reserved_qty)
        short_qty = int(position.short_avail_qty + position.short_reserved_qty)
        if long_qty <= 0 and short_qty <= 0:
            continue
        price = _safe_float(prices_by_ticker.get(ticker))
        if price is None:
            continue
        long_value = float(long_qty * price)
        short_liability = float(short_qty * price)
        gross_value = long_value + short_liability
        if gross_value <= 0:
            continue
        invested_value += gross_value
        metadata = ticker_metadata.get(ticker, {}) or {}
        sector_key = str(metadata.get("sector_key") or "unknown").strip() or "unknown"
        tags = [
            str(tag).strip()
            for tag in metadata.get("ticker_tags", [])
            if isinstance(tag, str) and str(tag).strip()
        ]
        holdings[ticker] = {
            "ticker": ticker,
            "qty": int(long_qty - short_qty),
            "long_qty": long_qty,
            "short_qty": short_qty,
            "value": gross_value,
            "net_value": float(long_value - short_liability),
            "sector_key": sector_key,
            "beta": _safe_float(metadata.get("beta")),
            "tags": tags,
        }

    allocation: list[dict[str, Any]] = []
    position_weights: dict[str, float] = {}
    sectors: dict[str, float] = {}
    for ticker, holding in holdings.items():
        value = float(holding["value"])
        weight = (value / invested_value) if invested_value > 0 else 0.0
        allocation.append(
            {
                "ticker": ticker,
                "value": value,
                "weight": weight,
                "qty": int(holding["qty"]),
                "long_qty": int(holding["long_qty"]),
                "short_qty": int(holding["short_qty"]),
            }
        )
        position_weights[ticker] = weight
        sector_key = str(holding["sector_key"])
        sectors[sector_key] = sectors.get(sector_key, 0.0) + value

    allocation.sort(key=lambda row: row["weight"], reverse=True)
    sector_rows: list[dict[str, Any]] = []
    sector_weights: dict[str, float] = {}
    for sector_key, value in sorted(sectors.items(), key=lambda item: item[1], reverse=True):
        weight = (value / invested_value) if invested_value > 0 else 0.0
        sector_rows.append(
            {
                "sector_key": sector_key,
                "value": float(value),
                "weight": weight,
            }
        )
        sector_weights[sector_key] = weight

    largest_position_weight = max(position_weights.values(), default=0.0)
    largest_sector_weight = max(sector_weights.values(), default=0.0)
    hhi = sum(weight * weight for weight in position_weights.values())

    portfolio_beta: float | None = None
    weighted_beta = 0.0
    beta_weight_total = 0.0
    for ticker, holding in holdings.items():
        beta = _safe_float(holding.get("beta"))
        weight = position_weights.get(ticker, 0.0)
        if beta is None or weight <= 0:
            continue
        weighted_beta += weight * beta
        beta_weight_total += weight
    if beta_weight_total > 0:
        portfolio_beta = weighted_beta / beta_weight_total

    net_worth_returns = _series_returns(net_worth_history, volatility_lookback)
    portfolio_volatility = (
        float(pstdev(net_worth_returns)) if len(net_worth_returns) >= 2 else None
    )

    return_series_by_ticker: dict[str, list[float]] = {}
    for ticker in holdings:
        ticker_prices = price_history_by_ticker.get(ticker, [])
        returns = _series_returns(ticker_prices, correlation_lookback)
        if len(returns) >= 2:
            return_series_by_ticker[ticker] = returns

    correlation_values: list[float] = []
    avg_abs_corr_by_ticker: dict[str, float] = {}
    sorted_tickers = sorted(return_series_by_ticker.keys())
    for index, left_ticker in enumerate(sorted_tickers):
        left_series = return_series_by_ticker[left_ticker]
        per_ticker_values: list[float] = []
        for right_ticker in sorted_tickers[index + 1 :]:
            right_series = return_series_by_ticker[right_ticker]
            corr = _pearson_corr(left_series, right_series)
            if corr is None:
                continue
            abs_corr = abs(corr)
            correlation_values.append(abs_corr)
            per_ticker_values.append(abs_corr)
            avg_abs_corr_by_ticker.setdefault(right_ticker, 0.0)
        if per_ticker_values:
            avg_abs_corr_by_ticker[left_ticker] = sum(per_ticker_values) / len(
                per_ticker_values
            )

    # Complete per-ticker averages by evaluating every pair once.
    if len(sorted_tickers) >= 2:
        pair_map: dict[str, list[float]] = {ticker: [] for ticker in sorted_tickers}
        for index, left_ticker in enumerate(sorted_tickers):
            for right_ticker in sorted_tickers[index + 1 :]:
                corr = _pearson_corr(
                    return_series_by_ticker[left_ticker],
                    return_series_by_ticker[right_ticker],
                )
                if corr is None:
                    continue
                abs_corr = abs(corr)
                pair_map[left_ticker].append(abs_corr)
                pair_map[right_ticker].append(abs_corr)
        for ticker, values in pair_map.items():
            if values:
                avg_abs_corr_by_ticker[ticker] = sum(values) / len(values)

    average_correlation = (
        (sum(correlation_values) / len(correlation_values))
        if correlation_values
        else None
    )
    min_avg_abs_correlation = (
        min(avg_abs_corr_by_ticker.values()) if avg_abs_corr_by_ticker else None
    )

    portfolio_return = (
        (current_net_worth / starting_net_worth) - 1.0 if starting_net_worth > 0 else 0.0
    )
    references, reference_returns, benchmark_snapshot = _build_reference_returns(
        reference_portfolios=reference_portfolios,
        prices_by_ticker=prices_by_ticker,
        starting_prices_by_ticker=starting_prices_by_ticker,
        portfolio_return=portfolio_return,
    )

    warning_messages: list[str] = []
    if rebalance_due:
        warning_messages.append("A rebalance window is active; evaluate weight drift now.")

    analytics = {
        "allocation": allocation,
        "sectors": sector_rows,
        "risk": {
            "invested_value": invested_value,
            "largest_position_weight": largest_position_weight,
            "largest_sector_weight": largest_sector_weight,
            "hhi": hhi,
            "beta": portfolio_beta,
            "volatility": portfolio_volatility,
            "average_correlation": average_correlation,
            "min_avg_abs_correlation": min_avg_abs_correlation,
        },
        "benchmark": benchmark_snapshot,
        "references": references,
        "warnings": {
            "rebalance_due": rebalance_due,
            "messages": warning_messages,
        },
    }

    analytics_metrics = {
        "position_weights": position_weights,
        "sector_weights": sector_weights,
        "distinct_positions": len(holdings),
        "distinct_sectors": len(sector_weights),
        "largest_position_weight": largest_position_weight,
        "largest_sector_weight": largest_sector_weight,
        "portfolio_beta": portfolio_beta,
        "portfolio_volatility": portfolio_volatility,
        "average_correlation": average_correlation,
        "min_avg_abs_correlation": min_avg_abs_correlation,
        "avg_abs_corr_by_ticker": avg_abs_corr_by_ticker,
        "portfolio_return": portfolio_return,
        "reference_returns": reference_returns,
        "benchmark_key": benchmark_snapshot.get("benchmark_key"),
        "benchmark_return": benchmark_snapshot.get("benchmark_return"),
        "benchmark_excess_return": benchmark_snapshot.get("excess_return"),
        "held_tickers": sorted(holdings.keys()),
        "held_ticker_tags": {ticker: holding.get("tags", []) for ticker, holding in holdings.items()},
        "invested_value": invested_value,
    }
    analytics_metrics["excess_returns"] = {
        key: portfolio_return - value for key, value in reference_returns.items()
    }

    return analytics, analytics_metrics
