import { useEffect, useMemo, useState, type RefObject } from "react";

import { Popup } from "../../../shared/ui/Popup";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import type { MacroFactorDefinition } from "../types/tradingTypes";

interface MacroFactorsPanelProps {
  panelRef?: RefObject<HTMLDivElement | null>;
  interestRateCardRef?: RefObject<HTMLDivElement | null>;
  inflationCardRef?: RefObject<HTMLDivElement | null>;
  factors: MacroFactorDefinition[];
  textPrimaryClass: string;
  cardBorderClass: string;
  cardBgElevatedClass: string;
  renderInsideCard?: boolean;
  levelIdForPresentation?: string | null;
  activeTutorialId?: string | null;
}

const INTEREST_RATE_TUTORIAL_ID = "interest-rate-basics";
const INFLATION_TUTORIAL_ID = "inflation-basics";

interface MacroPanelProfile {
  intro: string;
}

const DEFAULT_PROFILE: MacroPanelProfile = {
  intro: "Use these signals to check market conditions before adding or cutting risk.",
};

const MODULE_4_MACRO_PANEL_PROFILES: Record<string, MacroPanelProfile> = {
  "module-4.1": {
    intro: "Policy-rate shifts can change risk appetite quickly.",
  },
  "module-4.2": {
    intro: "Inflation releases can trigger fast repricing across growth exposure.",
  },
  "module-4.3": {
    intro: "When signals conflict, wait for cleaner direction before committing size.",
  },
  "module-4.4": {
    intro: "In headline-heavy sessions, protect downside and avoid forcing entries.",
  },
  "module-4.5": {
    intro: "During shock swings, prioritize survival and controlled repositioning.",
  },
};

const formatValue = (value: number) =>
  value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatFactorValue = (factor: MacroFactorDefinition, value: number): string => {
  const suffix =
    factor.factor_key === "interest_rate" || factor.factor_key === "inflation"
      ? "%"
      : "";
  return `${formatValue(value)}${suffix}`;
};

const formatChange = (changeBps: number | null | undefined): string => {
  if (typeof changeBps !== "number") return "--";
  const sign = changeBps > 0 ? "+" : "";
  return `${sign}${changeBps} bps`;
};

const indicatorGlowClass =
  "ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.35)] animate-pulse";

const resolvePanelProfile = (levelIdForPresentation?: string | null): MacroPanelProfile =>
  MODULE_4_MACRO_PANEL_PROFILES[levelIdForPresentation ?? ""] ?? DEFAULT_PROFILE;

export function MacroFactorsPanel({
  panelRef,
  interestRateCardRef,
  inflationCardRef,
  factors,
  textPrimaryClass,
  cardBorderClass,
  cardBgElevatedClass,
  renderInsideCard = false,
  levelIdForPresentation = null,
  activeTutorialId = null,
}: MacroFactorsPanelProps) {
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const borderClass = THEME_CONFIG.colors.border.default;
  const profile = useMemo(
    () => resolvePanelProfile(levelIdForPresentation),
    [levelIdForPresentation]
  );
  const tutorialFocusedFactorKey =
    activeTutorialId === INTEREST_RATE_TUTORIAL_ID
      ? "interest_rate"
      : activeTutorialId === INFLATION_TUTORIAL_ID
        ? "inflation"
        : null;

  const [activeFactor, setActiveFactor] = useState<MacroFactorDefinition | null>(
    null
  );
  const [seenUpdateTicksByFactor, setSeenUpdateTicksByFactor] = useState<
    Record<string, number>
  >({});
  const factorGridClass = factors.length > 1 ? "sm:grid-cols-2" : "grid-cols-1";

  useEffect(() => {
    setSeenUpdateTicksByFactor({});
  }, [levelIdForPresentation]);

  useEffect(() => {
    if (factors.length === 0) return;
    setSeenUpdateTicksByFactor((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const factor of factors) {
        if (next[factor.factor_key] != null) continue;
        next[factor.factor_key] =
          typeof factor.last_event_tick === "number" ? factor.last_event_tick : -1;
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [factors]);

  if (factors.length === 0) return null;

  return (
    <>
      <div
        ref={panelRef}
        data-testid="macro-panel"
        className={
          renderInsideCard
            ? "p-3"
            : `mb-3 rounded-lg ${cardBorderClass} ${cardBgElevatedClass} p-3`
        }
      >
        {!renderInsideCard ? (
          <div className="mb-2 min-w-0">
            <div className={`text-xs uppercase tracking-wide ${textSecondary}`}>
              Macro Context
            </div>
            <div className={`mt-1 text-[11px] leading-5 ${textSecondary}`}>
              {profile.intro}
            </div>
          </div>
        ) : null}
        {renderInsideCard ? (
          <div className={`mb-2 text-[11px] leading-5 ${textSecondary}`}>
            {profile.intro}
          </div>
        ) : null}
        <div
          data-testid="macro-panel-collapsed"
          className={`rounded-md border ${cardBorderClass} px-2 py-2`}
        >
          <div className={`grid gap-2 ${factorGridClass}`}>
            {factors.map((factor) => {
              const isPolicyIndicator = factor.factor_key === "interest_rate";
              const seenTick = seenUpdateTicksByFactor[factor.factor_key] ?? -1;
              const hasUnreadPolicyUpdate =
                isPolicyIndicator &&
                typeof factor.last_event_tick === "number" &&
                factor.last_event_tick > seenTick;
              const isTutorialFocused = tutorialFocusedFactorKey === factor.factor_key;
              const refForTutorial =
                factor.factor_key === "interest_rate"
                  ? interestRateCardRef
                  : factor.factor_key === "inflation"
                    ? inflationCardRef
                    : undefined;
              const highlightClass = isTutorialFocused ? "ring-2 ring-sky-400/70" : "";
              return (
                <div key={factor.factor_key} ref={refForTutorial}>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        isPolicyIndicator &&
                        typeof factor.last_event_tick === "number"
                      ) {
                        setSeenUpdateTicksByFactor((prev) => ({
                          ...prev,
                          [factor.factor_key]: factor.last_event_tick as number,
                        }));
                      }
                      setActiveFactor(factor);
                    }}
                    data-testid={`macro-indicator-${factor.factor_key}`}
                    className={`w-full cursor-pointer rounded border px-3 py-2 text-left transition-all ${cardBorderClass} ${highlightClass} ${
                      hasUnreadPolicyUpdate ? indicatorGlowClass : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className={`text-sm font-semibold ${textPrimaryClass}`}>
                          {factor.title}
                        </div>
                        {hasUnreadPolicyUpdate ? (
                          <div
                            data-testid={`macro-indicator-update-${factor.factor_key}`}
                            className="mt-1 inline-flex items-center rounded-full border border-amber-300/80 bg-amber-100/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:border-amber-400/60 dark:bg-amber-500/20 dark:text-amber-200"
                          >
                            New update
                          </div>
                        ) : null}
                      </div>
                      <div className={`text-xs ${textSecondary}`}>
                        {formatChange(factor.last_change_bps)}
                      </div>
                    </div>
                    <div className={`mt-1 text-base font-semibold ${textPrimaryClass}`}>
                      {formatFactorValue(factor, factor.current_value)}
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Popup
        isOpen={!!activeFactor}
        onClose={() => setActiveFactor(null)}
        title={activeFactor?.title ?? "Macro Factor"}
        panelClassName="max-w-2xl"
        contentClassName="max-h-[70vh] overflow-y-auto pr-1"
        closeOnOverlayClick
      >
        {activeFactor ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <div className={`text-[11px] ${textSecondary}`}>Current</div>
                <div className={`font-semibold ${textPrimaryClass}`}>
                  {formatFactorValue(activeFactor, activeFactor.current_value)}
                </div>
              </div>
              <div>
                <div className={`text-[11px] ${textSecondary}`}>Change</div>
                <div className={`font-semibold ${textPrimaryClass}`}>
                  {formatChange(activeFactor.last_change_bps)}
                </div>
              </div>
            </div>
            {typeof activeFactor.previous_value === "number" ? (
              <div className={`text-sm ${textSecondary}`}>
                Previous value: {formatFactorValue(activeFactor, activeFactor.previous_value)}
              </div>
            ) : null}
            <div className={`border-t ${borderClass}`} />
            <div>
              <div className={`text-xs uppercase tracking-wide ${textSecondary}`}>
                Market Stance
              </div>
              <p className={`mt-1 whitespace-pre-line text-sm leading-6 ${textSecondary}`}>
                {activeFactor.market_stance_note || "No stance note provided."}
              </p>
            </div>
            {activeFactor.latest_event_title || activeFactor.latest_event_content ? (
              <>
                <div className={`border-t ${borderClass}`} />
                <div>
                  <div className={`text-xs uppercase tracking-wide ${textSecondary}`}>
                    Latest Update
                  </div>
                  {activeFactor.latest_event_title ? (
                    <div className={`mt-1 text-base font-semibold ${textPrimaryClass}`}>
                      {activeFactor.latest_event_title}
                    </div>
                  ) : null}
                  {activeFactor.latest_event_content ? (
                    <p className={`mt-1 whitespace-pre-line text-sm leading-6 ${textSecondary}`}>
                      {activeFactor.latest_event_content}
                    </p>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </Popup>
    </>
  );
}
