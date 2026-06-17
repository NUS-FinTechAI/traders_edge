import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { Button } from '../../../shared/ui/Button';
import { Card, CardContent } from '../../../shared/ui/Card';
import { useLevelAccessGate } from '../../trading/hooks/useLevelAccessGate';
import { useQuiz } from '../context/QuizContext';
import type { QuizAttemptResult, QuizDefinition } from '../types/quizTypes';
import { fetchQuiz, submitQuizAttempt } from '../services/quizApi';

type QuizRouteParams = {
  module?: string;
  phase?: string;
};

export function QuizPage() {
  const { module, phase } = useParams<QuizRouteParams>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { getState, setAnswer, submit } = useQuiz();

  const moduleNumber = Number(module);
  const quizPhase = (phase === 'pre' || phase === 'post') ? phase : null;
  const quizId = searchParams.get('quiz_id') ?? '';

  // URL-bypass guard. Backend's `get_quiz_details` 403s on locked quizzes
  // (PR 3 + `_is_quiz_available_for_user`); the gate here prevents the
  // half-load-then-error flash by redirecting before the fetch fires.
  const gate = useLevelAccessGate(
    Number.isFinite(moduleNumber) && quizPhase
      ? { kind: 'quiz', module: moduleNumber, phase: quizPhase }
      : { kind: 'quiz', module: -1, phase: 'pre' },
  );

  const [quiz, setQuiz] = useState<QuizDefinition | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const setAnswerRef = useRef(setAnswer);
  const submitRef = useRef(submit);

  useEffect(() => {
    setAnswerRef.current = setAnswer;
    submitRef.current = submit;
  }, [setAnswer, submit]);

  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const textSuccess = THEME_CONFIG.colors.text.success;
  const textDanger = THEME_CONFIG.colors.text.danger;
  const backgroundClass = THEME_CONFIG.colors.background.primary;

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setAttempt(null);
      setSubmitError(null);
      if (!quizId || !Number.isFinite(moduleNumber) || !quizPhase) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchQuiz(quizId);
        if (!isMounted) return;
        setQuiz(result.quiz);
        if (result.attempted) {
          const answerSource = result.lastAnswers ?? (result.attemptResult
            ? Object.fromEntries(
                result.attemptResult.questions
                  .filter((q) => q.selected_option_index !== null)
                  .map((q) => [q.question_id, q.selected_option_index as number])
              )
            : undefined);
          if (answerSource) {
            Object.entries(answerSource).forEach(([questionId, selectedIndex]) => {
              const optionId = `opt-${Number(selectedIndex) + 1}`;
              setAnswerRef.current(result.quiz.quizId, questionId, optionId);
            });
          }
          setAttempt(result.attemptResult);
          submitRef.current(result.quiz.quizId);
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load quiz');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [quizId, moduleNumber, quizPhase]);

  const activeQuiz = useMemo(() => {
    if (!quiz || !Number.isFinite(moduleNumber) || !quizPhase) return null;
    return quiz;
  }, [quiz, moduleNumber, quizPhase]);

  const activeQuestions = activeQuiz?.questions ?? [];
  const state = activeQuiz ? getState(activeQuiz.quizId) : { answers: {}, submitted: false };

  useEffect(() => {
    if (activeIndex > 0 && activeIndex >= activeQuestions.length) {
      setActiveIndex(Math.max(0, activeQuestions.length - 1));
    }
  }, [activeIndex, activeQuestions.length]);

  const attemptById = useMemo(() => {
    if (!attempt) return new Map<string, QuizAttemptResult['questions'][number]>();
    return new Map(attempt.questions.map((q) => [q.question_id, q]));
  }, [attempt]);

  const handleSubmit = async () => {
    if (!activeQuiz || state.submitted || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    const answers = activeQuestions.reduce<Record<string, number>>((acc, question) => {
      const selectedId = state.answers[question.id];
      if (!selectedId) return acc;
      const selectedIndex = question.options.findIndex((opt) => opt.id === selectedId);
      if (selectedIndex >= 0) {
        acc[question.id] = selectedIndex;
      }
      return acc;
    }, {});
    try {
      const result = await submitQuizAttempt(activeQuiz.quizId, { answers });
      setAttempt(result);
      submitRef.current(activeQuiz.quizId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quizPhase) {
    return (
      <div className={`h-full w-full ${backgroundClass} p-6`}>
        <div className={`text-lg ${textPrimary}`}>Quiz not found.</div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/adventureMode')}>
            Back to Adventure
          </Button>
        </div>
      </div>
    );
  }

  // Access gate (post the quizPhase guard so we don't evaluate the gate
  // with an invalid module/phase). `loading` blanks the page briefly —
  // cheaper UX than the half-load → 403-toast flicker.
  if (gate === 'loading') return null;
  if (gate === 'denied') return <Navigate to="/adventureMode" replace />;

  if (isLoading) {
    return (
      <div className={`h-full w-full ${backgroundClass} p-6`}>
        <div className={`text-lg ${textPrimary}`}>Loading quiz...</div>
      </div>
    );
  }

  if (!activeQuiz || error) {
    return (
      <div className={`h-full w-full ${backgroundClass} p-6`}>
        <div className={`text-lg ${textPrimary}`}>{error ?? 'Quiz not found.'}</div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/adventureMode')}>
            Back to Adventure
          </Button>
        </div>
      </div>
    );
  }

  if (activeQuestions.length === 0) {
    return (
      <div className={`h-full w-full ${backgroundClass} p-6`}>
        <div className={`text-lg ${textPrimary}`}>No questions available for this quiz.</div>
        <div className="mt-4">
          <Button variant="outline" onClick={() => navigate('/adventureMode')}>
            Back to Adventure
          </Button>
        </div>
      </div>
    );
  }

  const activeQuestion = activeQuestions[activeIndex];
  const activeAnswer = state.answers[activeQuestion.id];
  const allAnswered = activeQuestions.every((q) => !!state.answers[q.id]);

  return (
    <div className={`h-full w-full ${backgroundClass} p-6 overflow-y-auto`}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div>
          <div className={`text-2xl font-semibold ${textPrimary}`}>{activeQuiz.title}</div>
          <div className={`text-sm ${textSecondary}`}>{activeQuiz.description}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {activeQuestions.map((q, idx) => {
            const isDone = !!state.answers[q.id];
            const isActive = idx === activeIndex;
            const attemptQuestion = attemptById.get(q.id);
            const isCorrect = attemptQuestion?.is_correct;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`px-3 py-1 rounded-full text-xs border transition ${
                  isActive
                    ? `${textPrimary} border-slate-400 dark:border-slate-500`
                    : attemptQuestion
                    ? isCorrect
                      ? `${textSuccess} border-emerald-300 dark:border-emerald-500`
                      : `${textDanger} border-red-300 dark:border-red-500`
                    : isDone
                    ? `${textSecondary} border-slate-300 dark:border-slate-600 hover:border-slate-400`
                    : `${textSecondary} border-slate-200 dark:border-slate-700`
                } cursor-pointer`}
              >
                Q{idx + 1}
              </button>
            );
          })}
        </div>

        <Card elevated>
          <CardContent>
            <div className={`text-base font-semibold ${textPrimary}`}>
              {activeIndex + 1}. {activeQuestion.prompt}
            </div>
            <div className="mt-3 space-y-2">
              {activeQuestion.options.map((opt, optIndex) => {
                const attemptQuestion = attemptById.get(activeQuestion.id);
                const checked = state.submitted
                  ? attemptQuestion?.selected_option_index === optIndex
                  : activeAnswer === opt.id;
                const isSubmitted = state.submitted && !!attemptQuestion;
                const isSelectedAfterSubmit = isSubmitted && checked;
                const isCorrectOption = isSubmitted && attemptQuestion?.correct_option_index === optIndex;
                const isWrongSelected = isSubmitted && isSelectedAfterSubmit && !attemptQuestion?.is_correct;
                const optionClass = isCorrectOption
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700'
                  : isWrongSelected
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                  : '';
                const textClass = isCorrectOption
                  ? `${textSuccess} font-semibold`
                  : isWrongSelected
                  ? `${textDanger} font-semibold`
                  : isSelectedAfterSubmit
                  ? `${textPrimary} font-semibold`
                  : textSecondary;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 rounded-md px-2 py-1 border ${
                      optionClass || (isSelectedAfterSubmit ? 'bg-slate-100 dark:bg-slate-800 border-transparent' : 'border-transparent')
                    }`}
                  >
                    <input
                      type="radio"
                      name={activeQuestion.id}
                      checked={checked}
                      disabled={state.submitted || isSubmitting}
                      onChange={() => setAnswer(activeQuiz.quizId, activeQuestion.id, opt.id)}
                    />
                    <span className={textClass}>
                      {opt.text}
                    </span>
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
                className={`h-10 px-4 rounded-full border flex items-center justify-center text-sm font-medium transition text-slate-900 dark:text-slate-50 ${
                  activeIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                } ${activeIndex === 0 ? '' : 'cursor-pointer'}`}
                aria-label="Previous question"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((prev) => Math.min(activeQuestions.length - 1, prev + 1))}
                disabled={activeIndex === activeQuestions.length - 1}
                className={`h-10 px-4 rounded-full border flex items-center justify-center text-sm font-medium transition text-slate-900 dark:text-slate-50 ${
                  activeIndex === activeQuestions.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                } ${activeIndex === activeQuestions.length - 1 ? '' : 'cursor-pointer'}`}
                aria-label="Next question"
              >
                Next
              </button>
            </div>
            {state.submitted ? (
              (() => {
                const attemptQuestion = attemptById.get(activeQuestion.id);
                if (!attemptQuestion) return null;
                return (
                  <div className={`mt-4 rounded-lg border p-3 ${attemptQuestion.is_correct ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-700' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700'}`}>
                    <div className={`${attemptQuestion.is_correct ? textSuccess : textDanger} font-semibold`}>
                      {attemptQuestion.is_correct ? 'Correct' : 'Incorrect'}
                    </div>
                    <div className={`text-sm ${textSecondary}`}>{attemptQuestion.explanation}</div>
                  </div>
                );
              })()
            ) : null}
          </CardContent>
        </Card>

        {attempt ? (
          <div className={`rounded-lg border p-3 ${textSecondary}`}>
            <div className={`${textPrimary} font-semibold`}>
              Score: {attempt.score}/{attempt.total_questions}
            </div>
            <div className="text-sm mt-1">
              {(() => {
                const total = attempt.total_questions || 0;
                const score = attempt.score || 0;
                if (total === 0) return null;
                const percent = score / total;
                if (percent < 0.5) {
                  return "You've got some learning to do, play the module to learn more!";
                }
                if (score === total) {
                  return 'Seems like you know your stuff, congratulations!';
                }
                return 'Almost there! Play the module to learn more!';
              })()}
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/adventureMode')}>
            Back to Adventure
          </Button>
          {!state.submitted ? (
            <Button
              variant="success"
              className="ml-auto"
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </Button>
          ) : null}
        </div>
        {submitError ? <div className="text-red-600">{submitError}</div> : null}
      </div>
    </div>
  );
}
