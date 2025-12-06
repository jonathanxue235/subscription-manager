describe("Full Subscription Flow (E2E)", () => {
    const email = `flow${Date.now()}@example.com`;
    const username = "Test123";
    const password = "Test123!";
  
    beforeEach(() => {
      cy.register(email, username, password);
    });
  
    it("adds multiple subscriptions, edits one, deletes one", () => {
      cy.addSubscription("Netflix", "2025-12-01", "10.00");
      cy.addSubscription("Spotify", "2025-11-15", "5.00");
      cy.addSubscription("HBO Max", "2025-10-10", "12.00");
  
      cy.editSubscription("Netflix", { name: "Hulu", cost: "9.99" });

      cy.contains("Hulu").should("exist");
  
      cy.deleteSubscription("HBO Max");

      cy.contains("HBO Max").should("not.exist");
    
    });
  });
  