import { useEffect, useMemo, useState } from "react";

import { Button } from "../../../shared/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/Card";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import { Copy, Crown, LoaderCircle, Users } from "lucide-react";
import type {
  MultiplayerPrivateMessage,
  MultiplayerRoomFeatures,
  MultiplayerSocketStatus,
} from "../types/multiplayerTypes";

interface RoomLobbyProps {
  roomCode: string;
  currentUserId: string;
  status: MultiplayerSocketStatus;
  hostUserId: string | null;
  isHost: boolean;
  players: string[];
  privateMessages: MultiplayerPrivateMessage[];
  roomFeatures: MultiplayerRoomFeatures | null;
  error: string | null;
  notice?: string | null;
  gameStarted: boolean;
  onLeaveRoom: () => void;
  onRefreshPlayers: () => void;
  onStartGame: () => void;
  onSendPrivateMessage: (params: { recipientId: string; content: string }) => void;
}

const STATUS_LABEL: Record<MultiplayerSocketStatus, string> = {
  idle: "Idle",
  connecting: "Connecting...",
  connected: "Connected",
  closed: "Disconnected",
  error: "Connection Error",
};

export function RoomLobby({
  roomCode,
  currentUserId,
  status,
  hostUserId,
  isHost,
  players,
  privateMessages,
  roomFeatures,
  error,
  notice,
  gameStarted,
  onLeaveRoom,
  onRefreshPlayers,
  onStartGame,
  onSendPrivateMessage,
}: RoomLobbyProps) {
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const textDanger = THEME_CONFIG.colors.text.danger;
  const inputClass =
    "w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400";
  const isConnected = status === "connected";
  const connectedChipClass =
    "text-xs px-2 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
  const neutralChipClass =
    "text-xs px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  const waitingChipClass =
    "text-xs px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  const [copyLabel, setCopyLabel] = useState("Copy");
  const fakeNewsEnabled =
    roomFeatures?.available_tools?.fake_news == null
      ? null
      : roomFeatures.available_tools.fake_news;
  const privateChatEnabled =
    roomFeatures?.available_tools?.private_chat == null
      ? null
      : roomFeatures.available_tools.private_chat;
  const npcOrdersEnabled =
    roomFeatures?.has_npc_orders == null ? null : roomFeatures.has_npc_orders;
  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [chatDraft, setChatDraft] = useState("");

  const sortedPlayers = useMemo(() => {
    if (players.length === 0) return [];
    return [...players].sort((a, b) => {
      if (a === currentUserId) return -1;
      if (b === currentUserId) return 1;
      return a.localeCompare(b);
    });
  }, [players, currentUserId]);

  const selectableRecipients = useMemo(
    () => sortedPlayers.filter((player) => player !== currentUserId),
    [sortedPlayers, currentUserId]
  );

  useEffect(() => {
    if (
      selectedRecipientId &&
      selectableRecipients.includes(selectedRecipientId)
    ) {
      return;
    }
    setSelectedRecipientId(selectableRecipients[0] ?? "");
  }, [selectedRecipientId, selectableRecipients]);

  const conversation = useMemo(
    () =>
      privateMessages.filter(
        (message) =>
          (message.from === currentUserId && message.to === selectedRecipientId) ||
          (message.from === selectedRecipientId && message.to === currentUserId)
      ),
    [currentUserId, privateMessages, selectedRecipientId]
  );

  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopyLabel("Copied");
      setTimeout(() => setCopyLabel("Copy"), 1200);
    } catch {
      setCopyLabel("Failed");
      setTimeout(() => setCopyLabel("Copy"), 1200);
    }
  };

  const handleSendPrivateMessage = () => {
    const content = chatDraft.trim();
    if (!selectedRecipientId || !content) return;
    onSendPrivateMessage({
      recipientId: selectedRecipientId,
      content,
    });
    setChatDraft("");
  };

  return (
    <Card elevated>
      <CardHeader>
        <CardTitle>Room Lobby</CardTitle>
        <CardDescription>Share the room code and get everyone ready before starting.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50/70 dark:bg-slate-800/50 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className={`text-xs uppercase tracking-wide ${textSecondary}`}>Room Code</div>
            <div className={`text-xl font-semibold tracking-widest ${textPrimary}`}>{roomCode}</div>
          </div>
          <Button variant="outline" size="sm" onClick={copyRoomCode}>
            <span className="inline-flex items-center gap-2">
              <Copy size={14} className={textSecondary} />
              {copyLabel}
            </span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm ${textSecondary}`}>Status:</span>
          <span className={neutralChipClass}>
            {STATUS_LABEL[status]}
          </span>
          <span className={neutralChipClass}>
            Host: {hostUserId ?? "Pending"}
          </span>
          {isHost ? (
            <span className={`${connectedChipClass} inline-flex items-center gap-1`}>
              <Crown size={12} className="text-emerald-600 dark:text-emerald-300" />
              Host
            </span>
          ) : (
            <span className={waitingChipClass}>
              Waiting for host
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`text-sm ${textSecondary}`}>Room Features:</span>
          <span className={fakeNewsEnabled ? connectedChipClass : neutralChipClass}>
            Fake News{" "}
            {fakeNewsEnabled == null
              ? "Pending"
              : fakeNewsEnabled
                ? "Enabled"
                : "Disabled"}
          </span>
          <span className={privateChatEnabled ? connectedChipClass : neutralChipClass}>
            Private Chat{" "}
            {privateChatEnabled == null
              ? "Pending"
              : privateChatEnabled
                ? "Enabled"
                : "Disabled"}
          </span>
          <span className={npcOrdersEnabled ? connectedChipClass : neutralChipClass}>
            NPC Orders{" "}
            {npcOrdersEnabled == null
              ? "Pending"
              : npcOrdersEnabled
                ? "Enabled"
                : "Disabled"}
          </span>
        </div>

        <div className="space-y-2">
          <div className={`text-sm font-medium ${textPrimary} inline-flex items-center gap-2`}>
            <Users size={15} className={textSecondary} />
            Players
          </div>
          {sortedPlayers.length > 0 ? (
            <ul className="space-y-2">
              {sortedPlayers.map((playerId) => (
                <li
                  key={playerId}
                  className="rounded border border-slate-200 dark:border-slate-600 p-2 flex items-center justify-between"
                >
                  <span className={`text-sm ${textPrimary}`}>
                    {playerId}
                    {playerId === currentUserId ? " (you)" : ""}
                  </span>
                  {playerId === hostUserId ? (
                    <span className={`${connectedChipClass} inline-flex items-center gap-1`}>
                      <Crown size={12} className="text-emerald-600 dark:text-emerald-300" />
                      Host
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <div className={`text-sm ${textSecondary}`}>
              No players visible yet. Use refresh to request the latest active players list.
            </div>
          )}
        </div>

        {privateChatEnabled && !gameStarted ? (
          <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900/50 p-3 space-y-2">
            <div className={`text-xs uppercase tracking-wide ${textSecondary}`}>
              Private Chat
            </div>
            <select
              className={inputClass}
              value={selectedRecipientId}
              onChange={(event) => setSelectedRecipientId(event.target.value)}
              disabled={selectableRecipients.length === 0}
            >
              {selectableRecipients.length === 0 ? (
                <option value="">No other players</option>
              ) : null}
              {selectableRecipients.map((player) => (
                <option key={player} value={player}>
                  {player}
                </option>
              ))}
            </select>

            <div className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 max-h-48 min-h-24 overflow-y-auto p-2 space-y-1">
              {conversation.length === 0 ? (
                <div className={`text-xs ${textSecondary}`}>
                  Select a player and send a private message while waiting for game start.
                </div>
              ) : (
                conversation.map((message) => {
                  const mine = message.from === currentUserId;
                  return (
                    <div
                      key={message.id}
                      className={`text-xs rounded px-2 py-1 ${
                        mine
                          ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100"
                          : "bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                      }`}
                    >
                      <div className="font-semibold">{mine ? "You" : message.from}</div>
                      <div>{message.content}</div>
                    </div>
                  );
                })
              )}
            </div>

            <textarea
              className={inputClass}
              rows={2}
              placeholder="Type a private message"
              value={chatDraft}
              onChange={(event) => setChatDraft(event.target.value)}
            />
            <Button
              size="sm"
              onClick={handleSendPrivateMessage}
              disabled={!selectedRecipientId || chatDraft.trim().length === 0}
            >
              Send Message
            </Button>
          </div>
        ) : null}

        <div className={`text-sm ${textSecondary}`}>
          Connected as <span className={`font-medium ${textPrimary}`}>{currentUserId}</span>
        </div>

        {gameStarted ? (
          <div className="text-sm rounded border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300 p-2 inline-flex items-center gap-2">
            <LoaderCircle size={14} className="animate-spin text-emerald-600 dark:text-emerald-300" />
            Game is starting...
          </div>
        ) : null}

        {notice ? (
          <div className="text-sm rounded border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/30 dark:bg-sky-950/30 dark:text-sky-300 p-3">
            {notice}
          </div>
        ) : null}

        {error ? <div className={`text-sm ${textDanger}`}>{error}</div> : null}

        <div className="border-t border-slate-200 dark:border-slate-600 pt-4 space-y-3">
          {!isHost ? (
            <div className={`text-sm ${textSecondary} rounded bg-slate-50 dark:bg-slate-800 px-3 py-2`}>
              Waiting for {hostUserId ?? "the host"} to start the game...
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" onClick={onRefreshPlayers} disabled={!isConnected}>
              Refresh Players
            </Button>
            {isHost ? (
              <Button onClick={onStartGame} disabled={!isConnected || gameStarted}>
                {gameStarted ? "Game Starting..." : "Start Game"}
              </Button>
            ) : null}
            <Button variant="danger" onClick={onLeaveRoom}>
              Leave Room
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
