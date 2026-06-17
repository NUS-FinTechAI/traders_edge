import { THEME_CONFIG } from '../../../../shared/ui/config/themeConfig';
import { useAuthContext } from '../../../../providers/AuthProvider';
import { TrophiesSection } from './AchievementsSection';

export function UserProfile() {
  const { user } = useAuthContext();
  const backgroundClass = THEME_CONFIG.colors.background.primary;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  return (
    <div className={`h-full w-full ${backgroundClass} p-6 overflow-y-auto`}>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className={`text-2xl sm:text-3xl font-semibold ${textPrimary}`}>Profile</h1>
        <div className="space-y-2">
          <div className={`${textSecondary}`}>Username: <span className={`${textPrimary}`}>{user?.username ?? '—'}</span></div>
          <div className={`${textSecondary}`}>Email: <span className={`${textPrimary}`}>{user?.email ?? '—'}</span></div>
          <div className={`${textSecondary}`}>User ID: <span className={`${textPrimary}`}>{user?.id ?? '—'}</span></div>
        </div>

        <TrophiesSection />
      </div>
    </div>
  );
}


