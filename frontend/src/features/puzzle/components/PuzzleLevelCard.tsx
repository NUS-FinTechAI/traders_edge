import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import type { PuzzleLevel } from '../types/puzzleLevelSelectTypes';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';

interface PuzzleLevelCardProps {
  level: PuzzleLevel;
  onStart?: (level: PuzzleLevel) => void;
  onResume?: (level: PuzzleLevel) => void;
}

export function PuzzleLevelCard({ level, onStart, onResume }: PuzzleLevelCardProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const locked = !level.available;
  const hasProgress = !!level.progress && Object.keys(level.progress || {}).length > 0;

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <div className={`font-medium ${textPrimary}`}>{level.title}</div>
          <div className={`text-xs ${textSecondary}`}>Puzzle {level.level_order}</div>
        </div>
        <div className="flex items-center gap-2">
          {locked ? (
            <Button size="sm" variant="danger" disabled>
              Locked
            </Button>
          ) : (
            <>
              {hasProgress ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (onResume) onResume(level);
                  }}
                >
                  Resume
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="success"
                onClick={() => {
                  if (onStart) onStart(level);
                }}
              >
                Start
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

