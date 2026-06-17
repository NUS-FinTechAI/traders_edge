import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import type { TutorialLevel } from '../types/levelTypes';
import { Card, CardContent } from '../../../shared/ui/Card';
import { Button } from '../../../shared/ui/Button';

interface AdventureLevelCardProps {
  level: TutorialLevel;
  onPlay?: (level: TutorialLevel) => void;
}

export function AdventureLevelCard({ level, onPlay }: AdventureLevelCardProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const locked = !level.available;

  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <div className={`font-medium ${textPrimary}`}>{level.title}</div>
          <div className={`text-xs ${textSecondary}`}>Level {level.level_order}</div>
        </div>
        <div className="flex items-center gap-2">
          {locked ? (
            <Button size="sm" variant="danger" disabled>
              Locked
            </Button>
          ) : (
            <Button
              size="sm"
              variant="success"
              onClick={() => {
                if (onPlay) onPlay(level);
              }}
            >
              Play
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

