export interface LevelProgress {
  cash?: number;
  curr_date_index?: number;
  logbook?: Record<string, unknown>;
  timestamp?: string;
}

export interface TutorialLevel {
  level_id?: string;
  tutorial_id: string;
  title: string;
  level_order: number;
  module: number;
  attempted: boolean;
  completed: boolean;
  available: boolean;
  best_points?: number;
  progress?: LevelProgress | Record<string, never>;
}

export interface QuizProgress {
  quiz_id?: string | null;
  available: boolean;
  completed?: boolean | null;
  best_score?: number | null;
  module: number;
}

export interface ModuleProgress {
  levels: TutorialLevel[];
  "pre-quiz": QuizProgress;
  "post-quiz": QuizProgress;
}

export type FetchLevelsResponse = Record<string, ModuleProgress>;

