import { useCallback, type RefObject } from "react";
import { buildGameEndPayload } from "../services/tradingPayloadMappers";
import type {
  GameEndRespPayload,
  MissionDefinition,
} from "../types/tradingTypes";

interface UseGameEndPayloadParams {
  missionsRef: RefObject<MissionDefinition[]>;
  passingMissionIdsRef: RefObject<Set<string>>;
  currentCashRef: RefObject<number | null>;
  reservedCashRef: RefObject<number>;
}

export function useGameEndPayload({
  missionsRef,
  passingMissionIdsRef,
  currentCashRef,
  reservedCashRef,
}: UseGameEndPayloadParams) {
  return useCallback(
    (rawPayload: unknown, fallbackGameState?: unknown): GameEndRespPayload | null =>
      buildGameEndPayload({
        rawPayload,
        fallbackGameState,
        knownMissions: missionsRef.current ?? [],
        passingMissionIds: passingMissionIdsRef.current ?? new Set<string>(),
        currentCash: currentCashRef.current ?? null,
        reservedCash: reservedCashRef.current ?? 0,
      }),
    [missionsRef, passingMissionIdsRef, currentCashRef, reservedCashRef]
  );
}
