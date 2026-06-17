import { CheckCircle2, Target, Trophy, XCircle } from "lucide-react";
import { Card } from "../../../shared/ui/Card";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import type { GameEndMissionResult } from "../types/tradingTypes";

interface GameEndMissionResultsSectionProps {
  missions: GameEndMissionResult[];
}

interface MissionGroupProps {
  title: string;
  icon: "target" | "trophy";
  missions: GameEndMissionResult[];
}

function MissionGroup({ title, icon, missions }: MissionGroupProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const successText = THEME_CONFIG.colors.text.success;
  const dangerText = THEME_CONFIG.colors.text.danger;
  const cardBorder = THEME_CONFIG.colors.border.default;
  const cardBgElevated = THEME_CONFIG.colors.card.backgroundElevated;
  const completedCount = missions.filter((mission) => mission.completed).length;

  return (
    <div className={`rounded-lg ${cardBgElevated} border ${cardBorder} p-3 space-y-2`}>
      <div className="flex items-center justify-between gap-3">
        <div className={`flex items-center gap-2 font-medium ${textPrimary}`}>
          {icon === "target" ? <Target size={16} /> : <Trophy size={16} />}
          {title}
        </div>
        <div className={`text-xs ${textSecondary}`}>{completedCount}/{missions.length} complete</div>
      </div>
      {missions.length > 0 ? (
        missions.map((mission) => (
          <div key={mission.id} className={`flex items-start justify-between gap-3 rounded-md border ${cardBorder} p-2`}>
            <div>
              <div className="text-sm">{mission.title}</div>
              <div className={`text-xs ${textSecondary}`}>{mission.description}</div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {mission.completed ? (
                <CheckCircle2 className={successText} size={16} />
              ) : (
                <XCircle className={dangerText} size={16} />
              )}
              <span className={`text-xs ${mission.completed ? successText : dangerText}`}>
                {mission.completed ? `+${mission.points} pts` : "0 pts"}
              </span>
            </div>
          </div>
        ))
      ) : (
        <div className={`text-sm ${textSecondary}`}>No missions.</div>
      )}
    </div>
  );
}

export function GameEndMissionResultsSection({ missions }: GameEndMissionResultsSectionProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const requiredMissions = missions.filter((mission) => !mission.isBonus);
  const bonusMissions = missions.filter((mission) => mission.isBonus);

  return (
    <Card
      className={textPrimary}
      collapsible
      title="Mission Results"
      defaultCollapsed={false}
      contentClassName="p-3 space-y-3"
      headerClassName="px-3 py-2"
    >
      <MissionGroup title="Passing Criteria" icon="target" missions={requiredMissions} />
      <MissionGroup title="Bonus Missions" icon="trophy" missions={bonusMissions} />
    </Card>
  );
}
