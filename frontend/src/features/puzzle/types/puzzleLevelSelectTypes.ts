export interface PuzzleLevel {
  level_id?: string;
  puzzle_id: string;
  title: string;
  level_order: number;
  attempted: boolean;
  best_points?: number;
  progress: Record<string, unknown>;
  available: boolean;
}

