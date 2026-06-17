import type { RefObject } from "react";
import type { PortfolioAnalytics } from "../types/tradingTypes";

interface BenchmarkPanelProps {
  analytics: PortfolioAnalytics | null;
  portfolioReturnCardRef?: RefObject<HTMLDivElement | null>;
  benchmarkReturnCardRef?: RefObject<HTMLDivElement | null>;
  excessReturnCardRef?: RefObject<HTMLDivElement | null>;
}

const formatPct = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value)
    ? `${(value * 100).toFixed(2)}%`
    : "--";

export function BenchmarkPanel({
  analytics,
  portfolioReturnCardRef,
  benchmarkReturnCardRef,
  excessReturnCardRef,
}: BenchmarkPanelProps) {
  const benchmark = analytics?.benchmark;

  if (!benchmark) {
    return <div className="text-xs text-slate-500">Benchmark data unavailable.</div>;
  }

  return (
    <div className="space-y-2 text-xs" data-testid="benchmark-panel">
      <div className="grid grid-cols-3 gap-2">
        <div
          ref={portfolioReturnCardRef}
          className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5"
        >
          <div className="text-[11px] text-slate-500">Portfolio Return</div>
          <div className="text-sm font-semibold text-slate-700">
            {formatPct(benchmark.portfolio_return)}
          </div>
        </div>
        <div
          ref={benchmarkReturnCardRef}
          className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5"
        >
          <div className="text-[11px] text-slate-500">Benchmark Return</div>
          <div className="text-sm font-semibold text-slate-700">
            {formatPct(benchmark.benchmark_return)}
          </div>
        </div>
        <div
          ref={excessReturnCardRef}
          className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5"
        >
          <div className="text-[11px] text-slate-500">Excess Return</div>
          <div
            className={`text-sm font-semibold ${
              (benchmark.excess_return ?? 0) >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {formatPct(benchmark.excess_return)}
          </div>
        </div>
      </div>
    </div>
  );
}
