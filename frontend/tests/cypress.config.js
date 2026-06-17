module.exports = {
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'tests/cypress/e2e/**/*.cy.{js,jsx}',
    supportFile: 'tests/cypress/support/e2e.js',
    video: false,
    screenshotsFolder: 'tests/cypress/screenshots',
    downloadsFolder: 'tests/cypress/downloads',
  },
};


