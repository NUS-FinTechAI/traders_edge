import { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
import { THEME_CONFIG } from '../../../../shared/ui/config/themeConfig';
import { Card } from '../../../../shared/ui/Card';
import { fetchAchievements } from '../../services/achievementsService';
import type { Achievement } from '../../types/profileTypes';
import { TrophyInfoPopup } from './AchievementInfoPopup';
import { useAuthContext } from '../../../../providers/AuthProvider';
import { buildAchievementPresentation } from './achievementPresentation';
import { AchievementGroup } from './AchievementGroup';

export function TrophiesSection() {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const { user } = useAuthContext();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [active, setActive] = useState<Achievement | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchAchievements(user.id);
        if (!isMounted) return;
        setAchievements(data);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load achievements.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const presentation = useMemo(() => buildAchievementPresentation(achievements), [achievements]);

  const summaryLabel = presentation.total === 0
    ? 'No achievements available yet'
    : `${presentation.unlockedCount}/${presentation.total} unlocked`;

  return (
    <section className="space-y-4" data-testid="achievements-section">
      <Card className="relative overflow-hidden border-slate-200 dark:border-slate-600 bg-gradient-to-r from-amber-50/80 to-emerald-50/60 dark:from-slate-800 dark:to-slate-700">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-emerald-400/15 dark:bg-emerald-300/10 pointer-events-none" />
        <div className="relative p-4 sm:p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className={`inline-flex items-center gap-2 text-lg font-semibold ${textPrimary}`}>
                <Trophy className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                Achievements
              </div>
              <div className={`text-sm ${textSecondary}`}>
                Track your progression and unlock milestones across game modes.
              </div>
            </div>
            <div className={`rounded-full border ${THEME_CONFIG.colors.card.border} px-2.5 py-1 text-xs font-medium ${textSecondary}`} data-testid="achievements-summary-label">
              {summaryLabel}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className={textSecondary}>Completion</span>
              <span className={`${textPrimary} font-medium`} data-testid="achievements-completion-rate">
                {presentation.completionRate}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-400 transition-[width] duration-500 ease-out"
                style={{ width: `${presentation.completionRate}%` }}
                aria-hidden="true"
              />
            </div>
            <div className={`text-xs ${textSecondary}`}>
              {presentation.lockedCount > 0
                ? `${presentation.lockedCount} achievement${presentation.lockedCount > 1 ? 's' : ''} left to unlock`
                : 'All achievements unlocked'}
            </div>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Loading achievements">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={`achievement-skeleton-${index}`}
              className="h-44 rounded-2xl border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/60 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-700/40 dark:bg-red-900/20 px-4 py-3 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : presentation.total === 0 ? (
        <div className={`rounded-xl border ${THEME_CONFIG.colors.card.border} ${THEME_CONFIG.colors.card.backgroundElevated} px-4 py-5 ${textSecondary}`}>
          No achievements available yet. Complete levels and challenges to start collecting them.
        </div>
      ) : (
        <div className="space-y-5">
          <AchievementGroup
            title="Unlocked"
            description="Completed milestones you have already earned."
            achievements={presentation.unlocked}
            onAchievementClick={(achievement) => { setActive(achievement); }}
            emptyMessage="No unlocked achievements yet. Keep playing to earn your first one."
            achievedGroup
            testId="achievements-group-unlocked"
          />
          <AchievementGroup
            title="Locked"
            description="Upcoming milestones and hints to help you get there."
            achievements={presentation.locked}
            onAchievementClick={(achievement) => { setActive(achievement); }}
            emptyMessage="Everything is unlocked. Great run."
            testId="achievements-group-locked"
          />
        </div>
      )}

      <TrophyInfoPopup trophy={active} isOpen={!!active} onClose={() => setActive(null)} />
    </section>
  );
}
