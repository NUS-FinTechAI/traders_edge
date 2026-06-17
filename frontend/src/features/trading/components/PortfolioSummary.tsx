import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";

interface PortfolioSummaryProps {
  currentCash: number | null;
  reservedCash: number;
  holdingsQty: number;
  holdingsValue: number;
  longQty?: number;
  shortQty?: number;
  longValue?: number;
  shortLiability?: number;
  netWorthNow: number | null;
  totalPL: number | null;
  showDrawdown?: boolean;
  drawdownPct?: number | null;
  maxDrawdownPct?: number | null;
  hideTitle?: boolean;
}

const formatMoney = (value: number | null): string =>
  value == null
    ? "--"
    : `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

const formatPct = (value: number | null): string =>
  value == null ? "--" : `${value.toFixed(2)}%`;

export function PortfolioSummary({
  currentCash,
  reservedCash,
  holdingsQty,
  holdingsValue,
  longQty = 0,
  shortQty = 0,
  longValue = 0,
  shortLiability = 0,
  netWorthNow,
  totalPL,
  showDrawdown = false,
  drawdownPct = null,
  maxDrawdownPct = null,
  hideTitle = false,
}: PortfolioSummaryProps) {
  const cardBorder = THEME_CONFIG.colors.card.border;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const plColor =
    totalPL != null
      ? totalPL > 0
        ? THEME_CONFIG.colors.text.success
        : totalPL < 0
          ? THEME_CONFIG.colors.text.danger
          : textPrimary
      : textSecondary;
  const chipClass = `rounded-md border ${cardBorder} bg-white/80 px-2 py-1 dark:bg-slate-800/55`;

  return (
    <div className="space-y-2 p-2.5">
      {!hideTitle ? (
        <div className={`text-sm font-semibold ${textPrimary}`}>Portfolio Summary</div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <div className={chipClass}>
          <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>Net Worth</div>
          <div className={`text-base font-bold leading-tight ${textPrimary}`}>
            {formatMoney(netWorthNow)}
          </div>
        </div>
        <div className={chipClass}>
          <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>P/L</div>
          <div className={`text-base font-bold leading-tight ${plColor}`}>{formatMoney(totalPL)}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className={chipClass}>
          <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>Cash</div>
          <div className={`text-xs font-semibold ${textPrimary}`}>{formatMoney(currentCash)}</div>
        </div>
        <div className={chipClass}>
          <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>Reserved</div>
          <div className={`text-xs font-semibold ${THEME_CONFIG.colors.text.warning}`}>
            {formatMoney(reservedCash)}
          </div>
        </div>
        <div className={chipClass}>
          <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>Holdings</div>
          <div className={`text-xs font-semibold ${textPrimary}`}>{holdingsQty} sh</div>
          <div className={`text-[10px] ${textSecondary}`}>{formatMoney(holdingsValue)}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={chipClass}>
          <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>Long</div>
          <div className={`text-xs font-semibold ${THEME_CONFIG.colors.text.success}`}>
            {longQty} sh
          </div>
          <div className={`text-[10px] ${textSecondary}`}>{formatMoney(longValue)}</div>
        </div>
        <div className={chipClass}>
          <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>
            Short
          </div>
          <div className={`text-xs font-semibold ${THEME_CONFIG.colors.text.danger}`}>
            {shortQty} sh
          </div>
          <div className={`text-[10px] ${textSecondary}`}>
            Liability {formatMoney(shortLiability)}
          </div>
        </div>
      </div>

      {showDrawdown ? (
        <div className="grid grid-cols-2 gap-2">
          <div className={`${chipClass} border-rose-300/70 dark:border-rose-500/35`}>
            <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>
              Drawdown
            </div>
            <div className={`text-sm font-bold ${THEME_CONFIG.colors.text.danger}`}>
              {formatPct(drawdownPct)}
            </div>
          </div>
          <div className={`${chipClass} border-orange-300/70 dark:border-orange-500/35`}>
            <div className={`text-[10px] uppercase tracking-wide ${textSecondary}`}>
              Max DD
            </div>
            <div className={`text-sm font-bold ${THEME_CONFIG.colors.text.warning}`}>
              {formatPct(maxDrawdownPct)}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
