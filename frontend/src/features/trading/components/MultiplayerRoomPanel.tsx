import { useEffect, useMemo, useState } from "react";

import { MessageSquare, Megaphone, Users } from "lucide-react";
import { Button } from "../../../shared/ui/Button";
import { Popup } from "../../../shared/ui/Popup";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import type {
  MultiplayerPrivateMessage,
  MultiplayerRoomFeatures,
} from "../../multiplayer/types/multiplayerTypes";

interface MultiplayerRoomPanelProps {
  roomCode: string | null;
  currentUserId: string;
  players: string[];
  privateMessages: MultiplayerPrivateMessage[];
  roomFeatures: MultiplayerRoomFeatures;
  availableTickers: string[];
  onRefreshPlayers: () => void;
  onSendPrivateMessage: (params: {
    recipientId: string;
    content: string;
  }) => void;
  onSendFakeNews: (params: {
    ticker: string;
    content: string;
    delay: number;
  }) => void;
}

export function MultiplayerRoomPanel({
  roomCode,
  currentUserId,
  players,
  privateMessages,
  roomFeatures,
  availableTickers,
  onRefreshPlayers,
  onSendPrivateMessage,
  onSendFakeNews,
}: MultiplayerRoomPanelProps) {
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const inputClass =
    "w-full rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400";

  const [isPlayersOpen, setIsPlayersOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFakeNewsOpen, setIsFakeNewsOpen] = useState(false);

  const [selectedRecipientId, setSelectedRecipientId] = useState("");
  const [chatDraft, setChatDraft] = useState("");
  const [selectedTicker, setSelectedTicker] = useState("");
  const [fakeNewsDraft, setFakeNewsDraft] = useState("");
  const [fakeNewsDelay, setFakeNewsDelay] = useState("5");

  const sortedPlayers = useMemo(() => {
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

  useEffect(() => {
    if (selectedTicker && availableTickers.includes(selectedTicker)) return;
    setSelectedTicker(availableTickers[0] ?? "");
  }, [availableTickers, selectedTicker]);

  const conversation = useMemo(
    () =>
      privateMessages.filter(
        (message) =>
          (message.from === currentUserId && message.to === selectedRecipientId) ||
          (message.from === selectedRecipientId && message.to === currentUserId)
      ),
    [currentUserId, privateMessages, selectedRecipientId]
  );

  const handleSendPrivateMessage = () => {
    const content = chatDraft.trim();
    if (!selectedRecipientId || !content) return;
    onSendPrivateMessage({
      recipientId: selectedRecipientId,
      content,
    });
    setChatDraft("");
  };

  const handleSendFakeNews = () => {
    const content = fakeNewsDraft.trim();
    const delay = Number(fakeNewsDelay);
    if (!selectedTicker || !content || !Number.isFinite(delay)) return;
    onSendFakeNews({
      ticker: selectedTicker,
      content,
      delay,
    });
    setFakeNewsDraft("");
  };

  return (
    <>
      <div className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white/85 dark:bg-slate-900/85 backdrop-blur px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="text-xs text-slate-700 dark:text-slate-300">
          Room <span className="font-semibold text-slate-900 dark:text-slate-100">{roomCode ?? "-"}</span>
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300">
          Mode{" "}
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {roomFeatures.has_npc_orders
              ? "NPC Liquidity Enabled"
              : "Player-Only Order Book"}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setIsPlayersOpen(true)}
          >
            <span className="inline-flex items-center gap-2">
              <Users size={12} />
              Players ({sortedPlayers.length})
            </span>
          </Button>
          {roomFeatures.available_tools.private_chat ? (
            <Button size="sm" className="text-xs" onClick={() => setIsChatOpen(true)}>
              <span className="inline-flex items-center gap-2">
                <MessageSquare size={12} />
                Private Chat
              </span>
            </Button>
          ) : null}
          {roomFeatures.available_tools.fake_news ? (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setIsFakeNewsOpen(true)}
            >
              <span className="inline-flex items-center gap-2">
                <Megaphone size={12} />
                Send Fake News
              </span>
            </Button>
          ) : null}
        </div>
      </div>
      {!roomFeatures.has_npc_orders ? (
        <div className="mt-2 rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          NPC orders are disabled for this room. Use priced limit orders to post bids/asks and trade with other players.
        </div>
      ) : null}

      <Popup
        isOpen={isPlayersOpen}
        onClose={() => setIsPlayersOpen(false)}
        title={
          <div className="space-y-1">
            <div>Room Players</div>
            <div className={`text-xs font-normal ${textSecondary}`}>
              Room {roomCode ?? ""}
            </div>
          </div>
        }
        panelClassName="max-w-lg"
      >
        <div className="space-y-3">
          <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 px-3 py-2 flex items-center justify-between gap-2">
            <div className="text-xs text-slate-700 dark:text-slate-300">
              Active players in this room
            </div>
            <Button variant="outline" size="sm" className="text-xs" onClick={onRefreshPlayers}>
              Refresh Players
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {sortedPlayers.map((player) => (
              <div
                key={player}
                className="rounded-full border border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs text-slate-800 dark:text-slate-100"
              >
                {player}
                {player === currentUserId ? " (you)" : ""}
              </div>
            ))}
          </div>

          <div className={`text-xs ${textSecondary}`}>
            Trading controls stay in the right panel. Multiplayer actions are in these popups.
          </div>
        </div>
      </Popup>

      <Popup
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        title="Private Chat"
        panelClassName="max-w-lg"
      >
        <div className="space-y-2">
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

          <div className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/40 h-64 overflow-y-auto p-2 space-y-1">
            {conversation.length === 0 ? (
              <div className={`text-xs ${textSecondary}`}>
                Select a player and send a private message.
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
            rows={3}
            placeholder="Type a private message"
            value={chatDraft}
            onChange={(event) => setChatDraft(event.target.value)}
          />

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleSendPrivateMessage}
              disabled={!selectedRecipientId || chatDraft.trim().length === 0}
            >
              Send Message
            </Button>
          </div>
        </div>
      </Popup>

      <Popup
        isOpen={isFakeNewsOpen}
        onClose={() => setIsFakeNewsOpen(false)}
        title="Send Fake News"
        panelClassName="max-w-lg"
      >
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              className={inputClass}
              value={selectedTicker}
              onChange={(event) => setSelectedTicker(event.target.value)}
              disabled={availableTickers.length === 0}
            >
              {availableTickers.map((ticker) => (
                <option key={ticker} value={ticker}>
                  {ticker}
                </option>
              ))}
            </select>

            <input
              className={inputClass}
              type="number"
              min={1}
              value={fakeNewsDelay}
              onChange={(event) => setFakeNewsDelay(event.target.value)}
              placeholder="Delay (ticks)"
            />
          </div>

          <textarea
            className={inputClass}
            rows={4}
            placeholder="Compose fake news"
            value={fakeNewsDraft}
            onChange={(event) => setFakeNewsDraft(event.target.value)}
          />

          <div className="flex items-center justify-between gap-2">
            <div className={`text-xs ${textSecondary}`}>
              Message is sent to backend with the selected ticker and delay.
            </div>
            <Button
              size="sm"
              onClick={handleSendFakeNews}
              disabled={
                !selectedTicker ||
                fakeNewsDraft.trim().length === 0 ||
                fakeNewsDelay.trim().length === 0
              }
            >
              Send
            </Button>
          </div>
        </div>
      </Popup>
    </>
  );
}
