import { useMultiplayerSession } from "../context/MultiplayerSessionProvider";

export function useMultiplayerSocket() {
  return useMultiplayerSession();
}
