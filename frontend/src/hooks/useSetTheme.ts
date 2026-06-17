import { useState, useLayoutEffect, useEffect } from 'react';

type Theme = 'light' | 'dark';

export function useSetTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme') as Theme;
    return saved || 'light';
  });

  const [isDark, setIsDark] = useState(() => theme === 'dark');

  useLayoutEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    setIsDark(theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      switch (prev) {
        case 'light': return 'dark';
        case 'dark': return 'light';
        default: return 'dark';
      }
    });
  };

  return {
    theme,
    isDark,
    toggleTheme,
    setTheme
  };
}
