import { Gift, Sparkles } from "lucide-react";
import { Popup } from "../../../shared/ui/Popup";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import { Button } from "../../../shared/ui/Button";

export interface UnlockDisplayItem {
  feature: string;
  title: string;
  description: string;
  tutorialId?: string;
}

interface UnlocksPopupProps {
  isOpen: boolean;
  onClose: () => void;
  unlocks: UnlockDisplayItem[];
  onPlayTutorial?: (tutorialId: string) => void;
}

const formatUnlockName = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export function UnlocksPopup({ isOpen, onClose, unlocks, onPlayTutorial }: UnlocksPopupProps) {
  const cardBorder = THEME_CONFIG.colors.card.border;
  const cardBgElevated = THEME_CONFIG.colors.card.backgroundElevated;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  return (
    <Popup isOpen={isOpen} onClose={onClose} title="New Unlocks">
      <div className="space-y-3">
        <div className={`rounded-lg ${cardBgElevated} ${cardBorder} p-3`}>
          <div className={`flex items-center gap-2 text-sm font-semibold ${textPrimary}`}>
            <Gift className="h-4 w-4" />
            Unlocked Features And Tutorials
          </div>
          <div className={`mt-1 text-xs ${textSecondary}`}>
            {unlocks.length} {unlocks.length === 1 ? "unlock" : "unlocks"} available
          </div>
        </div>
        {unlocks.length > 0 ? (
          <div className="grid gap-2">
            {unlocks.map((unlock) => (
              <div key={`${unlock.feature}-${unlock.title}-${unlock.tutorialId ?? 'none'}`} className={`rounded-lg border ${cardBorder} p-3`}>
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`flex items-center gap-2 ${textPrimary}`}>
                        <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="font-medium">{unlock.title}</span>
                      </div>
                      {unlock.description.trim().length > 0 ? (
                        <div className={`mt-1 text-xs ${textSecondary} break-words`}>{unlock.description}</div>
                      ) : null}
                    </div>
                    <span className={`text-[11px] px-2 py-1 rounded-full ${cardBgElevated} ${textSecondary} whitespace-nowrap`}>
                      {formatUnlockName(unlock.feature)}
                    </span>
                  </div>
                  {unlock.tutorialId ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onPlayTutorial?.(unlock.tutorialId as string)}
                      >
                        Play Tutorial
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-lg border border-dashed ${cardBorder} p-3 ${textSecondary}`}>
            No unlocks for this level.
          </div>
        )}
      </div>
    </Popup>
  );
}
