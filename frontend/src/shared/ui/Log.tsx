import { THEME_CONFIG } from './config/themeConfig';
import { Card } from './Card';

export interface LogItem {
  id: string | number;
  title?: string;
  message: string;
  timestamp?: string;
  type?: 'buy' | 'sell' | 'news' | 'info';
}

interface LogProps {
  title: string;
  items: LogItem[];
  className?: string;
  height?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  hideTitle?: boolean;
}

export function Log({
  title,
  items,
  className = '',
  height = 220,
  collapsible = false,
  defaultCollapsed = false,
  hideTitle = false,
}: LogProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  return (
    <Card
      className={className}
      elevated
      collapsible={collapsible}
      title={title}
      defaultCollapsed={defaultCollapsed}
      contentClassName="p-3"
      headerClassName="px-3 py-2"
    >
      {!hideTitle ? <div className={`mb-2 text-sm font-semibold ${textPrimary}`}>{title}</div> : null}
      {items.length === 0 ? (
        <div className={`w-full flex items-center justify-center py-3 ${textSecondary}`}>
          {`No ${title.toLowerCase()}`}
        </div>
      ) : (
        <ul className="space-y-2" style={{ maxHeight: height, overflowY: 'auto' }}>
          {items.map((item) => {
            const titleColor = item.type === 'sell'
              ? THEME_CONFIG.colors.text.danger
              : item.type === 'buy'
              ? THEME_CONFIG.colors.text.success
              : textPrimary;
            return (
              <li key={item.id}>
                <Card className={`p-3 hover:cursor-pointer`} elevated>
                  {item.title ? (
                    <div className={`text-xs font-semibold ${titleColor}`}>{item.title}</div>
                  ) : null}
                  <div className={`text-sm ${textSecondary}`}>{item.message}</div>
                  {item.timestamp ? (
                    <div className={`text-[10px] ${textSecondary}`}>{item.timestamp}</div>
                  ) : null}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

