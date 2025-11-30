describe("Add Subscription (E2E)", () => {
    const email = `sub${Date.now()}@example.com`;
    const password = "Test123!";
  
    beforeEach(() => {
      cy.visit("http://localhost:3000/signup");
      cy.get('input[placeholder="Email"]').type(email);
      cy.get('input[placeholder="Password"]').type(password);
      cy.get('input[placeholder="Confirm Password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 8000 }).should("include", "/dashboard");
    });
  
    it("adds a subscription successfully", () => {
      cy.contains('button', '+ Add Subscription')
        .filter(':visible')
        .click();
  
      cy.get('div[style*="background-color: white"]')
        .filter(':visible')
        .within(() => {
  
          cy.get('input[placeholder="e.g., Netflix"]').type("Netflix");
  
          cy.get("select").select("Monthly");
  
          cy.get('input[type="date"]').type("2025-12-01");
  
          cy.get('input[placeholder="0.00"]').clear().type("10.00");
  
          cy.intercept("POST", "http://localhost:5001/api/subscriptions").as("addSub");
  
          cy.get('button[type="submit"]').click();
        });
  
      cy.wait("@addSub")
        .its("response.statusCode")
        .should("be.oneOf", [200, 201]);
  
      cy.contains("Netflix").should("exist");
      cy.contains("$10.00").should("exist");
    });
  });
  