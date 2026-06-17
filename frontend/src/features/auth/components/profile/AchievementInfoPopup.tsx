import { useEffect, useState } from 'react';
import { CircleCheckBig, Lock } from 'lucide-react';
import { Popup } from '../../../../shared/ui/Popup';
import { THEME_CONFIG } from '../../../../shared/ui/config/themeConfig';
import type { Achievement } from '../../types/profileTypes';
import { getAchievementIcon, getAchievementIconColorClass } from './achievementIcon';

interface TrophyInfoPopupProps {
  trophy: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TrophyInfoPopup({ trophy, isOpen, onClose }: TrophyInfoPopupProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(id);
    }
    setAnimateIn(false);
  }, [isOpen]);

  const Icon = trophy ? getAchievementIcon(trophy.iconKey) : null;
  const isAchieved = Boolean(trophy?.achieved);

  return (
    <Popup
      isOpen={isOpen}
      onClose={() => { setAnimateIn(false); onClose(); }}
      title={trophy ? (
        <div className="inline-flex items-center gap-2">
          {Icon ? (
            <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${THEME_CONFIG.colors.card.border} ${THEME_CONFIG.colors.card.backgroundElevated}`}>
              <Icon className={`w-5 h-5 ${getAchievementIconColorClass(isAchieved)}`} />
            </span>
          ) : null}
          <span>{trophy.title}</span>
        </div>
      ) : 'Achievement'}
      panelClassName="max-w-lg"
      showCloseButton
    >
      <div className={`transform transition-all duration-200 ${animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        {trophy ? (
          <div className="space-y-4">
            <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium ${
              isAchieved
                ? 'border-emerald-300/70 dark:border-emerald-600/60 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10'
                : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 bg-slate-200/60 dark:bg-slate-700/80'
            }`}>
              {isAchieved ? <CircleCheckBig size={13} /> : <Lock size={13} />}
              {isAchieved ? 'Unlocked' : 'Locked'}
            </div>

            {isAchieved ? (
              <div className={`rounded-xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50/70 dark:bg-emerald-900/20 p-3 ${textPrimary}`}>
                {trophy.description}
              </div>
            ) : (
              <div className={`space-y-2 rounded-xl border ${THEME_CONFIG.colors.card.border} ${THEME_CONFIG.colors.card.backgroundElevated} p-3`}>
                <div className={`text-sm font-medium ${textPrimary}`}>Hint</div>
                <div className={`text-sm ${textSecondary}`}>{trophy.hint}</div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </Popup>
  );
}
