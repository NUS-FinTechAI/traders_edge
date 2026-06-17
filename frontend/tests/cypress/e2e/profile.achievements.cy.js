const E2E_EMAIL = 'e2e-profile@example.com';
const E2E_PASSWORD = 'CypressTest123!';
const E2E_UID = 'e2e-user';
const E2E_USERNAME = 'E2E User';

const stubMeEndpoint = () => {
  cy.intercept('GET', '**/user/me', {
    statusCode: 200,
    body: { user_id: E2E_UID, user_name: E2E_USERNAME, user_email: E2E_EMAIL },
  }).as('getMe');
};

describe('Profile achievements presentation', () => {
  beforeEach(() => {
    stubMeEndpoint();
  });

  it('renders grouped achievements with progress summary and detail popup states', () => {
    cy.intercept('GET', '**/progression/achievements/**', {
      statusCode: 200,
      body: [
        {
          achievement_id: 'first-win',
          title: 'First Win',
          hint: 'Complete your first mission',
          description: 'You cleared your first mission.',
          icon_key: 'Trophy',
          achieved: true,
        },
        {
          achievement_id: 'streak-3',
          title: '3-Day Streak',
          hint: 'Trade for 3 consecutive days',
          description: 'You stayed active for 3 days.',
          icon_key: 'Flame',
          achieved: true,
        },
        {
          achievement_id: 'module-five',
          title: 'Module 5 Master',
          hint: 'Complete all Module 5 levels',
          description: 'You completed every Module 5 level.',
          icon_key: 'Star',
          achieved: false,
        },
        {
          achievement_id: 'puzzle-legend',
          title: 'Puzzle Legend',
          hint: 'Finish 10 puzzle levels',
          description: 'You solved 10 puzzle levels.',
          icon_key: 'Puzzle',
          achieved: false,
        },
      ],
    }).as('getAchievements');

    cy.signInViaEmulator(E2E_EMAIL, E2E_PASSWORD);
    cy.visit('/profile');

    cy.wait('@getAchievements');
    cy.get('[data-testid="achievements-section"]').should('be.visible');
    cy.get('[data-testid="achievements-summary-label"]').should('contain.text', '2/4 unlocked');
    cy.get('[data-testid="achievements-completion-rate"]').should('contain.text', '50%');

    cy.get('[data-testid="achievements-group-unlocked"] [data-testid^="achievement-card-"]').should('have.length', 2);
    cy.get('[data-testid="achievements-group-locked"] [data-testid^="achievement-card-"]').should('have.length', 2);

    cy.get('[data-testid="achievement-card-first-win"]').click();
    cy.contains('First Win').should('be.visible');
    cy.contains('You cleared your first mission.').should('be.visible');
    cy.contains('Unlocked').should('be.visible');
    cy.get('button[aria-label="Close"]').click();

    cy.get('[data-testid="achievement-card-module-five"]').click();
    cy.contains('Module 5 Master').should('be.visible');
    cy.contains('Hint').should('be.visible');
    cy.contains('Complete all Module 5 levels').should('be.visible');
  });

  it('shows empty state when achievements API returns no items', () => {
    cy.intercept('GET', '**/progression/achievements/**', {
      statusCode: 200,
      body: [],
    }).as('getAchievements');

    cy.signInViaEmulator(E2E_EMAIL, E2E_PASSWORD);
    cy.visit('/profile');

    cy.wait('@getAchievements');
    cy.get('[data-testid="achievements-summary-label"]').should('contain.text', 'No achievements available yet');
    cy.contains('No achievements available yet. Complete levels and challenges to start collecting them.').should('be.visible');
  });
});
