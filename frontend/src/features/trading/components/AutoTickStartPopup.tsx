import { Popup } from "../../../shared/ui/Popup";
import { Button } from "../../../shared/ui/Button";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import { FileSearch, KeyRound, ListChecks, PlayCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface AutoTickStartPopupProps {
  isOpen: boolean;
  hasUnlocks: boolean;
  hasContext: boolean;
  hasMissions: boolean;
  onReopenUnlocks: () => void;
  onReopenContext: () => void;
  onReopenMissions: () => void;
  onStart: () => void;
}

interface ReopenActionButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

function ReopenActionButton({
  icon: Icon,
  label,
  onClick,
}: ReopenActionButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="inline-flex w-full items-center justify-start gap-2 text-left text-sm"
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{label}</span>
    </Button>
  );
}

export function AutoTickStartPopup({
  isOpen,
  hasUnlocks,
  hasContext,
  hasMissions,
  onReopenUnlocks,
  onReopenContext,
  onReopenMissions,
  onStart,
}: AutoTickStartPopupProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const muted = THEME_CONFIG.colors.text.muted;
  const border = THEME_CONFIG.colors.card.border;
  const elevated = THEME_CONFIG.colors.card.backgroundElevated;

  return (
    <Popup
      isOpen={isOpen}
      onClose={() => {}}
      disableClose
      showCloseButton={false}
      title={
        <div className="flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-emerald-500" />
          <span>This Is a Live Ticking Level</span>
        </div>
      }
      footer={
        <Button variant="success" size="md" onClick={onStart}>
          Start Level
        </Button>
      }
    >
      <div className="space-y-4">
        <p className={`text-sm ${textSecondary}`}>
          Once started, the market will keep ticking automatically. Price can
          move while you read news and manage pending orders.
        </p>
        <div className={`rounded-lg border ${border} ${elevated} p-3`}>
          <div className={`mb-2 text-sm font-semibold ${textPrimary}`}>
            Review Before You Start
          </div>
          <p className={`mb-3 text-sm ${muted}`}>
            Reopen anything you want to check. Starting the level begins live
            ticking immediately.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {hasContext ? (
              <ReopenActionButton
                icon={FileSearch}
                label="View Context"
                onClick={onReopenContext}
              />
            ) : null}
            {hasUnlocks ? (
              <ReopenActionButton
                icon={KeyRound}
                label="View Unlocks"
                onClick={onReopenUnlocks}
              />
            ) : null}
            {hasMissions ? (
              <ReopenActionButton
                icon={ListChecks}
                label="View Missions"
                onClick={onReopenMissions}
              />
            ) : null}
          </div>
        </div>
      </div>
    </Popup>
  );
}
