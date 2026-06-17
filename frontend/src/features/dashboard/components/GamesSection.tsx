import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { GameModeCard } from './GameModeCard';

export function GamesSection() {
  const textPrimary = THEME_CONFIG.colors.text.primary;

  return (
    <div className="space-y-3">
      <div className={`text-xl font-semibold ${textPrimary}`}>Ready to Trade?</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <GameModeCard title="Adventure Mode" subtitle="The essential exploration into trading" to="/adventureMode" backgroundImageUrl="/tutorial-mode.jpg" />
        <GameModeCard title="Puzzle Mode" subtitle="Test your skills with varying challenges" to="/puzzleMode" backgroundImageUrl="/puzzle-mode.jpg" />
        <GameModeCard title="Multiplayer" subtitle="Create a room, invite friends, and trade together" to="/multiplayer" backgroundImageUrl="/multiplayer-mode.png" />
        <GameModeCard title="Endless Mode" subtitle="Trade without limits" locked backgroundImageUrl="/endless-mode.jpeg" />
      </div>
    </div>
  );
}


