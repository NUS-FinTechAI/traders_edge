import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { fetchPuzzleLevels } from '../services/puzzleLevelSelectApi.ts';
import type { PuzzleLevel } from '../types/puzzleLevelSelectTypes.ts';
import { PuzzleLevelCard } from './PuzzleLevelCard.tsx';

export function PuzzleLevelSelectPage() {
  const navigate = useNavigate();
  const backgroundClass = THEME_CONFIG.colors.background.primary;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const card = THEME_CONFIG.colors.card;

  const [levels, setLevels] = useState<PuzzleLevel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchPuzzleLevels();
        if (!mounted) return;
        setLevels(data);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : 'Failed to load puzzle levels');
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className={`h-full w-full ${backgroundClass} p-6 overflow-y-auto`}>
      <div className="max-w-4xl mx-auto space-y-4">
        <div className={`text-2xl font-semibold ${textPrimary}`}>Puzzle Mode</div>

        <div className={`rounded-lg ${card.backgroundElevated} ${card.border} p-4`}>
          {isLoading ? (
            <div className={textSecondary}>Loading puzzle levels...</div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : levels.length === 0 ? (
            <div className={textSecondary}>No puzzles yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {levels.map((lvl) => (
                <PuzzleLevelCard
                  key={lvl.puzzle_id}
                  level={lvl}
                  onStart={(selected) => {
                    navigate(`/puzzleMode/${selected.puzzle_id}`, {
                      state: { newGame: true, levelId: selected.puzzle_id },
                    });
                  }}
                  onResume={(selected) => {
                    navigate(`/puzzleMode/${selected.puzzle_id}`, {
                      state: { newGame: false, levelId: selected.puzzle_id },
                    });
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


