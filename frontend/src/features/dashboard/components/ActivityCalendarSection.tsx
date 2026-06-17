import ActivityCalendar, { type Activity } from 'react-activity-calendar';
import Tooltip from '@mui/material/Tooltip';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { useTheme } from '../../../providers/ThemeProvider';
import { useEffect, useMemo, useState } from 'react';
import { fetchLast365DaysActivity } from '../services/dashboardApi';
import { useAuthContext } from '../../../providers/AuthProvider';

export function ActivityCalendarSection() {
  const { isDark } = useTheme();
  const { user } = useAuthContext();
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const [data, setData] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tooltipTitle = useMemo(
    () => (activity: Activity) =>
      activity.count > 1
        ? `Traded ${activity.count} times on ${activity.date}`
        : activity.count === 1
        ? `Traded ${activity.count} time on ${activity.date}`
        : `No activities on ${activity.date}`,
    []
  );

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
        const last365 = await fetchLast365DaysActivity(user.id);
        if (!isMounted) return;
        const activityMap = new Map(
          (last365.days ?? []).map((day) => [day.date, day.activity_count])
        );
        const today = new Date();
        const days: Activity[] = [];
        for (let i = 364; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const date = d.toISOString().slice(0, 10);
          const count = activityMap.get(date) ?? 0;
          const level = Math.max(0, Math.min(count, 4)) as 0 | 1 | 2 | 3 | 4;
          days.push({ date, count, level });
        }
        setData(days);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load activity data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);
  return (
    <div className={`overflow-x-auto ${textPrimary} w-full flex justify-center`}>
      {isLoading ? (
        <div className={textPrimary}>Loading activity...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : (
        <ActivityCalendar
          data={data}
          showWeekdayLabels
          blockSize={12}
          blockMargin={4}
          weekStart={1}
          labels={{
            totalCount: '{{count}} activities in the past year',
            legend: { less: 'Less', more: 'More' },
          }}
          theme={THEME_CONFIG.colors.activity.calendarColors as any}
          colorScheme={isDark ? 'dark' : 'light'}
          renderBlock={(block, activity) => (
            <Tooltip title={tooltipTitle(activity)}>
              {block}
            </Tooltip>
          )}
        />
      )}
    </div>
  );
}

