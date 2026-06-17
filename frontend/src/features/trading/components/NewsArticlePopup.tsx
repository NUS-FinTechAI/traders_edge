import { Popup } from "../../../shared/ui/Popup";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import type { NewsFeedItem } from "../types/tradingTypes";

interface NewsArticlePopupProps {
  isOpen: boolean;
  article: NewsFeedItem | null;
  onClose: () => void;
}

export function NewsArticlePopup({
  isOpen,
  article,
  onClose,
}: NewsArticlePopupProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const borderClass = THEME_CONFIG.colors.border.default;

  return (
    <Popup
      isOpen={isOpen && !!article}
      onClose={onClose}
      title="News Briefing"
      panelClassName="max-w-2xl"
      contentClassName="max-h-[70vh] overflow-y-auto pr-1"
      closeOnOverlayClick
    >
      {article ? (
        <div className="space-y-3">
          <div className={`text-xl font-semibold leading-tight ${textPrimary}`}>
            {article.headline}
          </div>
          {article.timestamp ? (
            <div className={`text-xs ${textSecondary}`}>{article.timestamp}</div>
          ) : null}
          <div className={`border-t ${borderClass}`} />
          <p className={`text-sm leading-6 whitespace-pre-line ${textSecondary}`}>
            {article.content}
          </p>
        </div>
      ) : null}
    </Popup>
  );
}

