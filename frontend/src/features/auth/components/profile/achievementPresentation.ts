import type { Achievement } from '../../types/profileTypes';

export type AchievementPresentation = {
  total: number;
  unlockedCount: number;
  lockedCount: number;
  completionRate: number;
  unlocked: Achievement[];
  locked: Achievement[];
};

export function buildAchievementPresentation(achievements: Achievement[]): AchievementPresentation {
  const unlocked: Achievement[] = [];
  const locked: Achievement[] = [];

  for (const achievement of achievements) {
    if (achievement.achieved) {
      unlocked.push(achievement);
      continue;
    }
    locked.push(achievement);
  }

  const total = achievements.length;
  const unlockedCount = unlocked.length;
  const lockedCount = locked.length;
  const completionRate = total === 0 ? 0 : Math.round((unlockedCount / total) * 100);

  return {
    total,
    unlockedCount,
    lockedCount,
    completionRate,
    unlocked,
    locked,
  };
}
