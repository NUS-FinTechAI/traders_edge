import { useCallback, useEffect, useRef, useState } from "react";
import type { InfoPopupType } from "../components/TradingInfoPopups";
import type { TradingTutorialId } from "../../tutorials";

interface UseInfoPopupQueueParams {
  isTutorialOpen: boolean;
  activeTutorialId: TradingTutorialId | null;
  openTutorialNow: (
    tutorialId: TradingTutorialId,
    options?: { clearQueue?: boolean }
  ) => boolean;
}

export function useInfoPopupQueue({
  isTutorialOpen,
  activeTutorialId,
  openTutorialNow,
}: UseInfoPopupQueueParams) {
  const popupQueueRef = useRef<InfoPopupType[]>([]);
  const [activeInfoPopup, setActiveInfoPopup] = useState<InfoPopupType | null>(
    null
  );
  const [infoPopupsPaused, setInfoPopupsPaused] = useState<boolean>(false);

  const setPopupQueue = useCallback((order: InfoPopupType[]) => {
    popupQueueRef.current = order;
    setActiveInfoPopup(order[0] ?? null);
  }, []);

  const closeInfoPopup = useCallback(() => {
    const queue = popupQueueRef.current;
    if (queue.length > 0 && queue[0] === activeInfoPopup) {
      queue.shift();
      setActiveInfoPopup(queue[0] ?? null);
      return;
    }
    setActiveInfoPopup(null);
  }, [activeInfoPopup]);

  const handlePlayUnlockTutorial = useCallback(
    (tutorialId: string) => {
      const normalizedTutorialId = tutorialId.trim() as TradingTutorialId;
      const queue = popupQueueRef.current;
      if (queue.length > 0 && queue[0] === "unlocks") {
        queue.shift();
      }
      const openedTutorial = openTutorialNow(normalizedTutorialId, {
        clearQueue: true,
      });
      if (openedTutorial) {
        setInfoPopupsPaused(true);
        setActiveInfoPopup(null);
        return;
      }
      setActiveInfoPopup(queue[0] ?? null);
    },
    [openTutorialNow]
  );

  useEffect(() => {
    if (!infoPopupsPaused) return;
    if (isTutorialOpen || activeTutorialId) return;
    setInfoPopupsPaused(false);
    const queue = popupQueueRef.current;
    setActiveInfoPopup(queue[0] ?? null);
  }, [infoPopupsPaused, isTutorialOpen, activeTutorialId]);

  const clearPopupQueue = useCallback(() => {
    popupQueueRef.current = [];
    setActiveInfoPopup(null);
    setInfoPopupsPaused(false);
  }, []);

  return {
    activeInfoPopup,
    setActiveInfoPopup,
    setPopupQueue,
    closeInfoPopup,
    handlePlayUnlockTutorial,
    clearPopupQueue,
  };
}
