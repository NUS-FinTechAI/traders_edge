import { Target, Trophy } from "lucide-react";
import type { MissionDefinition, PassingCriteria } from "../types/tradingTypes";
import { Popup } from "../../../shared/ui/Popup";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";

interface MissionsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  passingCriteria: PassingCriteria | null;
  bonusMissions: MissionDefinition[];
}

export function MissionsPopup({ isOpen, onClose, passingCriteria, bonusMissions }: MissionsPopupProps) {
  const cardBorder = THEME_CONFIG.colors.card.border;
  const cardBgElevated = THEME_CONFIG.colors.card.backgroundElevated;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const passingMissions = passingCriteria?.missions ?? [];

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="Level Missions">
      <div className="space-y-3">
        <div className={`rounded-lg border ${cardBorder} ${cardBgElevated} p-3`}>
          <div className={`text-sm font-semibold ${textPrimary}`}>How Points Work</div>
          <div className={`mt-1 text-xs leading-relaxed ${textSecondary}`}>
            Points affect leaderboard ranking. Your total points combine your ending
            balance points with points earned from passing and bonus missions.
          </div>
        </div>

        <section className={`rounded-lg border ${cardBorder}`}>
          <div className={`rounded-t-lg ${cardBgElevated} p-3`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`flex items-center gap-2 text-sm font-semibold ${textPrimary}`}>
                <Target className="h-4 w-4" />
                Passing Missions
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${THEME_CONFIG.colors.action.successOutline}`}>
                {passingMissions.length} missions
              </span>
            </div>
            <div className={`mt-1 text-xs ${textSecondary}`}>
              Required to pass the level.
            </div>
          </div>
          <div className="p-3">
            {passingMissions.length > 0 ? (
              <div className="space-y-1.5">
                {passingMissions.map((mission) => (
                  <div key={mission.id} className={`rounded-lg border ${cardBorder} p-2.5`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className={`text-sm font-medium leading-snug ${textPrimary}`}>{mission.title}</div>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${THEME_CONFIG.colors.action.successOutline}`}>
                        {mission.points} pts
                      </span>
                    </div>
                    <div className={`mt-0.5 text-xs leading-snug ${textSecondary}`}>{mission.description}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`rounded-lg border border-dashed ${cardBorder} p-2.5 text-xs ${textSecondary}`}>
                No required missions.
              </div>
            )}
          </div>
        </section>

        <section className={`rounded-lg border ${cardBorder}`}>
          <div className={`rounded-t-lg ${cardBgElevated} p-3`}>
            <div className="flex items-center justify-between gap-3">
              <div className={`flex items-center gap-2 text-sm font-semibold ${textPrimary}`}>
                <Trophy className="h-4 w-4" />
                Bonus Missions
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${THEME_CONFIG.colors.action.dangerOutline}`}>
                {bonusMissions.length} missions
              </span>
            </div>
            <div className={`mt-1 text-xs ${textSecondary}`}>
              Optional missions for extra points.
            </div>
          </div>
          <div className="p-3">
            {bonusMissions.length > 0 ? (
              <div className="space-y-1.5">
                {bonusMissions.map((mission) => (
                <div key={mission.id} className={`rounded-lg border ${cardBorder} p-2.5`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className={`text-sm font-medium leading-snug ${textPrimary}`}>{mission.title}</div>
                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${THEME_CONFIG.colors.action.successOutline}`}>
                      {mission.points} pts
                    </span>
                  </div>
                  <div className={`mt-0.5 text-xs leading-snug ${textSecondary}`}>{mission.description}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className={`rounded-lg border border-dashed ${cardBorder} p-2.5 text-xs ${textSecondary}`}>
              No bonus missions.
            </div>
          )}
          </div>
        </section>
      </div>
    </Popup>
  );
}
