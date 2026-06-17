import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { useAuthContext } from "../../../providers/AuthProvider";
import { fetchLevels } from "../../levels/services/levelsApi";
import { TradingPage } from "../components/TradingPage";
import { useLevelAccessGate } from "../hooks/useLevelAccessGate";
import { useSinglePlayerGame } from "../hooks/useSinglePlayerGame";

export function SinglePlayerTradingPage() {
  const { module, level } = useParams();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const navigationState = (location?.state ?? {}) as {
    newGame?: boolean;
    levelId?: string;
    retryNonce?: number;
  };
  const { user } = useAuthContext();
  const isPuzzleMode = !module;
  const moduleNumber = Number(module);
  const levelNumber = Number(level);

  // URL-bypass guard: a user who types `/adventureMode/1/4` without
  // having unlocked module-1.4 should be bounced before we open a WS
  // and pay for engine warmup. The backend rejects identically with
  // close code 4403 — this is the UX layer.
  const gate = useLevelAccessGate(
    isPuzzleMode
      ? {
          kind: "puzzle",
          puzzleId: navigationState?.levelId
            || (level && level.startsWith("puzzle-") ? level : `puzzle-${level}`),
        }
      : { kind: "tutorial", module: moduleNumber, level: levelNumber },
  );
  if (gate === "loading") return null;
  if (gate === "denied") {
    return (
      <Navigate to={isPuzzleMode ? "/puzzleMode" : "/adventureMode"} replace />
    );
  }

  return (
    <TradingPage
      useGameSession={useSinglePlayerGame}
      moduleParam={module}
      levelParam={level}
      levelIdOverride={navigationState?.levelId}
      sessionToken={navigationState?.retryNonce ?? location.key}
      userId={user?.id}
      isResuming={navigationState?.newGame !== true}
      onBackToLevelSelect={() =>
        navigate(isPuzzleMode ? "/puzzleMode" : "/adventureMode")
      }
      onProceed={() => {
        if (isPuzzleMode) {
          navigate("/puzzleMode");
          return;
        }
        void (async () => {
          if (!Number.isFinite(moduleNumber) || !Number.isFinite(levelNumber) || !user?.id) {
            navigate("/adventureMode");
            return;
          }

          try {
            const levelsByModule = await fetchLevels();
            const moduleProgress = levelsByModule[String(moduleNumber)];
            const nextLevelOrder = (moduleProgress?.levels ?? [])
              .map((levelEntry) => Number(levelEntry.level_order))
              .filter((order) => Number.isFinite(order) && order > levelNumber)
              .sort((a, b) => a - b)[0];

            if (!nextLevelOrder) {
              navigate("/adventureMode");
              return;
            }

            navigate(`/adventureMode/${moduleNumber}/${nextLevelOrder}`);
          } catch {
            navigate("/adventureMode");
          }
        })();
      }}
      onRetry={() => {
        if (isPuzzleMode) {
          navigate(`/puzzleMode/${level}`, {
            replace: true,
            state: {
              newGame: true,
              levelId: navigationState?.levelId,
              retryNonce: Date.now(),
            },
          });
          return;
        }
        navigate(`/adventureMode/${module}/${level}`, {
          replace: true,
          state: { newGame: true, retryNonce: Date.now() },
        });
      }}
      enableTutorials
    />
  );
}
