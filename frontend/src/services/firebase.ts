import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);
if (missing.length > 0) {
  // Surface loudly in dev — a missing key produces opaque Firebase errors at runtime.
  console.error(
    `[firebase] missing config keys: ${missing.join(', ')}. ` +
      `Set them in frontend/.env.local (see .env.example).`,
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

const emulatorHost = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_HOST;
if (emulatorHost) {
  connectAuthEmulator(auth, emulatorHost, { disableWarnings: true });
}

const provider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  return signInWithPopup(auth, provider);
}

export async function signOut() {
  return fbSignOut(auth);
}

// Cypress sign-in bridge. The Google popup OAuth flow can't be driven from
// Cypress, so E2E tests against the Firebase Auth emulator sign in via
// email+password instead (the emulator accepts any credentials it has been
// pre-loaded with). This bridge is intentionally only attached in non-prod
// bundles — Vite tree-shakes the whole `if` block out of production builds.
if (import.meta.env.MODE !== 'production' && typeof window !== 'undefined') {
  (window as Window & {
    __cypressSignInWithPassword?: (email: string, password: string) => Promise<unknown>;
  }).__cypressSignInWithPassword = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password);
}
