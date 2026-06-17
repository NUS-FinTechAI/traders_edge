import { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { fetchActivityStreak, fetchLast7DaysActivity } from '../services/dashboardApi';
import { useAuthContext } from '../../../providers/AuthProvider';

export function DailyStreak() {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.muted;
  const borderDefault = THEME_CONFIG.colors.border.default;
  const { user } = useAuthContext();
  const [days, setDays] = useState<Array<{ date: string; hasActivity: boolean }>>([]);
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [lastActiveDate, setLastActiveDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
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
        const [streakData, last7] = await Promise.all([
          fetchActivityStreak(user.id),
          fetchLast7DaysActivity(user.id)
        ]);
        if (!isMounted) return;
        setCurrentStreak(streakData.current_streak ?? 0);
        setLastActiveDate(streakData.last_active_date ?? null);
        setDays(
          (last7.days ?? []).map((day) => ({
            date: day.date,
            hasActivity: day.has_activity
          }))
        );
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load streak.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const formattedDays = useMemo(
    () =>
      days.map((day) => {
        const dateObj = new Date(`${day.date}T00:00:00`);
        const label = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        return {
          key: day.date,
          label,
          letter: label[0],
          played: day.hasActivity
        };
      }),
    [days]
  );

  const lastActiveLabel = useMemo(() => {
    if (!lastActiveDate) return 'No recent activity';
    const dateObj = new Date(`${lastActiveDate}T00:00:00`);
    return `Last active ${dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}`;
  }, [lastActiveDate]);

  return (
    <div className={`w-full mb-10`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-2 ${textPrimary}`}>
          <Flame className="w-5 h-5 text-emerald-500" />
          <span className="font-semibold">Daily Streak</span>
        </div>
        <div className={`text-sm ${textSecondary}`} title={lastActiveLabel}>
          {isLoading
            ? 'Loading...'
            : error
            ? 'Unable to load streak'
            : currentStreak > 0
            ? `${currentStreak} day${currentStreak > 1 ? 's' : ''}`
            : 'No current streak'}
        </div>
      </div>

      <div className={`w-full flex items-center justify-center gap-6 md:gap-8 rounded-lg p-3 ${THEME_CONFIG.colors.card.backgroundElevated} border ${borderDefault}`}>
        {isLoading ? (
          <div className={`${textSecondary}`}>Loading activity...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          formattedDays.map((day) => {
            const played = day.played;
            const circleClasses = played
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200';

            return (
              <div key={day.key} className="flex flex-col items-center justify-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${circleClasses}`}
                  title={`${day.label}: ${played ? 'Played' : 'Missed'}`}
                  aria-label={`${day.label}: ${played ? 'Played' : 'Missed'}`}
                >
                  {day.letter}
                </div>
                <span className={`mt-1 text-xs ${textSecondary}`}>{day.label}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


