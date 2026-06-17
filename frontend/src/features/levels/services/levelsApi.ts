import type { FetchLevelsResponse } from "../types/levelTypes";
import { apiClient } from "../../../services/apiClient";

export async function fetchLevels(): Promise<FetchLevelsResponse> {
  return apiClient.getJson<FetchLevelsResponse>("/game/me");
}
