import { apiClient } from '../../../services/apiClient';
import type { UserProfileResponse } from '../types/profileTypes';

export async function getCurrentUser(): Promise<UserProfileResponse> {
  return apiClient.getJson<UserProfileResponse>('/user/me');
}
