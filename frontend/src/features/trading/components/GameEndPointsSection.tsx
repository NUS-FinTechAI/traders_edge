import { Card } from "../../../shared/ui/Card";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import type { GameEndRespPayload } from "../types/tradingTypes";

interface GameEndPointsSectionProps {
  data: Pick<GameEndRespPayload, "totalPoints" | "finalCashPoints" | "missionPoints" | "bonusPoints">;
}

export function GameEndPointsSection({ data }: GameEndPointsSectionProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const cardBorder = THEME_CONFIG.colors.border.default;
  const cardBgElevated = THEME_CONFIG.colors.card.backgroundElevated;

  return (
    <Card
      className={textPrimary}
      collapsible
      title="Points Earned"
      defaultCollapsed={false}
      contentClassName="p-3 space-y-2"
      headerClassName="px-3 py-2"
    >
      <div className={textSecondary}>
        Total: {data.totalPoints.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts
      </div>
      <div className={`rounded-md border ${cardBorder} ${cardBgElevated} p-2 space-y-1`}>
        <div className={textSecondary}>
          Final Cash: {data.finalCashPoints.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts
        </div>
        <div className={textSecondary}>
          Passing Missions: {data.missionPoints.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts
        </div>
        <div className={textSecondary}>
          Bonus Missions: {data.bonusPoints.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} pts
        </div>
      </div>
    </Card>
  );
}
