import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { THEME_CONFIG } from './config/themeConfig';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  disableClose?: boolean; // if true, disable ESC and hide close button
  showCloseButton?: boolean; // if true, show 'X' button (ignored if disableClose)
  closeOnOverlayClick?: boolean; // default false
  overlayEffect?: React.ReactNode; // if true, allow full-screen overlay effects above content
  panelClassName?: string;
  contentClassName?: string;
}

export function Popup({
  isOpen,
  onClose,
  title,
  children,
  footer,
  disableClose = false,
  showCloseButton = true,
  closeOnOverlayClick = false,
  overlayEffect,
  panelClassName = '',
  contentClassName = '',
}: PopupProps) {
  const overlay = 'bg-black/40';
  const cardBg = THEME_CONFIG.colors.card.background;
  const border = THEME_CONFIG.colors.border.default;
  const textPrimary = THEME_CONFIG.colors.text.primary;

  useEffect(() => {
    if (!isOpen || disableClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, disableClose]);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${overlay} overflow-hidden`}
      onClick={() => {
        if (!disableClose && closeOnOverlayClick) onClose();
      }}
    >
      {overlayEffect && (
        <div className="absolute inset-0 z-[51] pointer-events-none select-none">
          {overlayEffect}
        </div>
      )}
      <div
        className={`w-full max-w-md rounded-lg ${cardBg} ${border} p-4 relative overflow-x-hidden ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {(showCloseButton && !disableClose) ? (
          <button
            type="button"
            aria-label="Close"
            className={`absolute top-2 right-2 rounded cursor-pointer ${THEME_CONFIG.colors.text.muted} hover:opacity-80`}
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
        {title ? (
          <div className={`text-lg font-semibold ${textPrimary} mb-3 pr-6 flex items-center gap-2`}>{title}</div>
        ) : null}
        <div className={`mb-4 overflow-x-hidden overscroll-y-contain ${contentClassName}`}>
          {children}
        </div>
        {footer ? (
          <div className="flex justify-end gap-2">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
