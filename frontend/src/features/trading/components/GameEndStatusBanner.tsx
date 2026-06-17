import { CheckCircle2, XCircle } from "lucide-react";
import { THEME_CONFIG } from "../../../shared/ui/config/themeConfig";

interface GameEndStatusBannerProps {
  passed: boolean;
  explanation: string;
}

export function GameEndStatusBanner({ passed, explanation }: GameEndStatusBannerProps) {
  const textSecondary = THEME_CONFIG.colors.text.secondary;
  const successText = THEME_CONFIG.colors.text.success;
  const dangerText = THEME_CONFIG.colors.text.danger;
  const cardBorder = THEME_CONFIG.colors.border.default;

  return (
    <div className={`rounded-lg border ${cardBorder} p-3 ${passed ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
      <div className={`flex items-center justify-center gap-2 text-lg font-bold text-center ${passed ? successText : dangerText}`}>
        {passed ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
        {passed ? "PASS: Level Completed" : "FAIL: Level Not Completed"}
      </div>
      <div className={`text-sm ${textSecondary} mt-1 text-center`}>{explanation}</div>
    </div>
  );
}
