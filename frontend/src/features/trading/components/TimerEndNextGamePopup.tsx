import { Popup } from '../../../shared/ui/Popup';
import { Button } from '../../../shared/ui/Button';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';

interface TimerEndNextGamePopupProps {
  isOpen: boolean;
  onConfirm: () => void;
}

export function TimerEndNextGamePopup({ isOpen, onConfirm }: TimerEndNextGamePopupProps) {
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  return (
    <Popup
      isOpen={isOpen}
      onClose={() => {}}
      title="Time's Up"
      disableClose
      showCloseButton={false}
    >
      <div className={`${textSecondary} mb-3`}>
        Your turn has ended. Proceed to the next turn.
      </div>
      <div className="flex justify-end">
        <Button variant="success" onClick={onConfirm}>
          Next Turn
        </Button>
      </div>
    </Popup>
  );
}


