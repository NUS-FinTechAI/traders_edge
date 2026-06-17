import React, { useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { THEME_CONFIG } from './config/themeConfig';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  collapsible?: boolean;
  title?: React.ReactNode;
  defaultCollapsed?: boolean;
  contentClassName?: string;
  headerClassName?: string;
}

export function Card({
  children,
  className = '',
  elevated = false,
  collapsible = false,
  title,
  defaultCollapsed = false,
  contentClassName = '',
  headerClassName = '',
}: CardProps) {
  const cardConfig = THEME_CONFIG.components.card;

  const backgroundClass = elevated
    ? cardConfig.backgroundElevated
    : cardConfig.background;
  const borderClass = cardConfig.border;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textMuted = THEME_CONFIG.colors.text.muted;
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  const classes = [
    cardConfig.base,
    backgroundClass,
    borderClass,
    className
  ].filter(Boolean).join(' ');

  if (!collapsible) {
    return (
      <div className={classes}>
        {children}
      </div>
    );
  }

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const updateHeight = () => setContentHeight(el.scrollHeight);
    updateHeight();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);
    return () => observer.disconnect();
  }, [children, isCollapsed]);

  return (
    <div className={classes}>
      <button
        type="button"
        className={`w-full px-3 py-2 ${!isCollapsed ? `border-b ${borderClass}` : ''} flex items-center justify-between hover:opacity-90 cursor-pointer ${headerClassName}`}
        onClick={() => setIsCollapsed((prev) => !prev)}
        aria-expanded={!isCollapsed}
        aria-label={isCollapsed ? 'Expand section' : 'Collapse section'}
      >
        <span className={`text-sm font-semibold ${textPrimary}`}>{title ?? 'Section'}</span>
        <span className={`transition-transform duration-200 ease-in-out ${textMuted} ${isCollapsed ? '' : 'rotate-180'}`}>
          <ChevronDown size={16} />
        </span>
      </button>
      <div
        style={{ maxHeight: isCollapsed ? 0 : contentHeight }}
        className="overflow-hidden transition-[max-height,opacity] duration-250 ease-in-out"
      >
        <div
          ref={contentRef}
          className={`transition-opacity duration-200 ease-in-out ${isCollapsed ? 'opacity-0' : 'opacity-100'} ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  const borderClass = THEME_CONFIG.colors.border.default;
  
  return (
    <div className={`px-6 py-4 border-b ${borderClass} ${className}`}>
      {children}
    </div>
  );
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function CardTitle({ children, className = '' }: CardTitleProps) {
  const textClass = THEME_CONFIG.colors.text.primary;
  
  return (
    <h3 className={`text-lg font-semibold ${textClass} ${className}`}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function CardDescription({ children, className = '' }: CardDescriptionProps) {
  const textClass = THEME_CONFIG.colors.text.secondary;
  
  return (
    <p className={`text-sm ${textClass} ${className}`}>
      {children}
    </p>
  );
}
