import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginForm } from '../features/auth/components/LoginForm';
import { useAuthContext } from '../providers/AuthProvider';
import { LevelSelectPage } from '../features/levels/components/LevelSelectPage';
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute';
import { AppLayout } from '../features/auth/components/AppLayout';
import { UsernameSetup } from '../features/auth/components/UsernameSetup';
import { UserProfile } from '../features/auth/components/profile/UserProfile';
import { DashboardPage } from '../features/dashboard/components/DashboardPage';
import { PuzzleLevelSelectPage } from '../features/puzzle/components/PuzzleLevelSelectPage';
import { QuizProvider } from '../features/quiz/context/QuizContext';
import { QuizPage } from '../features/quiz/components/QuizPage';
import { MultiplayerPage } from '../features/multiplayer/pages/MultiplayerPage';
import { MultiplayerSessionProvider } from '../features/multiplayer/context/MultiplayerSessionProvider';
import { SinglePlayerTradingPage } from '../features/trading/pages/SinglePlayerTradingPage';
import { MultiplayerTradingPage } from '../features/trading/pages/MultiplayerTradingPage';

export function AppRoutes() {
  const { isAuthenticated, needsUsername, isLoading } = useAuthContext();
  const defaultRoute = '/dashboard';

  // /login: hide from already-authenticated users; if onboarding incomplete,
  //         route them to /setup-username instead of the dashboard.
  const loginRedirect = isAuthenticated
    ? defaultRoute
    : needsUsername
      ? '/setup-username'
      : null;

  // /setup-username: only meaningful for needsUsername users. Already-onboarded
  // users go to the dashboard; signed-out users go to login.
  const setupRedirect = isAuthenticated
    ? defaultRoute
    : !needsUsername && !isLoading
      ? '/login'
      : null;

  return (
    <Routes>
      <Route
        path="/login"
        element={loginRedirect ? <Navigate to={loginRedirect} replace /> : <LoginForm />}
      />

      <Route
        path="/setup-username"
        element={setupRedirect ? <Navigate to={setupRedirect} replace /> : <UsernameSetup />}
      />

      <Route element={<ProtectedRoute />}>
        <Route element={<QuizProvider><AppLayout /></QuizProvider>}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/adventureMode" element={<LevelSelectPage />} />
          <Route path="/adventureMode/:module/:level" element={<SinglePlayerTradingPage />} />
          <Route path="/adventureMode/quiz/:module/:phase" element={<QuizPage />} />
          <Route path="/puzzleMode" element={<PuzzleLevelSelectPage />} />
          <Route path="/puzzleMode/:level" element={<SinglePlayerTradingPage />} />
          <Route path="/multiplayer" element={<MultiplayerSessionProvider />}>
            <Route index element={<MultiplayerPage />} />
            <Route path="trading/:roomCode" element={<MultiplayerTradingPage />} />
          </Route>
          <Route path="/profile" element={<UserProfile />} />
          <Route path="*" element={<Navigate to={defaultRoute} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
