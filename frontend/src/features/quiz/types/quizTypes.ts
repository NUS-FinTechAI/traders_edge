export type QuizPhase = 'pre' | 'post';

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  explanation?: string;
}

export interface QuizDefinition {
  quizId: string;
  module: number;
  phase: QuizPhase;
  title: string;
  description: string;
  questions: QuizQuestion[];
}

export interface QuizApiQuestion {
  question_id: string;
  quiz_id: string;
  question_order: number;
  prompt: string;
  options: string[];
  explanation?: string;
  metadata?: Record<string, unknown>;
}

export interface QuizApiAttemptQuestionResult {
  question_id: string;
  selected_option_index: number | null;
  correct_option_index: number;
  explanation: string;
  is_correct: boolean;
}

export interface QuizApiAttemptMetadata {
  attempts: number;
  last_attempted: string;
  last_answers: Record<string, number>;
}

export interface QuizApiMetadata {
  attempt?: QuizApiAttemptMetadata;
  score: number;
  total_questions: number;
  passing_score: number;
  completed: boolean;
  question_results: QuizApiAttemptQuestionResult[];
}

export interface QuizApiResponse {
  quiz_id: string;
  module: number;
  quiz_type: QuizPhase;
  title: string;
  description: string;
  passing_score: number;
  metadata?: QuizApiMetadata | null;
  questions: QuizApiQuestion[];
  attempted: boolean;
}

export interface QuizAttemptRequest {
  answers: Record<string, number>;
}

export interface QuizAttemptQuestion {
  question_id: string;
  prompt: string;
  options: string[];
  selected_option_index: number | null;
  correct_option_index: number;
  explanation: string;
  is_correct: boolean;
}

export interface QuizAttemptResponse {
  quiz_id: string;
  score: number;
  total_questions: number;
  passing_score: number;
  completed: boolean;
  questions: QuizAttemptQuestion[];
}

export interface QuizAttemptResultQuestion {
  question_id: string;
  selected_option_index: number | null;
  correct_option_index: number;
  explanation: string;
  is_correct: boolean;
}

export interface QuizAttemptResult {
  quiz_id: string;
  score: number;
  total_questions: number;
  passing_score: number;
  completed: boolean;
  questions: QuizAttemptResultQuestion[];
}

export interface FetchQuizResult {
  quiz: QuizDefinition;
  attempted: boolean;
  attemptResult: QuizAttemptResult | null;
  lastAnswers?: Record<string, number>;
}
