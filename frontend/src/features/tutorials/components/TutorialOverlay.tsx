import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import { Button } from "../../../shared/ui/Button";
import type { TutorialStep } from "../types/tutorialTypes";

interface TutorialOverlayProps {
  isOpen: boolean;
  steps: TutorialStep[];
  onClose: () => void;
  initialStepIndex?: number;
  stepIndex?: number;
  onStepIndexChange?: (stepIndex: number) => void;
  canGoNext?: (stepIndex: number) => boolean;
}

type Rect = { top: number; left: number; width: number; height: number } | null;

export function TutorialOverlay({
  isOpen,
  steps,
  onClose,
  initialStepIndex = 0,
  stepIndex: controlledStepIndex,
  onStepIndexChange,
  canGoNext,
}: TutorialOverlayProps) {
  const [internalStepIndex, setInternalStepIndex] = useState<number>(initialStepIndex);
  const [targetRect, setTargetRect] = useState<Rect>(null);
  const rafRef = useRef<number | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState<number>(0);

  useEffect(() => {
    if (!isOpen) return;
    if (controlledStepIndex == null) {
      setInternalStepIndex(initialStepIndex);
    }
  }, [isOpen, initialStepIndex]);

  const stepIndex = controlledStepIndex ?? internalStepIndex;
  const currentStep = steps[stepIndex];

  const computeRect = () => {
    const el = (currentStep?.targetRef?.current ?? null) as Element | null;
    if (!el) {
      setTargetRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  };

  useEffect(() => {
    if (!isOpen) return;
    const el = (currentStep?.targetRef?.current ?? null) as HTMLElement | null;
    if (!el || currentStep?.centered) return;

    const viewportPadding = 20;
    const rect = el.getBoundingClientRect();
    const outsideViewport =
      rect.top < viewportPadding ||
      rect.left < viewportPadding ||
      rect.bottom > window.innerHeight - viewportPadding ||
      rect.right > window.innerWidth - viewportPadding;

    if (!outsideViewport) return;

    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    const timeoutId = window.setTimeout(() => {
      computeRect();
      setCardHeight(cardRef.current ? cardRef.current.offsetHeight : 0);
    }, 280);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, stepIndex, currentStep]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    computeRect();
    setCardHeight(cardRef.current ? cardRef.current.offsetHeight : 0);
    const handle = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        computeRect();
        setCardHeight(cardRef.current ? cardRef.current.offsetHeight : 0);
      });
    };
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, true);
    const int = setInterval(() => {
      computeRect();
      setCardHeight(cardRef.current ? cardRef.current.offsetHeight : 0);
    }, 300);
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle, true);
      clearInterval(int);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isOpen, stepIndex, currentStep]);

  const isLast = stepIndex >= steps.length - 1;
  const allowTargetInteraction = !!currentStep?.allowTargetInteraction;
  const requiresActionToAdvance = !!currentStep?.requireActionToAdvance;
  const canAdvanceCurrentStep = canGoNext ? canGoNext(stepIndex) : true;

  const setStepIndex = (value: number | ((current: number) => number)) => {
    const nextValue = typeof value === "function" ? (value as (current: number) => number)(stepIndex) : value;
    if (controlledStepIndex == null) {
      setInternalStepIndex(nextValue);
    }
    onStepIndexChange?.(nextValue);
  };

  const next = () => {
    if (!canAdvanceCurrentStep) return;
    if (isLast) {
      onClose();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  };
  const prev = () => setStepIndex((i) => Math.max(0, i - 1));

  useEffect(() => {
    if (!isOpen) return;
    if (!requiresActionToAdvance) return;
    if (!canAdvanceCurrentStep) return;
    if (isLast) {
      onClose();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, steps.length - 1));
  }, [isOpen, requiresActionToAdvance, canAdvanceCurrentStep, isLast]);

  const overlayBg = "";
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const cardBg = THEME_CONFIG.colors.card.background;
  const cardBorder = THEME_CONFIG.colors.border.default;

  const tooltipStyle: React.CSSProperties = useMemo(() => {
    if (!targetRect) return { top: 24, left: 24 } as React.CSSProperties;
    const margin = 12;
    const cardWidth = 320;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - (targetRect.top + targetRect.height);
    const estimatedHeight = cardHeight > 0 ? cardHeight : 220;
    const placeAbove = spaceBelow < (estimatedHeight + margin);
    let top = placeAbove
      ? Math.max(16, targetRect.top - estimatedHeight - margin)
      : targetRect.top + targetRect.height + margin;
    let left = targetRect.left;
    left = Math.max(16, Math.min(left, vw - 16 - 320));
    if (!placeAbove && top + estimatedHeight > vh - 16) {
      top = Math.max(16, vh - 16 - estimatedHeight);
    }
    const targetRight = targetRect.left + targetRect.width;
    const targetBottom = targetRect.top + targetRect.height;
    const overlapsTarget =
      left < targetRight + 6 &&
      left + cardWidth > targetRect.left - 6 &&
      top < targetBottom + 6 &&
      top + estimatedHeight > targetRect.top - 6;
    if (overlapsTarget) {
      const rightCandidateLeft = targetRight + margin;
      if (rightCandidateLeft + cardWidth <= vw - 16) {
        left = rightCandidateLeft;
      } else {
        const leftCandidateLeft = targetRect.left - cardWidth - margin;
        if (leftCandidateLeft >= 16) {
          left = leftCandidateLeft;
        } else {
          const aboveTop = targetRect.top - estimatedHeight - margin;
          const belowTop = targetBottom + margin;
          if (aboveTop >= 16) {
            top = aboveTop;
          } else {
            top = Math.min(Math.max(16, belowTop), Math.max(16, vh - 16 - estimatedHeight));
          }
        }
      }
    }
    return { top, left } as React.CSSProperties;
  }, [targetRect, cardHeight]);

  const isCentered = !!currentStep?.centered;
  const hideHighlight = !!currentStep?.noHighlight;
  const hasDescription = useMemo(() => {
    const d = currentStep?.description;
    return typeof d === "string" && d.trim().length > 0;
  }, [currentStep]);
  const resolvedImageSrc = useMemo(() => {
    const src = currentStep?.imageSrc;
    if (!src) return undefined;
    if (/^https?:\/\//i.test(src)) return src;
    const base = (import.meta as any).env?.BASE_URL || "/";
    if (src.startsWith("/")) return `${base}${src.slice(1)}`;
    return `${base}${src}`;
  }, [currentStep]);

  if (!isOpen || steps.length === 0) return null;

  return (
    <div className={`fixed inset-0 ${overlayBg} z-[80] ${allowTargetInteraction ? "pointer-events-none" : ""}`}>
      {isCentered ? <div className="fixed inset-0 bg-black/60" /> : null}
      {targetRect && !hideHighlight ? (
        <div
          className="fixed pointer-events-none rounded-lg transition-all duration-200"
          style={{
            top: Math.max(8, targetRect.top - 4),
            left: Math.max(8, targetRect.left - 4),
            width: Math.max(0, targetRect.width + 8),
            height: Math.max(0, targetRect.height + 8),
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)",
            border: "4px solid rgba(16,185,129,0.7)",
            borderRadius: "8px",
          }}
        />
      ) : null}

      <div
        className={[
          "fixed max-w-sm w-[320px] p-4 rounded-lg border max-h-[70vh] overflow-auto",
          allowTargetInteraction ? "pointer-events-auto" : "",
          isCentered ? "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" : "",
          cardBg,
          cardBorder,
          textPrimary,
          THEME_CONFIG.colors.card.shadow,
        ].join(" ")}
        style={isCentered ? undefined : tooltipStyle}
        ref={cardRef}
      >
        <div className="text-base font-semibold">{currentStep?.title}</div>
        {hasDescription ? (
          <div className={`text-sm mt-1 ${THEME_CONFIG.colors.text.secondary}`}>{currentStep?.description}</div>
        ) : null}
        {resolvedImageSrc ? (
          <div className="mt-3">
            <img src={resolvedImageSrc} alt={currentStep?.title} className="w-full rounded" />
          </div>
        ) : null}
        <div className="mt-4 flex items-center gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Skip
          </Button>
          <Button variant="outline" size="sm" onClick={prev} disabled={stepIndex === 0}>
            Back
          </Button>
          {!requiresActionToAdvance ? (
            <Button variant="success" size="sm" onClick={next}>
              {isLast ? "End Tutorial" : "Next"}
            </Button>
          ) : null}
        </div>
        <div className={`mt-2 text-xs ${THEME_CONFIG.colors.text.muted}`}>{`${stepIndex + 1} / ${steps.length}`}</div>
      </div>
    </div>
  );
}
