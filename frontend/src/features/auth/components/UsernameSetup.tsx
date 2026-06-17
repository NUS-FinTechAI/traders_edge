import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthContext } from '../../../providers/AuthProvider';
import { Button } from '../../../shared/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../shared/ui/Card';
import { TextField } from '../../../shared/ui/TextField';
import { THEME_CONFIG } from '../../../shared/ui/config/themeConfig';
import { createUser } from '../services/userApi';

export function UsernameSetup() {
  const [userName, setUserName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { refetchAppUser, logout } = useAuthContext();
  const navigate = useNavigate();
  const canSubmit = userName.trim().length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);
    try {
      await createUser({ user_name: userName.trim() });
      // Pull the freshly-created app user into context, then route to dashboard.
      // ProtectedRoute will allow it now that `needsUsername` is false.
      await refetchAppUser();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const status = (err as { status?: number })?.status;
      const message =
        status === 409
          ? 'That username is taken. Pick another.'
          : err instanceof Error
            ? err.message
            : 'Could not create your account';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const backgroundClass = THEME_CONFIG.colors.background.primary;
  const textDanger = THEME_CONFIG.colors.text.danger;

  return (
    <div className={`min-h-screen w-full flex items-center justify-center ${backgroundClass}`}>
      <Card className="w-80 backdrop-blur-md shadow-xl" elevated>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Choose a username</CardTitle>
          <CardDescription className="mt-1">
            This is your public display name. You can change it later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error ? <div className={`text-center text-sm ${textDanger}`}>{error}</div> : null}
            <TextField
              label="Username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. swift-otter"
              size="sm"
              className="w-full"
              autoFocus
              maxLength={40}
            />
            <Button type="submit" variant="success" size="sm" className="w-full mt-1" disabled={!canSubmit}>
              {submitting ? 'Creating…' : 'Continue'}
            </Button>
            <Button
              type="button"
              variant="text"
              size="sm"
              className="w-full mt-1"
              onClick={() => logout()}
              disabled={submitting}
            >
              Use a different Google account
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
