import { Popup } from "../../../shared/ui/Popup";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";

interface ContextPopupProps {
  isOpen: boolean;
  onClose: () => void;
  context: string | null;
}

export function ContextPopup({ isOpen, onClose, context }: ContextPopupProps) {
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  return (
    <Popup isOpen={isOpen && !!context} onClose={onClose} title="Level Context">
      <div className={textSecondary}>{context}</div>
    </Popup>
  );
}
