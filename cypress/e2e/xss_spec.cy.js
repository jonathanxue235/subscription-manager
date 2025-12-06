describe('XSS safety test — attempt to exfiltrate token', () => {
  const TOKEN = 'TEST_TOKEN_XSS';

  beforeEach(() => {
    // Stub backend dashboard endpoints so the test doesn't require a running backend
    cy.intercept('GET', 'http://localhost:5001/api/subscriptions', { statusCode: 200, body: [] }).as('getSubs');
    cy.intercept('GET', 'http://localhost:5001/api/subscriptions/stats', { statusCode: 200, body: { totalMonthlyCost: '0.00', activeSubscriptions: 0 } }).as('getStats');
    cy.intercept('GET', 'http://localhost:5001/api/subscriptions/history', { statusCode: 200, body: [] }).as('getHistory');

    // Stub the login endpoint to return a token for the UI login flow
    cy.intercept('POST', 'http://localhost:5001/api/login', (req) => {
      req.reply({
        statusCode: 200,
        body: {
          token: TOKEN,
          user: { id: 1, email: 'john@email.com', name: 'John' }
        }
      });
    }).as('loginReq');

    // Perform a UI login so the app stores the token in localStorage naturally
    cy.login('john@email.com', 'Password1!');
  });

  it('injects script as subscription name and checks for token exfiltration', () => {
    const payload = "<script>window.__xss_test_token = localStorage.getItem('token')</script>";

    // Open the Add Subscription modal (match without relying on leading whitespace or plus sign)
    cy.contains('button', 'Add Subscription').filter(':visible').click();

    // Fill the form inside the modal
    cy.get('div[style*="background-color: white"]').filter(':visible').within(() => {
      cy.get('input[placeholder="e.g., Netflix"]').type(payload);
      // The modal contains two <select> elements (frequency and card). Target the first one (frequency).
      cy.get('select').eq(0).select('Monthly');
      cy.get('input[type="date"]').type('2025-12-01');
      cy.get('input[placeholder="0.00"]').clear().type('0.00');

      // Intercept the POST and return the created subscription so the UI refreshes
      cy.intercept('POST', 'http://localhost:5001/api/subscriptions', (req) => {
        req.reply({
          statusCode: 201,
          body: {
            id: 9999,
            name: payload,
            frequency: 'Monthly',
            start_date: '2025-12-01',
            renewal_date: '2026-01-01',
            cost: '0.00',
            status: 'Active'
          }
        });
      }).as('addSub');

      cy.get('button[type="submit"]').click();
    });

    cy.wait('@addSub');

    // Return the malicious subscription on subsequent GET so it renders in the list
    cy.intercept('GET', 'http://localhost:5001/api/subscriptions', { statusCode: 200, body: [{ id: 9999, name: payload, status: 'Active', frequency: 'Monthly', custom_frequency_days: null, start_date: '2025-12-01', renewal_date: '2026-01-01', cost: '0.00', logo: 'M' }] }).as('getSubsAfter');

    // Give the app a short moment to re-render
    cy.wait(500);

    // Inspect window for the test variable. If the injected script executed and read localStorage,
    // it would set window.__xss_test_token to the token value. We fail the test explicitly if that happens.
    cy.window().then((win) => {
      if (win.__xss_test_token) {
        cy.log(`XSS detected! window.__xss_test_token = ${win.__xss_test_token}`);
        // Fail the test explicitly if the token was exfiltrated
        throw new Error(`XSS detected! window.__xss_test_token = ${win.__xss_test_token}`);
      } else {
        cy.log('No XSS detected — attack failed to exfiltrate token');
        expect(win.__xss_test_token).to.be.undefined;
      }
    });
  });
});
