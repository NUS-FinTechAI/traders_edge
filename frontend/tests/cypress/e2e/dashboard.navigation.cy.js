const E2E_EMAIL = 'e2e-dashboard@example.com';
const E2E_PASSWORD = 'CypressTest123!';
const E2E_UID = 'e2e-user';
const E2E_USERNAME = 'E2E User';

// Stub `GET /user/me` so AuthProvider sees an onboarded app user immediately
// after the Firebase emulator sign-in completes. Without this the backend
// would 404 (no users row) and ProtectedRoute would punt to /setup-username.
const stubMeEndpoint = () => {
  cy.intercept('GET', '**/user/me', {
    statusCode: 200,
    body: { user_id: E2E_UID, user_name: E2E_USERNAME, user_email: E2E_EMAIL },
  }).as('getMe');
};

const mockModule3LevelsPayload = () => ({
  3: {
    levels: [
      {
        tutorial_id: 'module-3.1',
        title: 'Ticking Data and Spread',
        level_order: 1,
        module: 3,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-3.2',
        title: 'Limit Orders in Motion',
        level_order: 2,
        module: 3,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-3.3',
        title: 'Stop Loss Defense',
        level_order: 3,
        module: 3,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-3.4',
        title: 'Stop Limit Control',
        level_order: 4,
        module: 3,
        attempted: false,
        completed: false,
        available: true,
      },
    ],
    'pre-quiz': {
      quiz_id: 'MOD3_PRE',
      available: true,
      completed: false,
      best_score: null,
      module: 3,
    },
    'post-quiz': {
      quiz_id: 'MOD3_POST',
      available: false,
      completed: false,
      best_score: null,
      module: 3,
    },
  },
});

const mockModule4LevelsPayload = () => ({
  4: {
    levels: [
      {
        tutorial_id: 'module-4.1',
        title: 'Rates as Market Regime Input',
        level_order: 1,
        module: 4,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-4.2',
        title: 'Inflation Surprise and Repricing',
        level_order: 2,
        module: 4,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-4.3',
        title: 'Fed Communication Ambiguity',
        level_order: 3,
        module: 4,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-4.4',
        title: 'Policy Uncertainty Shock',
        level_order: 4,
        module: 4,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-4.5',
        title: 'Macro Volatility Risk Discipline',
        level_order: 5,
        module: 4,
        attempted: false,
        completed: false,
        available: true,
      },
    ],
    'pre-quiz': {
      quiz_id: 'MOD4_PRE',
      available: true,
      completed: false,
      best_score: null,
      module: 4,
    },
    'post-quiz': {
      quiz_id: 'MOD4_POST',
      available: false,
      completed: false,
      best_score: null,
      module: 4,
    },
  },
});

const mockModule5LevelsPayload = () => ({
  5: {
    levels: [
      {
        tutorial_id: 'module-5.1',
        title: 'Diversification and Concentration Risk',
        level_order: 1,
        module: 5,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-5.2',
        title: 'Fundamentals and Benchmark Thinking',
        level_order: 2,
        module: 5,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-5.3',
        title: 'Correlation and Theme Crowding',
        level_order: 3,
        module: 5,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-5.4',
        title: 'Beta and Volatility Risk Budget',
        level_order: 4,
        module: 5,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-5.5',
        title: 'Rotation and Rebalancing Timing',
        level_order: 5,
        module: 5,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-5.6',
        title: 'Rebalancing Discipline Under Drift',
        level_order: 6,
        module: 5,
        attempted: false,
        completed: false,
        available: true,
      },
      {
        tutorial_id: 'module-5.7',
        title: 'Alpha Versus Benchmark',
        level_order: 7,
        module: 5,
        attempted: false,
        completed: false,
        available: true,
      },
    ],
    'pre-quiz': {
      quiz_id: 'MOD5_PRE',
      available: true,
      completed: false,
      best_score: null,
      module: 5,
    },
    'post-quiz': {
      quiz_id: 'MOD5_POST',
      available: false,
      completed: false,
      best_score: null,
      module: 5,
    },
  },
});

const leaderboardBody = (bestPoints) => [
  { user_id: E2E_UID, user_name: E2E_USERNAME, best_points: bestPoints },
];

describe('Dashboard navigation', () => {
  beforeEach(() => {
    stubMeEndpoint();
  });

  it('navigates to Adventure Mode when clicking the Adventure card', () => {
    cy.signInViaEmulator(E2E_EMAIL, E2E_PASSWORD);
    cy.visit('/dashboard');
    cy.contains('a', 'Adventure Mode').should('be.visible').click();
    cy.location('pathname').should('eq', '/adventureMode');
  });
});

describe('Module navigation from Adventure Mode', () => {
  beforeEach(() => {
    stubMeEndpoint();
  });

  it('opens Module 3 quiz and level routes', () => {
    cy.intercept('GET', '**/game/me', {
      statusCode: 200,
      body: mockModule3LevelsPayload(),
    }).as('getLevels');
    cy.intercept('GET', '**/game/leaderboard/**', {
      statusCode: 200,
      body: leaderboardBody(1250.5),
    }).as('getLeaderboard');

    cy.signInViaEmulator(E2E_EMAIL, E2E_PASSWORD);
    cy.visit('/adventureMode');

    cy.wait('@getLevels');
    cy.contains('div', 'Module 3').should('be.visible');

    cy.contains('button', 'Module 3 Entry Quiz').should('be.visible').click();
    cy.location('pathname').should('eq', '/adventureMode/quiz/3/pre');

    cy.go('back');
    cy.wait('@getLevels');

    cy.contains('div', 'Module 3')
      .parent()
      .within(() => {
        cy.contains('button', 'Play').first().click();
      });

    cy.wait('@getLeaderboard');
    cy.contains('button', 'Start Level').should('be.visible').click();
    cy.location('pathname').should('eq', '/adventureMode/3/1');
  });

  it('opens Module 4 quiz and level routes', () => {
    cy.intercept('GET', '**/game/me', {
      statusCode: 200,
      body: mockModule4LevelsPayload(),
    }).as('getLevels');
    cy.intercept('GET', '**/game/leaderboard/**', {
      statusCode: 200,
      body: leaderboardBody(980.0),
    }).as('getLeaderboard');

    cy.signInViaEmulator(E2E_EMAIL, E2E_PASSWORD);
    cy.visit('/adventureMode');

    cy.wait('@getLevels');
    cy.contains('div', 'Module 4').should('be.visible');

    cy.contains('button', 'Module 4 Entry Quiz').should('be.visible').click();
    cy.location('pathname').should('eq', '/adventureMode/quiz/4/pre');

    cy.go('back');
    cy.wait('@getLevels');

    cy.contains('div', 'Module 4')
      .parent()
      .within(() => {
        cy.contains('button', 'Play').first().click();
      });

    cy.wait('@getLeaderboard');
    cy.contains('button', 'Start Level').should('be.visible').click();
    cy.location('pathname').should('eq', '/adventureMode/4/1');
  });

  it('opens Module 5 quiz and level routes', () => {
    cy.intercept('GET', '**/game/me', {
      statusCode: 200,
      body: mockModule5LevelsPayload(),
    }).as('getLevels');
    cy.intercept('GET', '**/game/leaderboard/**', {
      statusCode: 200,
      body: leaderboardBody(1111.0),
    }).as('getLeaderboard');

    cy.signInViaEmulator(E2E_EMAIL, E2E_PASSWORD);
    cy.visit('/adventureMode');

    cy.wait('@getLevels');
    cy.contains('div', 'Module 5').should('be.visible');

    cy.contains('button', 'Module 5 Entry Quiz').should('be.visible').click();
    cy.location('pathname').should('eq', '/adventureMode/quiz/5/pre');

    cy.go('back');
    cy.wait('@getLevels');

    cy.contains('div', 'Module 5')
      .parent()
      .within(() => {
        cy.contains('button', 'Play').first().click();
      });

    cy.wait('@getLeaderboard');
    cy.contains('button', 'Start Level').should('be.visible').click();
    cy.location('pathname').should('eq', '/adventureMode/5/1');
  });
});
