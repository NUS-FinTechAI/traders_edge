import type {
  PortfolioAnalytics,
  TickerMetadataDefinition,
} from "../types/tradingTypes";

interface FundamentalsPanelProps {
  tickerMetadata: Record<string, TickerMetadataDefinition>;
  analytics: PortfolioAnalytics | null;
}

const formatNumber = (
  value: number | null | undefined,
  digits: number = 2
): string => {
  if (typeof value !== "number" || !Number.isFinite(value)) return "--";
  return value.toFixed(digits);
};

export function FundamentalsPanel({
  tickerMetadata,
  analytics,
}: FundamentalsPanelProps) {
  const heldWeights = new Map<string, number>();
  for (const row of analytics?.allocation ?? []) {
    heldWeights.set(row.ticker, row.weight);
  }

  const rows = Object.entries(tickerMetadata)
    .map(([ticker, meta]) => ({
      ticker,
      meta,
      heldWeight: heldWeights.get(ticker) ?? null,
    }))
    .sort((left, right) => {
      const leftHeld = left.heldWeight ?? -1;
      const rightHeld = right.heldWeight ?? -1;
      if (rightHeld !== leftHeld) return rightHeld - leftHeld;
      return left.ticker.localeCompare(right.ticker);
    });

  if (rows.length === 0) {
    return <div className="text-xs text-slate-500">No fundamentals available.</div>;
  }

  return (
    <div className="space-y-2 text-xs" data-testid="fundamentals-panel">
      <div className="text-[11px] text-slate-500">
        Held names are highlighted to support allocation decisions.
      </div>
      <div className="max-h-56 overflow-auto rounded-md border border-slate-200">
        <table className="min-w-full text-[11px]">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-2 py-1 text-left">Ticker</th>
              <th className="px-2 py-1 text-left">Sector</th>
              <th className="px-2 py-1 text-right">P/E</th>
              <th className="px-2 py-1 text-right">ROE%</th>
              <th className="px-2 py-1 text-right">D/E</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isHeld = row.heldWeight != null && row.heldWeight > 0;
              return (
                <tr
                  key={row.ticker}
                  className={isHeld ? "bg-emerald-50/70" : "bg-white"}
                >
                  <td className="px-2 py-1 font-semibold text-slate-700">
                    {row.ticker}
                  </td>
                  <td className="px-2 py-1 text-slate-600">
                    {row.meta.sector_key.replace(/_/g, " ")}
                  </td>
                  <td className="px-2 py-1 text-right text-slate-600">
                    {formatNumber(row.meta.pe_ratio)}
                  </td>
                  <td className="px-2 py-1 text-right text-slate-600">
                    {formatNumber(row.meta.roe_pct)}
                  </td>
                  <td className="px-2 py-1 text-right text-slate-600">
                    {formatNumber(row.meta.debt_to_equity)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

