import { apiClient } from '../../../services/apiClient';
import type { UserProfileResponse } from '../types/profileTypes';

export interface CreateUserRequest {
  user_name: string;
}

export async function createUser(payload: CreateUserRequest): Promise<UserProfileResponse> {
  // UID + email are derived server-side from the verified Firebase ID token.
  return apiClient.postJson<UserProfileResponse>('/user/', payload);
}

export async function updateUsername(user_name: string): Promise<UserProfileResponse> {
  return apiClient.putJson<UserProfileResponse>('/user/me', { user_name });
}
