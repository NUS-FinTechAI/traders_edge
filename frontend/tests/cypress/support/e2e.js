// Cypress global setup. Adds emulator-backed auth helpers used by every
// spec. The Firebase Auth emulator runs at localhost:9099; we sign in via
// email+password (the emulator accepts arbitrary credentials we pre-create
// over its REST API) since the production app's Google-popup OAuth flow
// can't be driven from inside Cypress.

const EMULATOR_HOST = Cypress.env('FIREBASE_AUTH_EMULATOR_HOST') || 'http://127.0.0.1:9099';
// The Auth emulator ignores the `key` query param; any non-empty string works.
const FAKE_API_KEY = 'cypress-fake-api-key';

const emulatorEndpoint = (action) =>
  `${EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:${action}?key=${FAKE_API_KEY}`;

// Create a user on the emulator (idempotent: returns 200 the first time, 400
// `EMAIL_EXISTS` afterward — we treat both as success).
Cypress.Commands.add('ensureEmulatorUser', (email, password) => {
  return cy
    .request({
      method: 'POST',
      url: emulatorEndpoint('signUp'),
      body: { email, password, returnSecureToken: true },
      failOnStatusCode: false,
    })
    .then((resp) => {
      if (resp.status === 200) return resp.body;
      const code = resp.body?.error?.message;
      if (code && code.startsWith('EMAIL_EXISTS')) {
        return cy
          .request({
            method: 'POST',
            url: emulatorEndpoint('signInWithPassword'),
            body: { email, password, returnSecureToken: true },
          })
          .then((signInResp) => signInResp.body);
      }
      throw new Error(`Auth emulator signUp failed: ${code || JSON.stringify(resp.body)}`);
    });
});

// Visit the app and sign in via the bridge `__cypressSignInWithPassword`
// attached to `window` by services/firebase.ts in non-prod builds. After
// resolution, AuthProvider's `onAuthStateChanged` listener fires and the
// rest of the app sees the user as signed in.
Cypress.Commands.add('signInViaEmulator', (email, password, options = {}) => {
  const startPath = options.startPath || '/login';
  cy.ensureEmulatorUser(email, password);
  cy.visit(startPath);
  cy.window().its('__cypressSignInWithPassword').should('be.a', 'function');
  cy.window().then((win) => win.__cypressSignInWithPassword(email, password));
});

// Wipe all users from the emulator (used between specs that want fresh
// "first-time sign-in" semantics). Hits the emulator-only admin endpoint.
Cypress.Commands.add('resetEmulatorAuth', () => {
  const project = Cypress.env('FIREBASE_PROJECT_ID') || 'demo-traders-edge';
  return cy.request({
    method: 'DELETE',
    url: `${EMULATOR_HOST}/emulator/v1/projects/${encodeURIComponent(project)}/accounts`,
    failOnStatusCode: false,
  });
});
