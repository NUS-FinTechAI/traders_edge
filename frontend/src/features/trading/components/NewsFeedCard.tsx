import { Card } from "../../../shared/ui/Card";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import type { NewsFeedItem } from "../types/tradingTypes";

interface NewsFeedCardProps {
  items: NewsFeedItem[];
  hasUnreadNews: boolean;
  isNewsRead: (newsId: string) => boolean;
  onOpenArticle: (item: NewsFeedItem) => void;
}

export function NewsFeedCard({
  items,
  hasUnreadNews,
  isNewsRead,
  onOpenArticle,
}: NewsFeedCardProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  return (
    <div
      className={`rounded-lg transition-all duration-300 ${
        hasUnreadNews
          ? "ring-1 ring-amber-300/70 shadow-[0_0_0_1px_rgba(245,158,11,0.35),0_0_20px_rgba(245,158,11,0.28)] animate-pulse"
          : ""
      }`}
    >
      <Card
        elevated
        collapsible
        title="News"
        contentClassName="p-3"
        headerClassName={hasUnreadNews ? "bg-amber-50/80 dark:bg-amber-950/20" : ""}
      >
        {items.length === 0 ? (
          <div className={`w-full flex items-center justify-center py-3 ${textSecondary}`}>
            No news
          </div>
        ) : (
          <ul className="space-y-2" style={{ maxHeight: 220, overflowY: "auto" }}>
            {items.map((item) => {
              const unread = !isNewsRead(item.id);
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`w-full rounded-lg border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:cursor-pointer ${
                      unread
                        ? "border-amber-300/90 bg-amber-50/80 dark:border-amber-700/70 dark:bg-amber-950/20"
                        : "border-slate-200 bg-white/70 dark:border-slate-700 dark:bg-slate-900/20"
                    }`}
                    onClick={() => onOpenArticle(item)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className={`line-clamp-2 text-sm font-semibold leading-snug ${textPrimary}`}>
                        {item.headline}
                      </div>
                      {unread ? (
                        <span className="inline-flex shrink-0 rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                          New
                        </span>
                      ) : null}
                    </div>
                    {item.timestamp ? (
                      <div className={`mt-1 text-[10px] ${textSecondary}`}>
                        {item.timestamp}
                      </div>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}

