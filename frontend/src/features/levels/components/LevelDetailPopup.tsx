import { Popup } from '../../../shared/ui/Popup';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import type { TutorialLevel } from '../types/levelTypes';
import { fetchLeaderboard, type LeaderboardRow } from '../services/leaderboardService';
import { Button } from '../../../shared/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface LevelDetailPopupProps {
  level: TutorialLevel | null;
  currentUserId: string;
  onClose: () => void;
}

export function LevelDetailPopup({ level, currentUserId, onClose }: LevelDetailPopupProps) {
  if (!level) return null;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const navigate = useNavigate();

  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const hasProgress = !!(level as any)?.progress && Object.keys(((level as any).progress ?? {})).length > 0;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!level) return;
      setIsLoading(true);
      setLoadError(null);
      try {
        const data = await fetchLeaderboard(level.tutorial_id, currentUserId);
        if (!mounted) return;
        setRows(data);
      } catch (e) {
        if (!mounted) return;
        setLoadError(e instanceof Error ? e.message : 'Failed to load leaderboard');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [level?.tutorial_id, currentUserId]);

  return (
    <Popup
      isOpen={!!level}
      onClose={onClose}
      title={level.title}
      showCloseButton
      footer={
        <div className="w-full flex justify-end gap-2">
          {hasProgress ? (
            <Button
              variant="outline"
              onClick={() => {
                navigate(`/adventureMode/${level.module}/${level.level_order}`, {
                  state: { newGame: false },
                });
              }}
              disabled={!level.available}
            >
              Resume Level
            </Button>
          ) : null}
          <Button
            variant="success"
            onClick={() => {
              navigate(`/adventureMode/${level.module}/${level.level_order}`, {
                state: { newGame: true },
              });
            }}
            disabled={!level.available}
          >
            Start Level
          </Button>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="space-y-1">
          <div className={`${textSecondary}`}>
            Attempted: <span className={textPrimary}>{level.attempted ? 'Yes' : 'No'}</span>
          </div>
          <div className={`${textSecondary}`}>
            Completed: <span className={textPrimary}>{level.completed ? 'Yes' : 'No'}</span>
          </div>
        </div>

        <div className="mt-3">
          <div className={`font-medium ${textPrimary} mb-2`}>Leaderboard</div>
          <div className={`rounded ${THEME_CONFIG.colors.card.border} ${THEME_CONFIG.colors.background.surfaceElevated} p-2 overflow-hidden`}>
            <div className="grid grid-cols-3 text-xs font-semibold px-2 py-1">
              <div className={textSecondary}>Rank</div>
              <div className={textSecondary}>User</div>
              <div className={`text-right ${textSecondary}`}>Score</div>
            </div>
            {isLoading ? (
              <div className={`px-2 py-2 text-sm ${textSecondary}`}>Loading leaderboard...</div>
            ) : loadError ? (
              <div className="px-2 py-2 text-sm text-red-600">{loadError}</div>
            ) : rows.length === 0 ? (
              <div className={`px-2 py-2 text-sm ${textSecondary}`}>No one yet... perhaps you could be the first!</div>
            ) : (
              <div className="divide-y">
                {rows.map((row) => (
                  <div key={`${row.userId}-${row.rank}`} className="grid grid-cols-3 items-center px-2 py-1 text-sm">
                    <div className={textSecondary}>{row.rank}</div>
                    <div className={`${row.isUser ? 'font-semibold' : ''} ${textPrimary}`}>
                      {row.userName}{row.isUser ? ' (you)' : ''}
                    </div>
                    <div className="text-right">
                      <span className={textPrimary}>
                        {(() => {
                          const val = typeof row.score === 'number' ? row.score : Number(row.score as any);
                          const truncated = Number.isFinite(val) ? Math.trunc(val * 100) / 100 : 0;
                          return truncated.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                        })()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Popup>
  );
}

