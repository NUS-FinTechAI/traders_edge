import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { Lock, Sparkles } from 'lucide-react';

interface QuizAccessCardProps {
  title: string;
  description: string;
  locked?: boolean;
  scoreLabel?: string;
  onClick?: () => void;
}

export function QuizAccessCard({ title, description, locked = false, scoreLabel, onClick }: QuizAccessCardProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const cardBorder = THEME_CONFIG.colors.card.border;
  const cardBg = THEME_CONFIG.colors.card.backgroundElevated;
  const muted = THEME_CONFIG.colors.text.muted;

  return (
    <button
      type="button"
      disabled={locked}
      onClick={locked ? undefined : onClick}
      className={`group w-full text-left transition-all ${
        locked ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
      }`}
    >
      <div className={`relative rounded-xl ${cardBg} p-4 overflow-hidden`}>
        <div className="absolute inset-y-0 left-0 w-1 bg-amber-500/60 dark:bg-amber-400/60" />
        <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-amber-400/10 dark:bg-amber-300/10" />
        <div className="flex items-start justify-between gap-3 relative">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${muted} border ${cardBorder}`}>
                <Sparkles size={12} />
                Quiz
              </span>
              {locked ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${textSecondary} border ${cardBorder}`}>
                  <Lock size={12} />
                  Locked
                </span>
              ) : null}
              {scoreLabel ? (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${textSecondary} border ${cardBorder}`}>
                  {scoreLabel}
                </span>
              ) : null}
            </div>
            <div className={`text-lg font-semibold ${textPrimary}`}>{title}</div>
            <div className={`text-sm ${textSecondary}`}>{description}</div>
          </div>
          <div className={`mt-1 ${textSecondary}`}>
            <Sparkles size={18} className="group-hover:rotate-6 transition-transform" />
          </div>
        </div>
      </div>
    </button>
  );
}
