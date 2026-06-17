// PR 6: End-to-end coverage for the Firebase OIDC auth flow.
//
// Runs against the Firebase Auth emulator (port 9099). The Google popup OAuth
// flow can't be driven from inside Cypress, so we sign in via email+password
// against the emulator instead. The app-side bridge in services/firebase.ts
// exposes `__cypressSignInWithPassword` on window for the helper command.
//
// To run locally:
//   1. `npx firebase emulators:start --only auth` (in repo root)
//   2. `docker compose up` (backend + db) — or backend alone
//   3. `cd frontend && npm run dev`
//   4. `npx cypress run --spec tests/cypress/e2e/auth.cy.js`

const PASSWORD = 'CypressTest123!';

describe('Auth flow', () => {
  describe('first-time sign-in', () => {
    const email = `firstrun-${Date.now()}@example.com`;
    const username = `firstrun-${Date.now()}`;

    beforeEach(() => {
      // Fresh user every run; no app-side row yet → backend 404s on /user/me.
      cy.intercept('GET', '**/user/me', { statusCode: 404, body: { detail: 'User not onboarded' } }).as('getMe404');
    });

    it('routes to /setup-username when the Firebase user has no app row', () => {
      cy.signInViaEmulator(email, PASSWORD);
      cy.wait('@getMe404');
      cy.location('pathname').should('eq', '/setup-username');
      cy.contains('Choose a username').should('be.visible');
    });

    it('creates the user and lands on /dashboard when username is submitted', () => {
      cy.signInViaEmulator(email, PASSWORD);
      cy.wait('@getMe404');
      cy.location('pathname').should('eq', '/setup-username');

      // POST /user/ creates the user row server-side; reroute GET /user/me to
      // return the new row so refetchAppUser sees it.
      cy.intercept('POST', '**/user/', (req) => {
        req.reply({
          statusCode: 200,
          body: {
            user_id: 'firebase-uid-stub',
            user_name: req.body.user_name,
            user_email: email,
          },
        });
      }).as('createUser');
      cy.intercept('GET', '**/user/me', {
        statusCode: 200,
        body: {
          user_id: 'firebase-uid-stub',
          user_name: username,
          user_email: email,
        },
      }).as('getMeReady');

      cy.get('input[placeholder="e.g. swift-otter"]').type(username);
      cy.contains('button', 'Continue').click();
      cy.wait('@createUser');

      cy.location('pathname').should('eq', '/dashboard');
    });

    it('surfaces a friendly error when the username is taken (409)', () => {
      cy.signInViaEmulator(email, PASSWORD);
      cy.wait('@getMe404');

      cy.intercept('POST', '**/user/', {
        statusCode: 409,
        body: { detail: 'Username already taken' },
      }).as('createUser409');

      cy.get('input[placeholder="e.g. swift-otter"]').type('taken-name');
      cy.contains('button', 'Continue').click();
      cy.wait('@createUser409');

      cy.contains('That username is taken').should('be.visible');
      // We stay on the setup screen; the field is still editable for a retry.
      cy.location('pathname').should('eq', '/setup-username');
    });
  });

  describe('returning user sign-in', () => {
    it('skips /setup-username and lands on /dashboard', () => {
      const email = `returning-${Date.now()}@example.com`;
      cy.intercept('GET', '**/user/me', {
        statusCode: 200,
        body: {
          user_id: 'firebase-uid-stub',
          user_name: 'Returning User',
          user_email: email,
        },
      }).as('getMeOk');

      cy.signInViaEmulator(email, PASSWORD);
      cy.wait('@getMeOk');
      cy.location('pathname').should('eq', '/dashboard');
      cy.contains('Welcome back').should('be.visible');
    });
  });

  describe('puzzle mode unlock gating (PR 5)', () => {
    const email = 'e2e-puzzle@example.com';
    const username = 'PuzzleUser';

    beforeEach(() => {
      cy.intercept('GET', '**/user/me', {
        statusCode: 200,
        body: { user_id: 'puzzle-uid', user_name: username, user_email: email },
      }).as('getMe');
    });

    it('shows puzzle levels as locked before module-1.4 is completed', () => {
      cy.intercept('GET', '**/game/puzzle/me', {
        statusCode: 200,
        body: [
          { puzzle_id: 'puzzle-1.1', level_id: 'puzzle-1.1', title: 'First Puzzle', level_order: 1, available: false, attempted: false, progress: {} },
          { puzzle_id: 'puzzle-1.2', level_id: 'puzzle-1.2', title: 'Second Puzzle', level_order: 2, available: false, attempted: false, progress: {} },
        ],
      }).as('getPuzzles');

      cy.signInViaEmulator(email, PASSWORD);
      cy.visit('/puzzleMode');
      cy.wait('@getPuzzles');

      // No puzzle cards should report as playable — the locked state may be a
      // disabled button or a "Locked" label depending on PuzzleLevelCard's
      // rendering. Smoke check: no "Start" / "Play" CTA enabled.
      cy.contains('Puzzle Mode').should('be.visible');
      cy.get('button:not([disabled])').contains(/^(Start|Play|Resume)/i).should('not.exist');
    });

    it('shows puzzle levels as unlocked after module-1.4 is completed', () => {
      cy.intercept('GET', '**/game/puzzle/me', {
        statusCode: 200,
        body: [
          { puzzle_id: 'puzzle-1.1', level_id: 'puzzle-1.1', title: 'First Puzzle', level_order: 1, available: true, attempted: false, progress: {} },
          { puzzle_id: 'puzzle-1.2', level_id: 'puzzle-1.2', title: 'Second Puzzle', level_order: 2, available: true, attempted: false, progress: {} },
        ],
      }).as('getPuzzles');

      cy.signInViaEmulator(email, PASSWORD);
      cy.visit('/puzzleMode');
      cy.wait('@getPuzzles');

      cy.contains('First Puzzle').should('be.visible');
      cy.contains('Second Puzzle').should('be.visible');
    });
  });

  describe('URL-bypass guard on locked adventure levels', () => {
    const email = 'e2e-gate@example.com';
    const username = 'GateUser';

    const stubMeOnboarded = () => {
      cy.intercept('GET', '**/user/me', {
        statusCode: 200,
        body: { user_id: 'gate-uid', user_name: username, user_email: email },
      }).as('getMe');
    };

    // Helper: respond to /game/me with a single module containing one
    // unlocked level (module-1.1) and three locked ones (module-1.2..4).
    const stubAdventureWithOnlyFirstLevelUnlocked = () => {
      cy.intercept('GET', '**/game/me', {
        statusCode: 200,
        body: {
          1: {
            levels: [
              { tutorial_id: 'module-1.1', level_id: 'module-1.1', title: 'L1', level_order: 1, module: 1, attempted: true, completed: false, available: true },
              { tutorial_id: 'module-1.2', level_id: 'module-1.2', title: 'L2', level_order: 2, module: 1, attempted: false, completed: false, available: false },
              { tutorial_id: 'module-1.3', level_id: 'module-1.3', title: 'L3', level_order: 3, module: 1, attempted: false, completed: false, available: false },
              { tutorial_id: 'module-1.4', level_id: 'module-1.4', title: 'L4', level_order: 4, module: 1, attempted: false, completed: false, available: false },
            ],
            'pre-quiz': { quiz_id: null, available: false, completed: null, best_score: null, module: 1 },
            'post-quiz': { quiz_id: null, available: false, completed: null, best_score: null, module: 1 },
          },
        },
      }).as('getLevels');
    };

    it('redirects /adventureMode/1/4 to /adventureMode when level 4 is locked', () => {
      stubMeOnboarded();
      stubAdventureWithOnlyFirstLevelUnlocked();
      cy.signInViaEmulator(email, PASSWORD);

      // The URL-bypass attempt: type a locked level into the address bar.
      cy.visit('/adventureMode/1/4');
      cy.wait('@getLevels');

      // Frontend gate must redirect away before the trading WS opens.
      cy.location('pathname').should('eq', '/adventureMode');
    });

    it('allows /adventureMode/1/1 (the unlocked level) to render', () => {
      stubMeOnboarded();
      stubAdventureWithOnlyFirstLevelUnlocked();
      cy.signInViaEmulator(email, PASSWORD);

      cy.visit('/adventureMode/1/1');
      cy.wait('@getLevels');

      // We don't drive the game engine here — the WS connection will
      // attempt to open and may fail (no real backend in CI). The
      // assertion is just that the gate didn't bounce us.
      cy.location('pathname').should('eq', '/adventureMode/1/1');
    });
  });
});
