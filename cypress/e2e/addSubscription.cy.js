/*
Chatgpt 5.1 
Generate a test using cypress to register a new user, and then add a subscription to the system. (I uploaded screenshots of what the application looks)
Reprompted to fix errors with not waiting long enough between steps:
Can you fix an issue where it doesn't see the dashboard after registering?

This code was then refactored by me (KyleArffy) after creating helper functions for registering and adding subscriptions etc.
*/

describe("Add Subscription (E2E)", () => {
    const email = `sub${Date.now()}@example.com`;
    const username = "Test123";
    const password = "Test123!";
  
    beforeEach(() => {
      cy.register(email, username, password);
    });

    it("adds a subscription successfully", () => {
      cy.addSubscription("Netflix", "2025-12-01", "10.00");

      cy.contains("Netflix").should("exist");
      cy.contains("$10.00").should("exist");
    });
  });
  