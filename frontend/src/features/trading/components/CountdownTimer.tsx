import { useEffect, useMemo, useRef, useState } from 'react';
import { Timer as TimerIcon } from 'lucide-react';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { toast } from '../../../shared/ui/toast/Toast';

export interface CountdownTimerProps {
  durationSec?: number; // default 300s (5 minutes)
  warningThresholdSec?: number; // default 60s
  resetKey?: number | string; // change to restart the timer
  className?: string;
  onExpire?: () => void; // called once when timer hits zero
  isActive?: boolean; // if false, show full duration placeholder and do not tick
}

export function CountdownTimer({
  durationSec = 300,
  warningThresholdSec = 60,
  resetKey,
  className = '',
  onExpire,
  isActive = true,
}: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<number>(durationSec);
  const intervalRef = useRef<number | null>(null);
  const [warned, setWarned] = useState<boolean>(false);
  const [expiredNotified, setExpiredNotified] = useState<boolean>(false);

  // Restart timer whenever resetKey changes
  useEffect(() => {
    setRemaining(durationSec);
    setWarned(false);
    setExpiredNotified(false);
  }, [resetKey, durationSec]);

  // Tick every second
  useEffect(() => {
    // If not active, ensure no interval is running
    if (!isActive) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = window.setInterval(() => {
      setRemaining(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [resetKey, isActive]);

  // Trigger warning toast once when going under the threshold
  useEffect(() => {
    if (!isActive) return;
    if (!warned && remaining === Math.max(0, warningThresholdSec - 1)) {
      toast({
        title: 'Time Warning',
        message: '1 minute left to make your decision',
        variant: 'danger',
        durationMs: 4000,
      });
      setWarned(true);
    }
  }, [remaining, warned, warningThresholdSec, isActive]);

  // Notify once on expire
  useEffect(() => {
    if (!isActive) return;
    if (!expiredNotified && remaining === 0) {
      onExpire?.();
      setExpiredNotified(true);
    }
  }, [remaining, expiredNotified, onExpire, isActive]);

  const mmss = useMemo(() => {
    const value = isActive ? remaining : durationSec;
    const mins = Math.floor(value / 60);
    const secs = value % 60;
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [remaining, isActive, durationSec]);

  const textClass =
    (isActive ? remaining : durationSec) <= warningThresholdSec
      ? THEME_CONFIG.colors.text.danger
      : THEME_CONFIG.colors.text.secondary;

  return (
    <div className={`flex items-center gap-2 ${className}`} aria-label="Turn countdown timer">
      <TimerIcon className={`w-4 h-4 ${THEME_CONFIG.colors.text.secondary}`} />
      <span className={`text-sm font-medium ${textClass}`}>{mmss}</span>
    </div>
  );
}


