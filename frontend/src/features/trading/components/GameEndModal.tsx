import { useEffect, useRef, useState, type RefObject } from 'react';
import Confetti from 'react-confetti';
import { Popup } from '../../../shared/ui/Popup';
import { Button } from '../../../shared/ui/Button';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import type { GameEndRespPayload } from '../types/tradingTypes';
import { GameEndStatusBanner } from './GameEndStatusBanner';
import { GameEndPointsSection } from './GameEndPointsSection';
import { GameEndMissionResultsSection } from './GameEndMissionResultsSection';
import { GameEndPortfolioSummary } from './GameEndPortfolioSummary';

interface GameEndModalProps {
  modalContentRef?: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  data: GameEndRespPayload | null;
  onBackToLevelSelect: () => void;
  onProceed: () => void;
  onRetry?: () => void;
}

export function GameEndModal({
  modalContentRef,
  isOpen,
  data,
  onBackToLevelSelect,
  onProceed,
  onRetry,
}: GameEndModalProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;

  const passed = !!(data && (data.completed === true || data.completed === 1));
  const title = "Level Result";
  const explanation = passed
    ? "You met the level requirements."
    : "You did not meet the passing requirements. Review your trades and try again.";
  const primaryActionLabel = passed ? "Next Level" : "Retry Level";
  const handlePrimaryAction = () => {
    if (passed) {
      onProceed();
      return;
    }
    (onRetry ?? onProceed)();
  };

  const sharesValue = data ? Math.trunc((data.netWorth - data.endingCash) * 100) / 100 : 0;

  // Animation: count up net worth
  const [animatedNetWorth, setAnimatedNetWorth] = useState<number>(0);
  const rafRef = useRef<number | null>(null);
  const [viewport, setViewport] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    if (!isOpen || !data) {
      setAnimatedNetWorth(0);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }

    const durationMs = 3000;
    const startTs = performance.now();
    const toTwoDp = (v: number) => Math.trunc(v * 100) / 100;
    const startValue = toTwoDp(data.passingCash);
    const endValue = toTwoDp(data.netWorth);

    // If net worth is below passing threshold, show final immediately
    if (endValue <= startValue) {
      setAnimatedNetWorth(endValue);
      return;
    }

    const step = (now: number) => {
      const elapsed = now - startTs;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
      const current = toTwoDp(startValue + (endValue - startValue) * eased);
      setAnimatedNetWorth(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        setAnimatedNetWorth(toTwoDp(endValue));
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isOpen, data?.netWorth, data?.passingCash]);

  return (
    <Popup
      isOpen={isOpen}
      onClose={() => {}}
      title={title}
      disableClose
      showCloseButton={false}
      panelClassName="max-w-2xl"
      contentClassName="max-h-[72vh] overflow-y-auto overflow-x-hidden pr-1"
      footer={(
        <div className="w-full flex items-center justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onBackToLevelSelect}>Back to Level Select</Button>
          <Button variant="success" onClick={handlePrimaryAction}>{primaryActionLabel}</Button>
        </div>
      )}
      overlayEffect={passed ? (
        <Confetti
          numberOfPieces={260}
          gravity={0.25}
          recycle={false}
          tweenDuration={4000}
          width={viewport.w || undefined}
          height={viewport.h || undefined}
        />
      ) : null}
    >
      {data && (
        <div ref={modalContentRef} className="space-y-3 relative">
          <GameEndStatusBanner passed={passed} explanation={explanation} />
          <div className={`text-center font-semibold ${textPrimary} mb-4`}>
            Final Net Worth: ${animatedNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <GameEndPortfolioSummary
            netWorth={data.netWorth}
            endingCash={data.endingCash}
            sharesValue={sharesValue}
          />
          <GameEndPointsSection data={data} />
          <GameEndMissionResultsSection missions={data.missionResults} />
        </div>
      )}
    </Popup>
  );
}
