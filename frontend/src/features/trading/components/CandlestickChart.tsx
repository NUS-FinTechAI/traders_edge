import { useEffect, useMemo, useRef } from "react";
import { createChart, ColorType, CandlestickSeries, LineSeries } from "lightweight-charts";
import type { BusinessDay, CandlestickData, LineData, Time, WhitespaceData } from "lightweight-charts";
import { THEME_CONFIG, getChartHexColors } from "../../../shared/ui/config/themeConfig";

type CandlePoint = CandlestickData | WhitespaceData<Time>;

export interface ChartOverlayLine {
  key: string;
  color: string;
  visible: boolean;
  points: LineData<Time>[];
}

interface CandlestickChartProps {
  points: CandlePoint[];
  isDark: boolean;
  height?: number;
  seriesKey?: string;
  overlays?: ChartOverlayLine[];
}

const CHART_HEIGHT_DEFAULT = 600;
const CHART_FALLBACK_WIDTH = 600;

const parseBusinessDay = (time: Time): BusinessDay | null => {
  if (!time || typeof time !== "object") return null;
  const maybe = time as Partial<BusinessDay>;
  if (
    !Number.isInteger(maybe.year) ||
    !Number.isInteger(maybe.month) ||
    !Number.isInteger(maybe.day)
  ) {
    return null;
  }
  return {
    year: maybe.year as number,
    month: maybe.month as number,
    day: maybe.day as number,
  };
};

const toStableTimeKey = (time: BusinessDay): string => {
  const year = Number(time.year) || 0;
  const month = Number(time.month) || 0;
  const day = Number(time.day) || 0;
  return `b:${year.toString().padStart(4, "0")}-${month
    .toString()
    .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
};

const toTimeOrderValue = (time: BusinessDay): number => {
  const year = Number(time.year) || 0;
  const month = Number(time.month) || 0;
  const day = Number(time.day) || 0;
  return year * 10000 + month * 100 + day;
};

const sanitizeCandlestickPoints = (points: CandlePoint[]): CandlestickData<BusinessDay>[] => {
  const filtered = points
    .map((point) => {
      if (!point || typeof point !== "object") return false;
      const maybe = point as Partial<CandlestickData<Time>>;
      const businessDay = parseBusinessDay(maybe.time as Time);
      if (
        maybe.time != null &&
        Number.isFinite(maybe.open) &&
        Number.isFinite(maybe.high) &&
        Number.isFinite(maybe.low) &&
        Number.isFinite(maybe.close)
      ) {
        if (!businessDay) return false;
        return {
          time: businessDay,
          open: Number(maybe.open),
          high: Number(maybe.high),
          low: Number(maybe.low),
          close: Number(maybe.close),
        };
      }
      return false;
    })
    .filter((point): point is CandlestickData<BusinessDay> => point !== false);

  // Lightweight charts expects strictly ordered, de-duplicated times.
  const deduped = new Map<string, CandlestickData<BusinessDay>>();
  for (const point of filtered) {
    deduped.set(toStableTimeKey(point.time), point);
  }
  return Array.from(deduped.values()).sort((a, b) => {
    const aOrder = toTimeOrderValue(a.time);
    const bOrder = toTimeOrderValue(b.time);
    if (aOrder !== bOrder) return aOrder - bOrder;
    return toStableTimeKey(a.time).localeCompare(toStableTimeKey(b.time));
  });
};

export function CandlestickChart({
  points,
  isDark,
  height = CHART_HEIGHT_DEFAULT,
  seriesKey,
  overlays = [],
}: CandlestickChartProps) {
  const sanitizedPoints = useMemo(() => sanitizeCandlestickPoints(points), [points]);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const overlaySeriesRef = useRef<Map<string, any>>(new Map());
  const initialViewSetRef = useRef<boolean>(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const safeSetData = (nextPoints: CandlestickData<Time>[]) => {
    if (!seriesRef.current) return;
    try {
      seriesRef.current.setData(nextPoints as any);
    } catch (error) {
      console.error("[CandlestickChart] setData failed", error, nextPoints.slice(-3));
      seriesRef.current.setData([]);
    }
  };

  // Create chart once
  useEffect(() => {
    if (!chartContainerRef.current || chartRef.current) return;
    const container = chartContainerRef.current;
    const c = getChartHexColors(isDark);
    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: c.text,
      },
      width: container.clientWidth || CHART_FALLBACK_WIDTH,
      height: container.clientHeight || height,
      grid: {
        vertLines: { color: c.grid, style: 1 },
        horzLines: { color: c.grid, style: 1 },
      },
      timeScale: {
        minBarSpacing: 1,
        rightOffset: 1,
        barSpacing: 14,
        tickMarkFormatter: (time: any) => {
          if (typeof time === 'object' && time && 'day' in time) return String((time as any).day);
          return '';
        },
      } as any,
    });
    chartRef.current = chart;
    const series = chart.addSeries(CandlestickSeries, {
      upColor: c.upBody,
      downColor: c.downBody,
      wickUpColor: c.upWick,
      wickDownColor: c.downWick,
      borderVisible: false,
    });
    seriesRef.current = series;
    if (sanitizedPoints.length > 0) {
      safeSetData(sanitizedPoints);
      // set initial visible range exactly once, when first data arrives, to fit all data in view
      if (!initialViewSetRef.current) {
        try {
          (chart.timeScale() as any).setVisibleLogicalRange({
            from: 0,
            to: Math.max(5, sanitizedPoints.length),
          });
        } catch {}
        initialViewSetRef.current = true;
      }
    }

    // Tooltip
    const tooltip = document.createElement('div');
    tooltip.style.display = 'none';
    tooltip.style.whiteSpace = 'pre';
    tooltip.style.backdropFilter = 'blur(2px)';
    tooltip.className = [
      'pointer-events-none absolute z-10 px-2 py-1 rounded border text-xs',
      THEME_CONFIG.colors.card.background,
      THEME_CONFIG.colors.text.primary,
      'border',
      THEME_CONFIG.colors.border.default,
    ].join(' ');
    tooltipRef.current = tooltip;
    container.appendChild(tooltip);

    const moveHandler = (param: any) => {
      if (!tooltipRef.current) return;
      if (!param || !param.point || param.time === undefined) {
        tooltipRef.current.style.display = 'none';
        return;
      }
      const data = param.seriesData.get(series) as any | undefined;
      const isOhlc = data && data.open != null && data.high != null && data.low != null && data.close != null;
      const time = param.time as any;
      const day = typeof time === 'object' && time ? `${time.year}-${String(time.month).padStart(2,'0')}-${String(time.day).padStart(2,'0')}` : '';
      const content = isOhlc
        ? `Open: ${data.open}\nHigh: ${data.high}\nLow: ${data.low}\nClose: ${data.close}\n${day}`
        : `No data\n${day}`;
      tooltipRef.current.textContent = content;
      tooltipRef.current.style.display = 'block';
      const containerW = container.clientWidth;
      const tipW = tooltipRef.current.offsetWidth || 160;
      let left = param.point.x + 12;
      if (left + tipW > containerW - 8) left = containerW - tipW - 8;
      if (left < 8) left = 8;
      tooltipRef.current.style.left = `${left}px`;
      tooltipRef.current.style.top = `8px`;
    };
    chart.subscribeCrosshairMove(moveHandler);
    (chartRef.current as any)._moveHandler = moveHandler;

    // Resize
    const handleResize = () => {
      if (!chartRef.current || !chartContainerRef.current) return;
      const newWidth = chartContainerRef.current.clientWidth || CHART_FALLBACK_WIDTH;
      const newHeight = chartContainerRef.current.clientHeight || height;
      (chartRef.current as any).resize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);
    (chartRef.current as any)._handleResize = handleResize;
    const ro = new ResizeObserver(() => handleResize());
    ro.observe(container);
    (chartRef.current as any)._resizeObserver = ro;
    handleResize();

    return () => {
      if (chartRef.current) {
        const anyChart = chartRef.current as any;
        if (anyChart._moveHandler) chartRef.current.unsubscribeCrosshairMove(anyChart._moveHandler);
        if (anyChart._handleResize) window.removeEventListener('resize', anyChart._handleResize);
        if (anyChart._resizeObserver) (anyChart._resizeObserver as ResizeObserver).disconnect();
        overlaySeriesRef.current.clear();
        if (tooltipRef.current && tooltipRef.current.parentElement) tooltipRef.current.parentElement.removeChild(tooltipRef.current);
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        tooltipRef.current = null;
      }
    };
  }, []);

  // Update on theme change
  useEffect(() => {
    if (!chartRef.current) return;
    const c = getChartHexColors(isDark);
    chartRef.current.applyOptions({
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: c.text },
      grid: { vertLines: { color: c.grid, style: 1 }, horzLines: { color: c.grid, style: 1 } },
    });
    if (seriesRef.current) {
      seriesRef.current.applyOptions({ upColor: c.upBody, downColor: c.downBody, wickUpColor: c.upWick, wickDownColor: c.downWick, borderVisible: false });
    }
  }, [isDark]);

  // Update data when points change
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;
    safeSetData(sanitizedPoints);
    if (!initialViewSetRef.current && sanitizedPoints.length > 0) {
      try {
        (chartRef.current.timeScale() as any).setVisibleLogicalRange({
          from: 0,
          to: Math.max(5, sanitizedPoints.length),
        });
      } catch {}
      initialViewSetRef.current = true;
    }
  }, [seriesKey, sanitizedPoints]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;
    const incomingKeys = new Set(overlays.map((overlay) => overlay.key));

    for (const [key, series] of overlaySeriesRef.current.entries()) {
      if (incomingKeys.has(key)) continue;
      chart.removeSeries(series);
      overlaySeriesRef.current.delete(key);
    }

    for (const overlay of overlays) {
      if (!overlay.key) continue;
      let series = overlaySeriesRef.current.get(overlay.key);
      if (!series) {
        series = chart.addSeries(LineSeries, {
          color: overlay.color,
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
          visible: overlay.visible,
        });
        overlaySeriesRef.current.set(overlay.key, series);
      }

      series.applyOptions({
        color: overlay.color,
        visible: overlay.visible,
      });
      series.setData(overlay.points as any);
    }
  }, [overlays]);

  return (
    <div className="w-full relative h-full">
      <div ref={chartContainerRef} className="w-full h-full" style={{ height: '100%', minHeight: '100%', width: '100%' }} />
    </div>
  );
}


