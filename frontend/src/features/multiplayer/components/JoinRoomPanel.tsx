import { useMemo, useState } from "react";
import { DoorOpen } from "lucide-react";

import { Button } from "../../../shared/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../shared/ui/Card";
import { TextField } from "../../../shared/ui/TextField";

interface JoinRoomPanelProps {
  disabled?: boolean;
  onJoinRoom: (roomCode: string) => void;
}

const sanitizeRoomCode = (value: string): string =>
  value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 8);

export function JoinRoomPanel({
  disabled = false,
  onJoinRoom,
}: JoinRoomPanelProps) {
  const [roomCode, setRoomCode] = useState("");
  const normalizedRoomCode = useMemo(() => sanitizeRoomCode(roomCode), [roomCode]);
  const isValid = normalizedRoomCode.length > 0;

  return (
    <Card elevated>
      <CardHeader>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-7 h-7 rounded-md bg-blue-100 dark:bg-blue-900/40 inline-flex items-center justify-center">
            <DoorOpen size={16} className="text-blue-600 dark:text-blue-300" />
          </span>
          <CardTitle>Join Room</CardTitle>
        </div>
        <CardDescription className="pb-1">
          Enter a room code to join an existing lobby and wait for the host to start.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <TextField
          label="Room Code"
          value={normalizedRoomCode}
          onChange={(event) => setRoomCode(event.target.value)}
          placeholder="e.g. 482931"
          autoComplete="off"
          fullWidth
          helperText={isValid ? "Looks good." : "Room code should be at least 1 character."}
        />
        <Button
          onClick={() => onJoinRoom(normalizedRoomCode)}
          disabled={disabled || !isValid}
        >
          Join Room
        </Button>
      </CardContent>
    </Card>
  );
}
