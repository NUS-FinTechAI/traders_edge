import type { PortfolioAnalytics } from "../types/tradingTypes";

interface BetaVolatilityPanelProps {
  analytics: PortfolioAnalytics | null;
}

const formatValue = (
  value: number | null | undefined,
  digits: number = 2
): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toFixed(digits);
};

const formatPct = (value: number | null | undefined): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return `${(value * 100).toFixed(2)}%`;
};

export function BetaVolatilityPanel({ analytics }: BetaVolatilityPanelProps) {
  const risk = analytics?.risk;
  if (!risk) {
    return <div className="text-xs text-slate-500">Risk metrics unavailable.</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 text-xs" data-testid="beta-volatility-panel">
      <div className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5">
        <div className="text-[11px] text-slate-500">Portfolio Beta</div>
        <div className="text-sm font-semibold text-slate-700">
          {formatValue(risk.beta)}
        </div>
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5">
        <div className="text-[11px] text-slate-500">Volatility</div>
        <div className="text-sm font-semibold text-slate-700">
          {formatPct(risk.volatility)}
        </div>
      </div>
      <div className="rounded-md border border-slate-200 bg-slate-50/70 px-2 py-1.5">
        <div className="text-[11px] text-slate-500">HHI</div>
        <div className="text-sm font-semibold text-slate-700">
          {formatValue(risk.hhi, 3)}
        </div>
      </div>
    </div>
  );
}

