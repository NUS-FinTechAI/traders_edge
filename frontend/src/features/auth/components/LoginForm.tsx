import { useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../shared/ui/Card';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { useAuthContext } from '../../../providers/AuthProvider';

export function LoginForm() {
  const { signInWithGoogle, isLoading } = useAuthContext();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleClick = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await signInWithGoogle();
      // AuthProvider's onAuthStateChanged + ProtectedRoute redirect handle
      // navigation from here (→ /setup-username or → the original route).
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const backgroundClass = THEME_CONFIG.colors.background.primary;
  const textDanger = THEME_CONFIG.colors.text.danger;
  const textMuted = THEME_CONFIG.colors.text.muted;
  const busy = submitting || isLoading;

  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${backgroundClass}`}>
      <Card className="w-80 backdrop-blur-md shadow-xl" elevated>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Trader's Edge</CardTitle>
          <CardDescription className="mt-1">Sign in to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3">
            {error ? <div className={`text-center text-sm ${textDanger}`}>{error}</div> : null}
            <Button
              type="button"
              variant="success"
              size="sm"
              className="w-full"
              onClick={handleClick}
              disabled={busy}
            >
              {busy ? 'Signing in…' : 'Continue with Google'}
            </Button>
            <p className={`text-center text-xs mt-2 ${textMuted}`}>
              First time here? We'll ask you to pick a username after sign-in.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
