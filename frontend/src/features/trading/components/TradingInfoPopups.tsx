import type { MissionDefinition, PassingCriteria } from "../types/tradingTypes";
import { ContextPopup } from "./ContextPopup";
import { MissionsPopup } from "./MissionsPopup";
import { UnlocksPopup, type UnlockDisplayItem } from "./UnlocksPopup";

export type InfoPopupType = "unlocks" | "missions" | "context";

interface TradingInfoPopupsProps {
  activePopup: InfoPopupType | null;
  onClose: () => void;
  unlocks: UnlockDisplayItem[];
  onPlayUnlockTutorial?: (tutorialId: string) => void;
  passingCriteria: PassingCriteria | null;
  bonusMissions: MissionDefinition[];
  levelContext: string | null;
}

export function TradingInfoPopups({
  activePopup,
  onClose,
  unlocks,
  onPlayUnlockTutorial,
  passingCriteria,
  bonusMissions,
  levelContext,
}: TradingInfoPopupsProps) {
  return (
    <>
      <UnlocksPopup
        isOpen={activePopup === "unlocks"}
        onClose={onClose}
        unlocks={unlocks}
        onPlayTutorial={onPlayUnlockTutorial}
      />
      <MissionsPopup
        isOpen={activePopup === "missions"}
        onClose={onClose}
        passingCriteria={passingCriteria}
        bonusMissions={bonusMissions}
      />
      <ContextPopup
        isOpen={activePopup === "context"}
        onClose={onClose}
        context={levelContext}
      />
    </>
  );
}
