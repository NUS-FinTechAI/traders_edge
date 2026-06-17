import type { LucideIcon } from 'lucide-react';
import type { Achievement } from '../../types/profileTypes';
import { ACHIEVEMENT_ICONS, DEFAULT_ACHIEVEMENT_ICON } from '../../services/achievementIconService';
import { THEME_CONFIG } from '../../../../shared/ui/config/themeConfig';

export function getAchievementIcon(iconKey: Achievement['iconKey']): LucideIcon {
  return ACHIEVEMENT_ICONS[iconKey] ?? DEFAULT_ACHIEVEMENT_ICON;
}

export function getAchievementIconColorClass(achieved: boolean): string {
  return achieved
    ? THEME_CONFIG.colors.achievement.iconEarned
    : THEME_CONFIG.colors.achievement.iconLocked;
}
