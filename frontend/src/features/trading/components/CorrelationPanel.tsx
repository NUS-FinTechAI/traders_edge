import type { PortfolioAnalytics } from "../types/tradingTypes";

interface CorrelationPanelProps {
  analytics: PortfolioAnalytics | null;
}

const formatPct = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value)
    ? `${(value * 100).toFixed(1)}%`
    : "--";

const formatCorr = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value) ? value.toFixed(2) : "--";

export function CorrelationPanel({ analytics }: CorrelationPanelProps) {
  const avgCorrelation = analytics?.risk?.average_correlation ?? null;
  const minAvgCorrelation = analytics?.risk?.min_avg_abs_correlation ?? null;
  const heldCount = analytics?.allocation?.length ?? 0;

  if (heldCount < 2) {
    return (
      <div className="text-xs text-slate-500" data-testid="correlation-panel">
        Hold at least two names to evaluate pairwise correlation.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs" data-testid="correlation-panel">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5">
          <div className="text-[11px] text-slate-500">Average Correlation</div>
          <div className="text-sm font-semibold text-slate-700">
            {formatCorr(avgCorrelation)}
          </div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5">
          <div className="text-[11px] text-slate-500">Lowest Avg Pair Corr</div>
          <div className="text-sm font-semibold text-slate-700">
            {formatCorr(minAvgCorrelation)}
          </div>
        </div>
      </div>
      <div className="text-[11px] text-slate-500">
        Lower values suggest stronger diversification potential across holdings.
      </div>
      <div className="text-[11px] text-slate-500">
        Diversification score proxy: {formatPct(minAvgCorrelation != null ? 1 - minAvgCorrelation : null)}
      </div>
    </div>
  );
}

