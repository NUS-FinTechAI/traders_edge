import type { PortfolioAnalytics } from "../types/tradingTypes";

interface PortfolioAllocationPanelProps {
  analytics: PortfolioAnalytics | null;
}

const formatPct = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value)
    ? `${(value * 100).toFixed(1)}%`
    : "--";

const formatMoney = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value)
    ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    : "--";

export function PortfolioAllocationPanel({ analytics }: PortfolioAllocationPanelProps) {
  const allocation = analytics?.allocation ?? [];
  const largestWeight = analytics?.risk?.largest_position_weight ?? 0;

  if (allocation.length === 0) {
    return (
      <div className="text-xs text-slate-500" data-testid="portfolio-allocation-panel">
        No active positions yet.
      </div>
    );
  }

  return (
    <div className="space-y-2 text-xs" data-testid="portfolio-allocation-panel">
      <div className="flex items-center justify-between text-slate-500">
        <span>Largest Position</span>
        <span className="font-semibold text-slate-700">{formatPct(largestWeight)}</span>
      </div>
      <div className="space-y-1.5">
        {allocation.map((row) => (
          <div key={row.ticker} className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-700">{row.ticker}</span>
              <span className="text-slate-600">{formatPct(row.weight)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200">
              <div
                className="h-full rounded bg-emerald-500"
                style={{ width: `${Math.max(0, Math.min(100, row.weight * 100))}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>{typeof row.qty === "number" ? `${row.qty} shares` : ""}</span>
              <span>{formatMoney(row.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
