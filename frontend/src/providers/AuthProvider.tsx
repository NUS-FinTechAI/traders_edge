import { createContext, useContext, type ReactNode } from 'react';

import { useAuth } from '../features/auth/hooks/useAuth';
import type { AuthState } from '../features/auth/types/authTypes';

interface AuthContextType extends AuthState {
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refetchAppUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
