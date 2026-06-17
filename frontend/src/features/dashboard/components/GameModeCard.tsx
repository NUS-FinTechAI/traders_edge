import { Link } from 'react-router-dom';
import { Card, CardContent } from '../../../shared/ui/Card';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { LockKeyhole } from 'lucide-react';

interface GameModeCardProps {
  title: string;
  subtitle: string;
  to?: string;
  locked?: boolean;
  backgroundImageUrl?: string;
}

export function GameModeCard({ title, subtitle, to, locked = false, backgroundImageUrl }: GameModeCardProps) {
  const textPrimary = THEME_CONFIG.colors.gameCard.textPrimary;
  const textSecondary = THEME_CONFIG.colors.gameCard.textSecondary;
  const overlay = THEME_CONFIG.colors.overlay.scrim;
  const lockGold = THEME_CONFIG.colors.icons.lockGold;

  const content = (
    <div className="relative">
      <Card elevated className="h-32 flex items-center justify-center relative overflow-hidden">
        {backgroundImageUrl ? (
          <>
            <div className="absolute inset-0 bg-center bg-cover" style={{ backgroundImage: `url(${backgroundImageUrl})` }} />
            <div className="absolute inset-0 bg-black/60" />
          </>
        ) : null}
        <CardContent className="relative z-10">
          <div className={`text-center text-lg font-medium ${textPrimary}`}>{title}</div>
          <div className={`mt-1 text-center text-sm ${textSecondary}`}>{subtitle}</div>
        </CardContent>
      </Card>
      {locked && (
        <div className={`absolute inset-0 ${overlay} flex flex-col items-center justify-center rounded-lg z-20`}>
          <LockKeyhole className={`w-6 h-6 ${lockGold}`} fill="none" />
        </div>
      )}
    </div>
  );

  if (locked || !to) {
    return content;
  }

  return (
    <Link to={to} className="block group">
      <div className="transition-transform group-hover:scale-[1.01]">
        {content}
      </div>
    </Link>
  );
}


