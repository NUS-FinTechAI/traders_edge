import { useTheme } from '../../providers/ThemeProvider';
import { THEME_CONFIG } from './config/themeConfig';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = ''}: ThemeToggleProps) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 hover:opacity-80 hover:cursor-pointer ${THEME_CONFIG.colors.text.secondary} ${className}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className={`w-5 h-5 transition-all duration-200`} /> : <Moon className={`w-5 h-5 transition-all duration-200`} />}
    </button>
  );
}
