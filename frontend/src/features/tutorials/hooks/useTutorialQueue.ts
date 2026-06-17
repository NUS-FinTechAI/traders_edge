import { useCallback, useMemo, useState } from "react";
import type { TutorialId, TutorialStep } from "../types/tutorialTypes";

interface UseTutorialQueueResult<TId extends TutorialId> {
  isOpen: boolean;
  activeTutorialId: TId | null;
  activeSteps: TutorialStep[];
  openTutorialNow: (id: TId, options?: { clearQueue?: boolean }) => boolean;
  enqueueTutorials: (ids: TId[]) => void;
  closeActiveTutorial: () => void;
  clearTutorials: () => void;
}

export function useTutorialQueue<TId extends TutorialId>(
  resolveSteps: (id: TId) => TutorialStep[]
): UseTutorialQueueResult<TId> {
  const [activeTutorialId, setActiveTutorialId] = useState<TId | null>(null);
  const [activeSteps, setActiveSteps] = useState<TutorialStep[]>([]);
  const [, setQueue] = useState<TId[]>([]);

  const activateTutorial = useCallback(
    (id: TId): boolean => {
      const steps = resolveSteps(id);
      if (steps.length === 0) return false;
      setActiveTutorialId(id);
      setActiveSteps(steps);
      return true;
    },
    [resolveSteps]
  );

  const openTutorialNow = useCallback(
    (id: TId, options?: { clearQueue?: boolean }) => {
      if (options?.clearQueue) {
        setQueue([]);
      }
      return activateTutorial(id);
    },
    [activateTutorial]
  );

  const enqueueTutorials = useCallback(
    (ids: TId[]) => {
      if (ids.length === 0) return;
      setQueue((prevQueue) => {
        const existing = new Set<TId>(prevQueue);
        if (activeTutorialId) existing.add(activeTutorialId);
        const dedupedIncoming = ids.filter((id) => {
          if (existing.has(id)) return false;
          existing.add(id);
          return true;
        });

        if (dedupedIncoming.length === 0) return prevQueue;

        if (!activeTutorialId && prevQueue.length === 0) {
          const [first, ...rest] = dedupedIncoming;
          const opened = activateTutorial(first);
          return opened ? rest : dedupedIncoming.slice(1);
        }

        return [...prevQueue, ...dedupedIncoming];
      });
    },
    [activeTutorialId, activateTutorial]
  );

  const closeActiveTutorial = useCallback(() => {
    setQueue((prevQueue) => {
      const [nextId, ...rest] = prevQueue;
      if (nextId) {
        const opened = activateTutorial(nextId);
        if (!opened) {
          setActiveTutorialId(null);
          setActiveSteps([]);
        }
        return rest;
      }
      setActiveTutorialId(null);
      setActiveSteps([]);
      return [];
    });
  }, [activateTutorial]);

  const clearTutorials = useCallback(() => {
    setQueue([]);
    setActiveTutorialId(null);
    setActiveSteps([]);
  }, []);

  const isOpen = useMemo(() => activeTutorialId != null && activeSteps.length > 0, [activeTutorialId, activeSteps.length]);

  return {
    isOpen,
    activeTutorialId,
    activeSteps,
    openTutorialNow,
    enqueueTutorials,
    closeActiveTutorial,
    clearTutorials,
  };
}
