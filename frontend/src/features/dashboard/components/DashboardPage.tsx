import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { useAuthContext } from '../../../providers/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '../../../shared/ui/Card';
import { ActivityCalendarSection } from './ActivityCalendarSection';
import { GamesSection } from './GamesSection';
import { DailyStreak } from './DailyStreak';

export function DashboardPage() {
  const { user } = useAuthContext();
  const backgroundClass = THEME_CONFIG.colors.background.primary;
  const textPrimary = THEME_CONFIG.colors.text.primary;


  return (
    <div className={`h-full w-full ${backgroundClass} p-6 overflow-y-auto`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className={`text-2xl sm:text-3xl font-semibold ${textPrimary}`}>Welcome back, {user?.username ?? 'Trader'}.</div>

        <Card elevated className="">
          <CardHeader>
            <CardTitle>Your Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className={THEME_CONFIG.colors.card.background}>
            <DailyStreak />
            <ActivityCalendarSection />
          </CardContent>
        </Card>
        <GamesSection />
      </div>
    </div>
  );
}


