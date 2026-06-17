import { useEffect, useState } from "react";
import { Card, CardContent } from "../../../shared/ui/Card";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";
import type { ModuleProgress, TutorialLevel } from "../../levels/types/levelTypes";
import { useAuthContext } from "../../../providers/AuthProvider";
import { fetchLevels } from "../services/levelsApi";
import { AdventureLevelCard } from "./AdventureLevelCard";
// import { useNavigate } from "react-router-dom";
import { LevelDetailPopup } from "./LevelDetailPopup";
import { QuizAccessCard } from "../../quiz/components/QuizAccessCard";
import { useNavigate } from "react-router-dom";

const MODULE_TITLES: Record<number, string> = {
  1: "The basics of trading",
  2: "Basic strategies",
  3: "Other ways to trade",
  4: "The macroeconomy and uncertainty",
  5: "Portfolio construction",
};

export function LevelSelectPage() {
  const backgroundClass = THEME_CONFIG.colors.background.primary;
  const textPrimary = THEME_CONFIG.colors.text.primary;
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const { user } = useAuthContext();
  const [selected, setSelected] = useState<TutorialLevel | null>(null);
  const navigate = useNavigate();

  const [modules, setModules] = useState<Record<number, ModuleProgress> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches module and level overview
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await fetchLevels();
        if (!isMounted) return;
        const parsed = Object.entries(data).reduce((acc, [key, value]) => {
          const moduleKey = Number(key);
          if (Number.isFinite(moduleKey)) {
            acc[moduleKey] = value;
          }
          return acc;
        }, {} as Record<number, ModuleProgress>);
        setModules(parsed);
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Failed to load levels');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const sortedModuleKeys = Object.keys(modules ?? {}).map(Number).sort((a,b)=>a-b);

  return (
    <div className={`h-full w-full ${backgroundClass} p-6 overflow-y-auto`}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className={`text-2xl sm:text-3xl font-semibold ${textPrimary}`}>Adventure Mode</div>
        {isLoading ? (
          <div className={`${textSecondary}`}>Loading levels...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          sortedModuleKeys.map((moduleKey) => {
            const moduleData = modules?.[moduleKey];
            if (!moduleData) return null;
            const moduleLevels = moduleData.levels.slice().sort((a,b)=>a.level_order-b.level_order);
            const moduleComplete = moduleLevels.length > 0 && moduleLevels.every((lvl) => lvl.completed);
            const preQuiz = moduleData["pre-quiz"];
            const postQuiz = moduleData["post-quiz"];
            const preScore = Number.isFinite(preQuiz?.best_score) ? preQuiz.best_score : null;
            const postScore = Number.isFinite(postQuiz?.best_score) ? postQuiz.best_score : null;
            const hasPreQuiz = Boolean(preQuiz?.quiz_id);
            const hasPostQuiz = Boolean(postQuiz?.quiz_id);
            const postQuizLocked = !postQuiz?.available || !moduleComplete;
            const moduleTitle = MODULE_TITLES[moduleKey];

            return (
              <div key={`module-${moduleKey}`} className="space-y-3">
                <div className={`text-xl font-semibold ${textPrimary}`}>
                  {moduleTitle ? `Module ${moduleKey}: ${moduleTitle}` : `Module ${moduleKey}`}
                </div>
                {hasPreQuiz ? (
                  <QuizAccessCard
                    title={`Module ${moduleKey} Entry Quiz`}
                    description={preQuiz?.available ? "Take the quick pre-module quiz." : "Complete the previous module's exit quiz to unlock this entry quiz."}
                    locked={!preQuiz?.available}
                    scoreLabel={preScore !== null && preQuiz?.available ? `Your score: ${preScore}` : undefined}
                    onClick={() => navigate(`/adventureMode/quiz/${moduleKey}/pre?quiz_id=${preQuiz.quiz_id}`)}
                  />
                ) : null}
                <Card elevated>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {moduleLevels.map((lvl) => (
                        <AdventureLevelCard
                          key={lvl.tutorial_id}
                          level={lvl}
                          onPlay={(l) => setSelected(l)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {hasPostQuiz ? (
                  <QuizAccessCard
                    title={`Module ${moduleKey} Exit Quiz`}
                    description={postQuiz?.available ? "Complete the post-module quiz." : "Finish all module levels after passing the entry quiz to unlock this exit quiz."}
                    locked={postQuizLocked}
                    scoreLabel={postScore !== null && !postQuizLocked ? `Your score: ${postScore}` : undefined}
                    onClick={() => navigate(`/adventureMode/quiz/${moduleKey}/post?quiz_id=${postQuiz.quiz_id}`)}
                  />
                ) : null}
              </div>
            );
          })
        )}
      </div>
      <LevelDetailPopup
        level={selected}
        currentUserId={(user?.id ?? '') as string}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}


