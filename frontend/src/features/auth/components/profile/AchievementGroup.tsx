import { Lock, Sparkles } from 'lucide-react';
import { THEME_CONFIG } from '../../../../shared/ui/config/themeConfig';
import type { Achievement } from '../../types/profileTypes';
import { AchievementCard } from './AchievementTile';

interface AchievementGroupProps {
  title: string;
  description: string;
  achievements: Achievement[];
  onAchievementClick: (achievement: Achievement) => void;
  emptyMessage: string;
  achievedGroup?: boolean;
  testId: string;
}

export function AchievementGroup({
  title,
  description,
  achievements,
  onAchievementClick,
  emptyMessage,
  achievedGroup = false,
  testId,
}: AchievementGroupProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  const GroupIcon = achievedGroup ? Sparkles : Lock;
  const iconClass = achievedGroup
    ? 'text-emerald-500 dark:text-emerald-400'
    : 'text-slate-500 dark:text-slate-300';

  return (
    <div className="space-y-3" data-testid={testId}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className={`inline-flex items-center gap-2 text-base font-semibold ${textPrimary}`}>
            <GroupIcon className={iconClass} size={18} />
            {title}
          </div>
          <div className={`text-sm ${textSecondary}`}>{description}</div>
        </div>
        <div className={`text-xs rounded-full px-2 py-1 border ${THEME_CONFIG.colors.card.border} ${textSecondary}`}>
          {achievements.length}
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className={`rounded-xl border ${THEME_CONFIG.colors.card.border} ${THEME_CONFIG.colors.card.backgroundElevated} px-4 py-3 text-sm ${textSecondary}`}>
          {emptyMessage}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
              onClick={onAchievementClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
