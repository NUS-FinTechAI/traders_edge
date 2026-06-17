import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuthContext } from "../../../providers/AuthProvider";
import { useMultiplayerSocket } from "../../multiplayer/hooks/useMultiplayerSocket";
import { TradingPage } from "../components/TradingPage";
import { useMultiplayerGame } from "../hooks/useMultiplayerGame";

export function MultiplayerTradingPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const multiplayer = useMultiplayerSocket();

  const resolvedRoomCode = roomCode ?? multiplayer.roomCode ?? "";
  const userId = useMemo(() => user?.id ?? multiplayer.userId ?? "guest", [
    multiplayer.userId,
    user?.id,
  ]);

  return (
    <TradingPage
      useGameSession={useMultiplayerGame}
      levelParam={resolvedRoomCode}
      userId={userId}
      isResuming={false}
      onBackToLevelSelect={() => {
        multiplayer.disconnect();
        navigate("/multiplayer");
      }}
      onProceed={() => {
        multiplayer.disconnect();
        navigate("/multiplayer");
      }}
      enableTutorials={false}
    />
  );
}
