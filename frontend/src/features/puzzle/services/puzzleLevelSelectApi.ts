import { apiClient } from '../../../services/apiClient';
import type { PuzzleLevel } from '../types/puzzleLevelSelectTypes';

export async function fetchPuzzleLevels(): Promise<PuzzleLevel[]> {
  const resp = await apiClient.getJson<PuzzleLevel[]>('/game/puzzle/me');
  if (!Array.isArray(resp)) return [];
  return resp as PuzzleLevel[];
}
