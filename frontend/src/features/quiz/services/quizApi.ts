import type {
  FetchQuizResult,
  QuizApiMetadata,
  QuizApiResponse,
  QuizAttemptRequest,
  QuizAttemptResponse,
  QuizAttemptResult,
  QuizAttemptResultQuestion,
  QuizDefinition,
  QuizOption,
  QuizQuestion,
} from '../types/quizTypes';
import { apiClient } from '../../../services/apiClient';

const buildOptions = (options: string[]): QuizOption[] =>
  options.map((text, idx) => ({ id: `opt-${idx + 1}`, text }));

const toQuizDefinition = (payload: QuizApiResponse): QuizDefinition => ({
  quizId: payload.quiz_id,
  module: payload.module,
  phase: payload.quiz_type,
  title: payload.title,
  description: payload.description,
  questions: payload.questions
    .slice()
    .sort((a, b) => a.question_order - b.question_order)
    .map(
      (q): QuizQuestion => ({
        id: q.question_id,
        prompt: q.prompt,
        options: buildOptions(q.options ?? []),
        explanation: q.explanation,
      })
    ),
});

const toAttemptResultFromMetadata = (
  quizId: string,
  metadata: QuizApiMetadata | null | undefined
): QuizAttemptResult | null => {
  if (!metadata) return null;
  const questions: QuizAttemptResultQuestion[] = (metadata.question_results ?? []).map((q) => ({
    question_id: q.question_id,
    selected_option_index: q.selected_option_index,
    correct_option_index: q.correct_option_index,
    explanation: q.explanation,
    is_correct: q.is_correct,
  }));
  return {
    quiz_id: quizId,
    score: metadata.score,
    total_questions: metadata.total_questions,
    passing_score: metadata.passing_score,
    completed: metadata.completed,
    questions,
  };
};

const toAttemptResultFromSubmit = (payload: QuizAttemptResponse): QuizAttemptResult => ({
  quiz_id: payload.quiz_id,
  score: payload.score,
  total_questions: payload.total_questions,
  passing_score: payload.passing_score,
  completed: payload.completed,
  questions: payload.questions.map((q) => ({
    question_id: q.question_id,
    selected_option_index: q.selected_option_index,
    correct_option_index: q.correct_option_index,
    explanation: q.explanation,
    is_correct: q.is_correct,
  })),
});

export async function fetchQuiz(quizId: string): Promise<FetchQuizResult> {
  const payload = await apiClient.getJson<QuizApiResponse>(
    `/game/quiz/${encodeURIComponent(quizId)}`
  );
  return {
    quiz: toQuizDefinition(payload),
    attempted: payload.attempted ?? false,
    attemptResult: toAttemptResultFromMetadata(payload.quiz_id, payload.metadata),
    lastAnswers: payload.metadata?.attempt?.last_answers,
  };
}

export async function submitQuizAttempt(
  quizId: string,
  payload: QuizAttemptRequest
): Promise<QuizAttemptResult> {
  const response = await apiClient.postJson<QuizAttemptResponse>(
    `/game/quiz/${encodeURIComponent(quizId)}/attempt`,
    payload
  );
  return toAttemptResultFromSubmit(response);
}
