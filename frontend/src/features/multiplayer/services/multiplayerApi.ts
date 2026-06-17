import { apiClient } from "../../../services/apiClient";
import type {
  MultiplayerRoomFeatures,
  MultiplayerToolToggles,
} from "../types/multiplayerTypes";

export interface CreateMultiplayerRoomRequest {
  has_npc_orders?: boolean;
  available_tools?: Partial<MultiplayerToolToggles>;
}

export interface CreateMultiplayerRoomResponse {
  room_code: string;
  room_features: MultiplayerRoomFeatures;
}

export async function createMultiplayerRoom(
  payload: CreateMultiplayerRoomRequest = {}
): Promise<CreateMultiplayerRoomResponse> {
  return apiClient.postJson<CreateMultiplayerRoomResponse>(
    "/game/multiplayer/rooms",
    payload
  );
}
