import { Button } from "../../../shared/ui/Button";
import { School, FileSearch, KeyRound, ListChecks } from "lucide-react";

interface RightPanelActionsProps {
  showReplayTutorialButton?: boolean;
  onReplayTutorial?: () => void;
  showUnlocksButton?: boolean;
  onOpenUnlocks?: () => void;
  showMissionsButton?: boolean;
  onOpenMissions?: () => void;
  showReopenContextButton?: boolean;
  onReopenContext?: () => void;
}

export function RightPanelActions({
  showReplayTutorialButton,
  onReplayTutorial,
  showUnlocksButton,
  onOpenUnlocks,
  showMissionsButton,
  onOpenMissions,
  showReopenContextButton,
  onReopenContext,
}: RightPanelActionsProps) {
  const actions = [
    {
      key: "replay-tutorial",
      show: !!showReplayTutorialButton,
      label: "Reopen Tutorial",
      Icon: School,
      onClick: onReplayTutorial,
      title: "Replay Tutorial",
      ariaLabel: "Replay Tutorial",
    },
    {
      key: "open-unlocks",
      show: !!showUnlocksButton,
      label: "View Unlocks",
      Icon: KeyRound,
      onClick: onOpenUnlocks,
      title: "Open Unlocks",
      ariaLabel: "Open Unlocks",
    },
    {
      key: "open-missions",
      show: !!showMissionsButton,
      label: "View Missions",
      Icon: ListChecks,
      onClick: onOpenMissions,
      title: "Open Missions",
      ariaLabel: "Open Missions",
    },
    {
      key: "reopen-context",
      show: !!showReopenContextButton,
      label: "View Context",
      Icon: FileSearch,
      onClick: onReopenContext,
      title: "Open Context",
      ariaLabel: "Open Context",
    },
  ];

  const visible = actions.filter(a => a.show);
  if (visible.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      {visible.map(({ key, Icon, label, onClick, title, ariaLabel }) => (
        <Button
          key={key}
          size="sm"
          variant="outline"
          className="px-2.5 py-1.5 text-xs"
          onClick={() => onClick && onClick()}
          title={title}
          aria-label={ariaLabel}
        >
          <span className="inline-flex items-center gap-1.5 leading-none">
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </span>
        </Button>
      ))}
    </div>
  );
}


