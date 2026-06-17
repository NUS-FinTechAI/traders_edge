import { apiClient } from "../../../services/apiClient";

type LeaderboardDto = {
  user_id: string;
  user_name: string;
  best_points: number;
};

export type LeaderboardRow = {
  userId: string;
  userName: string;
  score: number;
  rank: number;
  isUser?: boolean;
};

export async function fetchLeaderboard(
  levelId: string,
  currentUserId?: string | null
): Promise<LeaderboardRow[]> {
  const resp = await apiClient.getJson<LeaderboardDto[]>(
    `/game/leaderboard/${encodeURIComponent(levelId)}`
  );
  if (!Array.isArray(resp) || resp.length === 0) {
    return [];
  }
  return resp.map((row, idx) => ({
    userId: row.user_id,
    userName: row.user_name,
    score: row.best_points,
    rank: idx + 1,
    isUser: currentUserId ? row.user_id === currentUserId : false,
  }));
}
