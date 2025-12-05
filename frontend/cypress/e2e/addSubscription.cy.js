describe("Add Subscription (E2E)", () => {
    const email = `sub${Date.now()}@example.com`;
    const username = "Test123";
    const password = "Test123!";
  
    beforeEach(() => {
      cy.visit("http://localhost:3000/signup");
      cy.get('input[placeholder="Email"]').type(email);
      cy.get('input[placeholder="Username"]').type(username);
      cy.get('input[placeholder="Password"]').type(password);
      cy.get('input[placeholder="Confirm Password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 8000 }).should("include", "/dashboard");
    });
  
    it("adds a subscription successfully", () => {
      cy.addSubscription("Netflix", "2025-12-01", "10.00");

      cy.contains("Netflix").should("exist");
      cy.contains("$10.00").should("exist");
    });
  });
  