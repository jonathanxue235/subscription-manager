describe('XSS safety test — attempt to exfiltrate token', () => {
  const TOKEN = 'TEST_TOKEN_XSS';

  beforeEach(() => {
    // Stub backend dashboard endpoints so the test doesn't require a running backend
    cy.intercept('GET', 'http://localhost:5001/api/subscriptions', { statusCode: 200, body: [] }).as('getSubs');
    cy.intercept('GET', 'http://localhost:5001/api/subscriptions/stats', { statusCode: 200, body: { totalMonthlyCost: '0.00', activeSubscriptions: 0 } }).as('getStats');
    cy.intercept('GET', 'http://localhost:5001/api/subscriptions/history', { statusCode: 200, body: [] }).as('getHistory');

    // Provide a token before the app loads so an injected script could read it
    cy.visit('http://localhost:3000/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', TOKEN);
      }
    });
  });

  it('injects script as subscription name and checks for token exfiltration', () => {
    const payload = "<script>window.__xss_test_token = localStorage.getItem('token')</script>";

    // Open the Add Subscription modal
    cy.contains('button', '+ Add Subscription').filter(':visible').click();

    // Fill the form inside the modal
    cy.get('div[style*="background-color: white"]').filter(':visible').within(() => {
      cy.get('input[placeholder="e.g., Netflix"]').type(payload);
      cy.get('select').select('Monthly');
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
        throw new Error(`XSS detected! window.__xss_test_token = ${win.__xss_test_token}`);
      } else {
        expect(win.__xss_test_token).to.be.undefined;
      }
    });
  });
});
