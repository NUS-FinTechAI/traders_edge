import { apiClient } from '../../../services/apiClient';

export interface ActivityStreakResponse {
  current_streak: number;
  last_active_date: string | null;
}

export interface Last7DaysResponse {
  days: Array<{
    date: string;
    has_activity: boolean;
  }>;
}

export interface Last365DaysResponse {
  days: Array<{
    date: string;
    activity_count: number;
  }>;
}

export async function fetchActivityStreak(userId: string): Promise<ActivityStreakResponse> {
  return apiClient.getJson<ActivityStreakResponse>(
    `/progression/activity/${encodeURIComponent(userId)}/streak`
  );
}

export async function fetchLast7DaysActivity(userId: string): Promise<Last7DaysResponse> {
  return apiClient.getJson<Last7DaysResponse>(
    `/progression/activity/${encodeURIComponent(userId)}/last-7-days`
  );
}

export async function fetchLast365DaysActivity(userId: string): Promise<Last365DaysResponse> {
  return apiClient.getJson<Last365DaysResponse>(
    `/progression/activity/${encodeURIComponent(userId)}/last-365-days`
  );
}

