import { apiClient } from '../../../services/apiClient';
import type { Achievement, AchievementIconKey } from '../../auth/types/profileTypes';

type AchievementResponseItem = {
  achievement_id: string;
  title: string;
  hint: string;
  description: string;
  icon_key: string;
  achieved: boolean;
};

export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  const data = await apiClient.getJson<AchievementResponseItem[]>(
    `/progression/achievements/${encodeURIComponent(userId)}`
  );
  return data.map((item) => ({
    id: item.achievement_id,
    title: item.title,
    hint: item.hint,
    description: item.description,
    iconKey: item.icon_key as AchievementIconKey,
    achieved: item.achieved,
  }));
}
