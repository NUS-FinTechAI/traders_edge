import { useEffect, useState } from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import './toast.css';
import { THEME_CONFIG } from '../config/themeConfig';
import { X } from 'lucide-react';

type ToastVariant = 'success' | 'danger';

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant; // success (green) or danger (red)
  durationMs?: number;
}

type ToastItem = Required<ToastOptions> & { id: string; open: boolean };

let dispatchToast: ((t: ToastOptions) => void) | null = null;

export function toast(options: ToastOptions) {
  if (dispatchToast) dispatchToast(options);
}

export function ToastRoot() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    dispatchToast = (opts: ToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        id,
        title: opts.title ?? '',
        message: opts.message,
        variant: opts.variant ?? 'success',
        durationMs: opts.durationMs ?? 3500,
        open: true,
      };
      setToasts(prev => [...prev, item]);
    };
    return () => {
      dispatchToast = null;
    };
  }, []);

  const handleOpenChange = (id: string, open: boolean) => {
    if (!open) {
      setToasts(prev => prev.filter(t => t.id !== id));
    }
  };

  const cardBg = THEME_CONFIG.colors.card.background;
  const borderDefault = THEME_CONFIG.colors.border.default;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const barSuccess = THEME_CONFIG.colors.chart.upBody;
  const barDanger = THEME_CONFIG.colors.chart.downBody;

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map(t => (
         <ToastPrimitive.Root
          key={t.id}
          open={t.open}
          onOpenChange={(open) => handleOpenChange(t.id, open)}
          duration={t.durationMs}
          className={`
             radix-toast rounded-lg shadow-lg ${cardBg} border ${borderDefault} p-4 min-w-[260px] max-w-[360px] relative overflow-hidden
             transition-transform transition-opacity
          `}
        >
           <span
             className={`absolute left-0 top-0 bottom-0 w-1 ${t.variant === 'success' ? barSuccess : barDanger}`}
             aria-hidden
           />
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              {t.title && (
                <ToastPrimitive.Title className={`text-sm font-semibold ${textPrimary} mb-1`}>
                  {t.title}
                </ToastPrimitive.Title>
              )}
              <ToastPrimitive.Description className={`text-sm ${textSecondary}`}>
                {t.message}
              </ToastPrimitive.Description>
            </div>
            <ToastPrimitive.Close 
               className={`rounded-md p-1 cursor-pointer ${textSecondary} hover:${textPrimary} transition-colors opacity-70 hover:opacity-100`}
              aria-label="Close"
            >
              <X size={16} />
            </ToastPrimitive.Close>
          </div>
          <div className="mt-3 h-1 w-full overflow-hidden rounded">
            <div
              className={`h-full origin-left ${t.variant === 'success' ? barSuccess : barDanger}`}
              style={{ animation: `toastProgress ${t.durationMs}ms linear forwards` }}
            />
          </div>
        </ToastPrimitive.Root>
      ))}
      <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 items-end w-[360px] max-w-[100vw] p-4 outline-none" />
    </ToastPrimitive.Provider>
  );
}


