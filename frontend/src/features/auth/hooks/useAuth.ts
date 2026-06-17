import { useCallback, useEffect, useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';

import {
  auth,
  signInWithGoogle as fbSignInWithGoogle,
  signOut as fbSignOut,
} from '../../../services/firebase';
import { getCurrentUser } from '../services/profileApi';
import type { AuthState, User } from '../types/authTypes';

interface UseAuthReturn extends AuthState {
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refetchAppUser: () => Promise<void>;
}

// Pull the app-side row for a Firebase user. Returns null when the backend
// answers 404 (signal that the user still needs to pick a username).
async function loadAppUser(): Promise<User | null> {
  try {
    const profile = await getCurrentUser();
    return {
      id: profile.user_id,
      username: profile.user_name,
      email: profile.user_email,
    };
  } catch (err) {
    const status = (err as { status?: number })?.status;
    if (status === 404) return null;
    throw err;
  }
}

export function useAuth(): UseAuthReturn {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  // Only true after a confirmed 404 from /user/me — never on transient
  // backend errors, so we don't route mid-session users to /setup-username
  // when the backend hiccups.
  const [appUserNotFound, setAppUserNotFound] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetchAppUser = useCallback(async () => {
    if (!auth.currentUser) {
      setAppUser(null);
      setAppUserNotFound(false);
      return;
    }
    const user = await loadAppUser();
    setAppUser(user);
    setAppUserNotFound(user === null);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (!fbUser) {
        setAppUser(null);
        setAppUserNotFound(false);
        setIsLoading(false);
        return;
      }
      try {
        const user = await loadAppUser();
        setAppUser(user);
        setAppUserNotFound(user === null);
      } catch (err) {
        // Network / unexpected backend error — leave appUser null but do NOT
        // flag the user as needing onboarding; we genuinely don't know yet.
        console.error('[auth] failed to load /user/me', err);
        setAppUser(null);
        setAppUserNotFound(false);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      await fbSignInWithGoogle();
      // onAuthStateChanged will fire and clear isLoading.
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    await fbSignOut();
    // onAuthStateChanged → fbUser=null path clears the rest.
  }, []);

  return {
    user: appUser,
    isAuthenticated: !!appUser,
    isLoading,
    needsUsername: !!firebaseUser && appUserNotFound && !isLoading,
    signInWithGoogle,
    logout,
    refetchAppUser,
  };
}
