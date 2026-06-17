import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type QuizKey = string;

interface QuizState {
  answers: Record<string, string>;
  submitted: boolean;
}

interface QuizContextValue {
  getState: (quizId: string) => QuizState;
  setAnswer: (quizId: string, questionId: string, optionId: string) => void;
  submit: (quizId: string) => void;
}

const QuizContext = createContext<QuizContextValue | null>(null);

const buildKey = (quizId: string): QuizKey => quizId;

export function QuizProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<Record<QuizKey, QuizState>>({});

  const getState = (quizId: string): QuizState => {
    const key = buildKey(quizId);
    return states[key] ?? { answers: {}, submitted: false };
  };

  const setAnswer = (quizId: string, questionId: string, optionId: string) => {
    const key = buildKey(quizId);
    setStates((prev) => {
      const next = { ...(prev[key] ?? { answers: {}, submitted: false }) };
      next.answers = { ...next.answers, [questionId]: optionId };
      return { ...prev, [key]: next };
    });
  };

  const submit = (quizId: string) => {
    const key = buildKey(quizId);
    setStates((prev) => {
      const next = { ...(prev[key] ?? { answers: {}, submitted: false }) };
      next.submitted = true;
      return { ...prev, [key]: next };
    });
  };

  const value = useMemo(
    () => ({
      getState,
      setAnswer,
      submit,
    }),
    [states]
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) {
    throw new Error('useQuiz must be used within QuizProvider');
  }
  return ctx;
}
