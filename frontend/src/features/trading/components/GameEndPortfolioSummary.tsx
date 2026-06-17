import { Wallet, Landmark, ChartCandlestick } from "lucide-react";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";

interface GameEndPortfolioSummaryProps {
  netWorth: number;
  endingCash: number;
  sharesValue: number;
}

const formatMoney = (value: number) =>
  value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function GameEndPortfolioSummary({ netWorth, endingCash, sharesValue }: GameEndPortfolioSummaryProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const cardBorder = THEME_CONFIG.colors.border.default;
  const cardBgElevated = THEME_CONFIG.colors.card.backgroundElevated;

  return (
    <div className={`rounded-lg border ${cardBorder} p-3`}>
      <div className={`text-sm font-semibold ${textPrimary} mb-2`}>Final Portfolio</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className={`rounded-md border ${cardBorder} ${cardBgElevated} p-2`}>
          <div className={`flex items-center gap-1 text-xs ${textSecondary}`}>
            <Wallet size={14} />
            Net Worth
          </div>
          <div className={`text-sm font-semibold ${textPrimary}`}>${formatMoney(netWorth)}</div>
        </div>
        <div className={`rounded-md border ${cardBorder} ${cardBgElevated} p-2`}>
          <div className={`flex items-center gap-1 text-xs ${textSecondary}`}>
            <Landmark size={14} />
            Cash
          </div>
          <div className={`text-sm font-semibold ${textPrimary}`}>${formatMoney(endingCash)}</div>
        </div>
        <div className={`rounded-md border ${cardBorder} ${cardBgElevated} p-2`}>
          <div className={`flex items-center gap-1 text-xs ${textSecondary}`}>
            <ChartCandlestick size={14} />
            Shares Value
          </div>
          <div className={`text-sm font-semibold ${textPrimary}`}>${formatMoney(sharesValue)}</div>
        </div>
      </div>
    </div>
  );
}
