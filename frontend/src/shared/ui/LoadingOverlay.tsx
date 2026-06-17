import 'ldrs/waveform';
import { THEME_CONFIG } from './config/themeConfig';

interface LoadingOverlayProps {
  text?: string;
  isOpen?: boolean;
}

export function LoadingOverlay({ text = 'Loading...', isOpen = true }: LoadingOverlayProps) {
  if (!isOpen) return null;

  const scrim = THEME_CONFIG.colors.overlay?.scrim ?? 'bg-black/40';
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  return (
    <div className={`fixed inset-0 ${scrim} backdrop-blur-[2px] z-[100] flex items-center justify-center`}
      role="status" aria-live="polite" aria-label={text}
    >
      <div className="flex items-center gap-3">
        <div className="text-emerald-600 dark:text-emerald-400">
          {/* @ts-ignore - web component provided by ldrs */}
          <l-waveform size="36" stroke="3" speed="1" color="currentColor"></l-waveform>
        </div>
        <span className={`${textSecondary}`}>{text}</span>
      </div>
    </div>
  );
}


