import type { CandlestickData, Time, WhitespaceData } from "lightweight-charts";

export type BusinessDayPoint = { year: number; month: number; day: number };
export type CandlePoint = CandlestickData | WhitespaceData<Time>;
export interface IndicatorPoint {
  time: Time;
  value: number;
}

// Truncate to max 2 decimal places (towards zero)
export const toTwoDp = (value: number): number => Math.trunc(value * 100) / 100;

export const toBusinessDay = (ymd: string): BusinessDayPoint => {
  const [y, m, d] = ymd.split("-").map(Number);
  return { year: y as number, month: m as number, day: d as number };
};

export const addDaysToYmd = (ymd: string, days: number): string => {
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const computeAssetPriceMetrics = (
  allPoints: CandlePoint[],
  livePrice?: number | null
) => {
  const candlePoints = allPoints.filter(
    (point): point is CandlestickData =>
      typeof (point as CandlestickData).close === "number"
  );
  const currentAssetPrice = typeof livePrice === "number"
    ? toTwoDp(livePrice)
    : candlePoints.length > 0
      ? toTwoDp(candlePoints[candlePoints.length - 1].close)
      : null;
  const previousAssetPrice =
    candlePoints.length > 1
      ? toTwoDp(candlePoints[candlePoints.length - 2].close)
      : null;
  const assetPriceDelta =
    currentAssetPrice != null && previousAssetPrice != null
      ? toTwoDp(currentAssetPrice - previousAssetPrice)
      : null;

  return {
    currentAssetPrice,
    previousAssetPrice,
    assetPriceDelta,
  };
};

const toCandlestickPoints = (points: CandlePoint[]): CandlestickData[] =>
  points.filter(
    (point): point is CandlestickData =>
      typeof (point as CandlestickData).close === "number" &&
      (point as CandlestickData).time != null
  );

export const computeSimpleMovingAverageSeries = (
  points: CandlePoint[],
  period: number
): IndicatorPoint[] => {
  if (!Number.isFinite(period) || period <= 0) return [];
  const candles = toCandlestickPoints(points);
  const window: number[] = [];
  let rollingSum = 0;
  const series: IndicatorPoint[] = [];

  for (const candle of candles) {
    const close = candle.close;
    window.push(close);
    rollingSum += close;
    if (window.length > period) {
      rollingSum -= window.shift() as number;
    }

    series.push({
      time: candle.time,
      value: toTwoDp(rollingSum / window.length),
    });
  }

  return series;
};

export const computeExponentialMovingAverageSeries = (
  points: CandlePoint[],
  period: number
): IndicatorPoint[] => {
  if (!Number.isFinite(period) || period <= 0) return [];
  const candles = toCandlestickPoints(points);
  const alpha = 2 / (period + 1);
  const series: IndicatorPoint[] = [];

  let ema: number | null = null;
  for (const candle of candles) {
    const close = candle.close;
    ema = ema == null ? close : close * alpha + ema * (1 - alpha);
    series.push({
      time: candle.time,
      value: toTwoDp(ema),
    });
  }

  return series;
};

export const getLatestIndicatorValue = (
  series: IndicatorPoint[]
): number | null => {
  if (series.length === 0) return null;
  return toTwoDp(series[series.length - 1].value);
};
