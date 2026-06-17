import { useMemo, useState } from "react";

import { Users } from "lucide-react";
import { useAuthContext } from "../../../providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "../../../shared/ui/Card";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import { CreateRoomPanel } from "../components/CreateRoomPanel";
import { JoinRoomPanel } from "../components/JoinRoomPanel";
import { RoomLobby } from "../components/RoomLobby";
import { useMultiplayerSocket } from "../hooks/useMultiplayerSocket";
import { createMultiplayerRoom } from "../services/multiplayerApi";
import type { MultiplayerRoomFeatures } from "../types/multiplayerTypes";

export function MultiplayerPage() {
  const { user } = useAuthContext();
  const userId = useMemo(() => user?.id ?? "guest", [user?.id]);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [createRoomError, setCreateRoomError] = useState<string | null>(null);

  const {
    status,
    roomCode,
    roomFeatures,
    host,
    isHost,
    players,
    privateMessages,
    gameStarted,
    error,
    notice,
    connectToRoom,
    disconnect,
    requestActivePlayers,
    startGame,
    sendPrivateMessage,
    clearError,
  } = useMultiplayerSocket();

  const handleCreateRoom = async (roomFeatures: MultiplayerRoomFeatures) => {
    clearError();
    setCreateRoomError(null);
    setIsCreatingRoom(true);
    try {
      const createdRoom = await createMultiplayerRoom(roomFeatures);
      connectToRoom({
        roomCode: createdRoom.room_code,
        userId,
        roomFeatures: createdRoom.room_features,
      });
    } catch (error) {
      setCreateRoomError(
        error instanceof Error
          ? error.message
          : "Failed to create room. Please try again."
      );
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const handleJoinRoom = (nextRoomCode: string) => {
    clearError();
    connectToRoom({ roomCode: nextRoomCode, userId });
  };

  const handleLeaveRoom = () => {
    disconnect();
    clearError();
  };

  const backgroundClass = THEME_CONFIG.colors.background.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;

  return (
    <div className={`h-full w-full ${backgroundClass} p-6 overflow-y-auto`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <Card elevated>
          <CardHeader>
            <CardTitle>Multiplayer Lobby</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`text-sm ${textSecondary}`}>
              Team up with friends in a shared room. Create a room, invite players, and start when everyone is ready.
            </div>
          </CardContent>
        </Card>

        {roomCode ? (
          <RoomLobby
            roomCode={roomCode}
            currentUserId={userId}
            status={status}
            hostUserId={host}
            isHost={isHost}
            players={players}
            privateMessages={privateMessages}
            gameStarted={gameStarted}
            error={error}
            notice={notice}
            onLeaveRoom={handleLeaveRoom}
            onRefreshPlayers={requestActivePlayers}
            onStartGame={startGame}
            onSendPrivateMessage={sendPrivateMessage}
            roomFeatures={roomFeatures}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            <div className="lg:col-span-2">
              <CreateRoomPanel
                onCreateRoom={handleCreateRoom}
                disabled={status === "connecting" || isCreatingRoom}
              />
            </div>

            <div className="space-y-4">
              <JoinRoomPanel
                onJoinRoom={handleJoinRoom}
                disabled={status === "connecting" || isCreatingRoom}
              />

              <Card elevated>
                <CardHeader>
                  <CardTitle>How It Works</CardTitle>
                </CardHeader>
                <CardContent className={`space-y-3 text-sm ${textSecondary}`}>
                  <div className="inline-flex items-start gap-2">
                    <Users size={15} className="mt-0.5 text-slate-500 dark:text-slate-300" />
                    <span>Create a room or join with a code.</span>
                  </div>
                  <div>Only the room host can start the match.</div>
                  <div>Players are auto-synced while the lobby is open.</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {createRoomError ? (
          <Card elevated>
            <CardContent className="text-sm text-red-600 dark:text-red-400">
              {createRoomError}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
