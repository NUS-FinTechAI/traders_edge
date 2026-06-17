// Centralized theme configuration
export const THEME_CONFIG = {
  colors: {
    // Background colors
    background: {
      primary: 'bg-white dark:bg-slate-900',
      secondary: 'bg-slate-50 dark:bg-slate-800',
      surface: 'bg-white dark:bg-slate-800',
      surfaceElevated: 'bg-slate-100 dark:bg-slate-700',
    },
    
    // Text colors
    text: {
      primary: 'text-slate-900 dark:text-slate-50',
      secondary: 'text-slate-600 dark:text-slate-300',
      muted: 'text-slate-500 dark:text-slate-400',
      success: 'text-emerald-600 dark:text-emerald-400',
      danger: 'text-red-600 dark:text-red-400',
      warning: 'text-orange-600 dark:text-orange-400',
    },
    
    // Border colors
    border: {
      default: 'border-slate-200 dark:border-slate-600',
      muted: 'border-slate-300 dark:border-slate-500',
    },
    
    // Action colors
    action: {
      success: 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600',
      danger: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600',
      successOutline: 'border-emerald-600 dark:border-emerald-500 text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
      dangerOutline: 'border-red-600 dark:border-red-500 text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20',
    },
    
    // Input colors
    input: {
      background: 'bg-white dark:bg-slate-800',
      border: 'border-slate-300 dark:border-slate-600',
      borderFocus: 'focus:border-emerald-500 focus:ring-emerald-500',
      text: 'text-slate-900 dark:text-slate-100',
      placeholder: 'placeholder-slate-500 dark:placeholder-slate-400',
    },
    
    // Card colors
    card: {
      background: 'bg-white dark:bg-slate-800',
      backgroundElevated: 'bg-slate-50 dark:bg-slate-700',
      border: 'border-slate-200 dark:border-slate-600',
      shadow: 'shadow-sm dark:shadow-lg',
    },

    // Chart colors
    chart: {
      chartBackground: 'bg-white dark:bg-slate-800',
      upBody: 'bg-emerald-600 dark:bg-emerald-500',
      upWick: 'bg-emerald-400 dark:bg-emerald-300',
      downBody: 'bg-red-600 dark:bg-red-500',
      downWick: 'bg-red-400 dark:bg-red-300',
    },
    
    // Rating colors
    rating: {
      starFilled: 'text-yellow-400 dark:text-yellow-300',
      starEmpty: 'text-slate-400 dark:text-slate-500',
    },

    // Overlay colors
    overlay: {
      scrim: 'bg-slate-900/30 dark:bg-slate-900/60',
    },

    // Activity calendar colors (low -> high activity)
    activity: {
      calendarColors: {
        light: ['#eff2f5', '#aceebb', '#4ac26b', '#2da44e', '#116329'],
        dark: ['#151b23', '#033a16', '#196c2e', '#2ea043', '#56d364'],
      },
    },

    // Icon accent colors
    icons: {
      lockGold: 'text-yellow-400 dark:text-yellow-300',
    },

    // Game mode cards - fixed dark-style text regardless of app theme
    gameCard: {
      textPrimary: 'text-slate-50',
      textSecondary: 'text-slate-300',
    },

    // Trophies theme
    achievement: {
      tileBg: 'bg-slate-100 dark:bg-slate-700',
      tileBorder: 'border-slate-200 dark:border-slate-600',
      iconEarned: 'text-emerald-500',
      iconLocked: 'text-slate-400',
      faded: 'opacity-50',
    },
  },
  
  // Component-specific class combinations
  components: {
    button: {
      base: 'font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
      sizes: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
        icon: 'p-2',
      },
      variants: {
        success: 'bg-emerald-600 dark:bg-emerald-500 text-white hover:bg-emerald-700 dark:hover:bg-emerald-600 focus:ring-emerald-500 active:bg-emerald-800 dark:active:bg-emerald-700',
        danger: 'bg-red-600 dark:bg-red-500 text-white hover:bg-red-700 dark:hover:bg-red-600 focus:ring-red-500 active:bg-red-800 dark:active:bg-red-700',
        outline: 'border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 focus:ring-slate-500 active:bg-slate-100 dark:active:bg-slate-600',
        ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:ring-slate-400 active:bg-slate-200 dark:active:bg-slate-600',
        icon: 'bg-transparent hover:bg-transparent text-slate-600 dark:text-slate-300 hover:opacity-80 focus:ring-slate-400',
        text: 'bg-transparent hover:bg-transparent text-emerald-600 dark:text-emerald-400 underline-offset-2 hover:underline focus:ring-emerald-400',
      },
    },
    
    card: {
      base: 'rounded-lg border transition-all duration-200',
      background: 'bg-white dark:bg-slate-800',
      backgroundElevated: 'bg-slate-50 dark:bg-slate-700',
      border: 'border-slate-200 dark:border-slate-600',
    },
    
    input: {
      base: 'border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed',
      background: 'bg-white dark:bg-slate-800',
      text: 'text-slate-900 dark:text-slate-100',
      placeholder: 'placeholder-slate-500 dark:placeholder-slate-400',
      border: 'border-slate-300 dark:border-slate-600',
      borderFocus: 'focus:border-emerald-500 focus:ring-emerald-500',
      borderError: 'border-red-500 focus:border-red-500 focus:ring-red-500',
    },
    
    navbar: {
      background: 'bg-white dark:bg-slate-900',
      border: 'border-slate-200 dark:border-slate-700',
      text: 'text-slate-900 dark:text-slate-100',
    },
  },
} as const;

// Helper function to get theme classes
export function getThemeClasses(component: keyof typeof THEME_CONFIG.components) {
  return THEME_CONFIG.components[component];
}

// Helper function to get color classes
export function getColorClasses(category: keyof typeof THEME_CONFIG.colors, variant?: string) {
  if (variant && variant in THEME_CONFIG.colors[category]) {
    return THEME_CONFIG.colors[category][variant as keyof typeof THEME_CONFIG.colors[typeof category]];
  }
  return THEME_CONFIG.colors[category];
}

// Type definitions
export type ThemeMode = 'light' | 'dark';
export type ButtonVariant = 'success' | 'danger' | 'outline' | 'ghost' | 'icon' | 'text';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

// Lightweight Charts expects hex values, not Tailwind class names.
// This helper maps our Tailwind palette tokens to the corresponding hex codes.
export type ChartHexColors = {
  background: string;
  text: string;
  grid: string;
  upBody: string;
  downBody: string;
  upWick: string;
  downWick: string;
};

export function getChartHexColors(isDark: boolean): ChartHexColors {
  // Tailwind palette (v3) hex mappings:
  // slate-900 #0F172A, slate-800 #1F2937, slate-600 #475569, slate-300 #CBD5E1, slate-200 #E2E8F0
  // emerald-600 #059669, emerald-500 #10B981, emerald-400 #34D399, emerald-300 #86EFAC
  // red-600 #DC2626, red-500 #EF4444, red-400 #F87171, red-300 #FCA5A5, white #FFFFFF
  if (isDark) {
    return {
      background: '#1F2937', // slate-800
      text: '#E2E8F0',       // slate-200
      grid: '#475569',       // slate-600
      upBody: '#10B981',     // emerald-500
      downBody: '#EF4444',   // red-500
      upWick: '#86EFAC',     // emerald-300
      downWick: '#FCA5A5',   // red-300
    };
  }
  return {
    background: '#FFFFFF',  // white
    text: '#0F172A',        // slate-900
    grid: '#CBD5E1',        // slate-300
    upBody: '#059669',      // emerald-600
    downBody: '#DC2626',    // red-600
    upWick: '#34D399',      // emerald-400
    downWick: '#F87171',    // red-400
  };
}
