import { useEffect, useState } from "react";

import { fetchLevels } from "../../levels/services/levelsApi";
import { fetchPuzzleLevels } from "../../puzzle/services/puzzleLevelSelectApi";

/**
 * Frontend pre-check for single-player level access. Mirrors (and is
 * checked against) the backend gate in
 * `is_level_available_for_user`. The server is the security boundary;
 * this hook is the UX layer that avoids a half-mounted trading page
 * that immediately closes when the WS rejects with code 4403.
 *
 * Three kinds, three lookups:
 * - tutorial: GET /game/me  → modules[module].levels[level_order].available
 * - puzzle:   GET /game/puzzle/me → list.find(p => puzzle_id === ...).available
 *   (Backend already gates this globally on module-1.4 completion — see PR 5.)
 * - quiz:     GET /game/me  → modules[module][pre|post-quiz].available
 *
 * Errors during the lookup (network failure, 401 etc.) resolve to
 * `"denied"` so the user gets redirected away rather than stuck on a
 * broken page. We deliberately do not differentiate "denied because
 * fetch failed" from "denied because locked" — the user can retry the
 * top-level navigation either way.
 */
export type LevelAccessKind =
  | { kind: "tutorial"; module: number; level: number }
  | { kind: "puzzle"; puzzleId: string }
  | { kind: "quiz"; module: number; phase: "pre" | "post" };

export type GateState = "loading" | "allowed" | "denied";

export function useLevelAccessGate(target: LevelAccessKind): GateState {
  const [state, setState] = useState<GateState>("loading");

  // Stringify the target so a stable dep keeps useEffect from re-running
  // when the caller passes a new object identity each render.
  const depKey = JSON.stringify(target);

  useEffect(() => {
    let cancelled = false;
    const check = async (): Promise<GateState> => {
      try {
        if (target.kind === "puzzle") {
          const puzzles = await fetchPuzzleLevels();
          const match = puzzles.find(
            (p) => p.puzzle_id === target.puzzleId || p.level_id === target.puzzleId,
          );
          return match?.available ? "allowed" : "denied";
        }

        // Tutorial + quiz both come from /game/me.
        const modules = await fetchLevels();
        const moduleEntry = modules[String(target.module)];
        if (!moduleEntry) return "denied";

        if (target.kind === "tutorial") {
          const lvl = moduleEntry.levels.find(
            (l) => Number(l.level_order) === target.level,
          );
          return lvl?.available ? "allowed" : "denied";
        }

        // quiz
        const quizKey = target.phase === "pre" ? "pre-quiz" : "post-quiz";
        return moduleEntry[quizKey]?.available ? "allowed" : "denied";
      } catch {
        return "denied";
      }
    };

    setState("loading");
    void check().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depKey]);

  return state;
}
