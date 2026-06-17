import type { PortfolioAnalytics } from "../types/tradingTypes";

interface SectorExposurePanelProps {
  analytics: PortfolioAnalytics | null;
}

const formatPct = (value: number | null | undefined): string =>
  typeof value === "number" && Number.isFinite(value)
    ? `${(value * 100).toFixed(1)}%`
    : "--";

export function SectorExposurePanel({ analytics }: SectorExposurePanelProps) {
  const sectors = analytics?.sectors ?? [];

  if (sectors.length === 0) {
    return <div className="text-xs text-slate-500">No sector exposure yet.</div>;
  }

  return (
    <div className="space-y-2 text-xs" data-testid="sector-exposure-panel">
      <div className="space-y-1.5">
        {sectors.map((sector) => (
          <div key={sector.sector_key} className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-700 capitalize">
                {sector.sector_key.replace(/_/g, " ")}
              </span>
              <span className="text-slate-600">{formatPct(sector.weight)}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded bg-slate-200">
              <div
                className="h-full rounded bg-sky-500"
                style={{ width: `${Math.max(0, Math.min(100, sector.weight * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
