import { ChevronRight } from 'lucide-react';
import { Card } from '../../../../shared/ui/Card';
import { THEME_CONFIG } from '../../../../shared/ui/config/themeConfig';
import type { Achievement } from '../../types/profileTypes';
import { getAchievementIcon, getAchievementIconColorClass } from './achievementIcon';

interface AchievementCardProps {
  achievement: Achievement;
  onClick?: (achievement: Achievement) => void;
}

export function AchievementCard({ achievement, onClick }: AchievementCardProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const muted = THEME_CONFIG.colors.text.muted;
  const achieved = achievement.achieved;
  const Icon = getAchievementIcon(achievement.iconKey);

  const containerClass = achieved
    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-700/50 hover:border-emerald-300 dark:hover:border-emerald-500/60'
    : 'bg-slate-50/90 dark:bg-slate-800/80 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500';

  const iconChipClass = achieved
    ? 'bg-emerald-500/10 border-emerald-300/60 dark:border-emerald-600/50'
    : 'bg-slate-200/70 dark:bg-slate-700/70 border-slate-300 dark:border-slate-600';

  const badgeClass = achieved
    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/70 dark:border-emerald-600/60'
    : 'bg-slate-200/60 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 border-slate-300/80 dark:border-slate-500';

  return (
    <button
      type="button"
      className="w-full h-full text-left group cursor-pointer"
      onClick={() => onClick?.(achievement)}
      aria-label={`View achievement ${achievement.title}`}
      data-testid={`achievement-card-${achievement.id}`}
    >
      <Card className={`h-full rounded-2xl border overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${containerClass}`}>
        <div className="h-full p-4 flex flex-col gap-3 relative">
          {achieved ? (
            <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-emerald-400/15 dark:bg-emerald-300/10" />
          ) : null}

          <div className="flex items-start justify-between gap-3">
            <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${iconChipClass}`}>
              <Icon className={`w-7 h-7 ${getAchievementIconColorClass(achieved)}`} />
            </div>
            <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
              {achieved ? 'Unlocked' : 'Locked'}
            </span>
          </div>

          <div className="space-y-1 min-h-[4.5rem]">
            <div className={`font-semibold ${textPrimary}`}>{achievement.title}</div>
            <div className={`text-sm ${textSecondary}`}>
              {achieved ? achievement.description : `Hint: ${achievement.hint}`}
            </div>
          </div>

          <div className={`mt-auto text-xs ${muted} inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform`}>
            View details
            <ChevronRight size={14} />
          </div>
        </div>
      </Card>
    </button>
  );
}


