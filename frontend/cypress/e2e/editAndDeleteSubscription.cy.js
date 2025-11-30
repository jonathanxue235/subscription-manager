describe("Full Subscription Flow (E2E)", () => {
    const email = `flow${Date.now()}@example.com`;
    const password = "Test123!";
  
    const addSub = (name, date, cost, freq = "Monthly") => {
      cy.contains('button', '+ Add Subscription')
        .filter(':visible')
        .click();
  
      cy.get('div[style*="background-color: white"]')
        .filter(':visible')
        .within(() => {
          cy.get('input[placeholder="e.g., Netflix"]').clear().type(name);
          cy.get("select").select(freq);
          cy.get('input[type="date"]').type(date);
          cy.get('input[placeholder="0.00"]').clear().type(cost);
  
          cy.intercept("POST", "http://localhost:5001/api/subscriptions").as("addSub");
          cy.get('button[type="submit"]').click();
        });
  
      cy.wait("@addSub").its("response.statusCode").should("be.oneOf", [200, 201]);
      cy.contains(name).should("exist");
    };
  
    beforeEach(() => {
      cy.visit("http://localhost:3000/signup");
      cy.get('input[placeholder="Email"]').type(email);
      cy.get('input[placeholder="Password"]').type(password);
      cy.get('input[placeholder="Confirm Password"]').type(password);
      cy.get('button[type="submit"]').click();
      cy.url({ timeout: 8000 }).should("include", "/dashboard");
    });
  
    it("adds multiple subscriptions, edits one, deletes one", () => {
      addSub("Netflix", "2025-12-01", "10.00");
      addSub("Spotify", "2025-11-15", "5.00");
      addSub("HBO Max", "2025-10-10", "12.00");
  
      cy.contains("Netflix").click();
  
      cy.get('div[style*="background-color: white"]')
        .filter(':visible')
        .within(() => {
          cy.get('input[placeholder="e.g., Netflix"]').clear().type("Hulu");
          cy.get('input[placeholder="0.00"]').clear().type("9.99");
  
          cy.intercept("PUT", /api\/subscriptions\/.*/).as("editSub");
          cy.contains("Save Changes").click();
        });
  
      cy.wait("@editSub").its("response.statusCode").should("eq", 200);
      cy.contains("Hulu").should("exist");
  
      cy.contains("HBO Max")
      .closest("tr")
      .within(() => {
        cy.contains("Remove").click();
      });
    
    cy.intercept("DELETE", /api\/subscriptions\/.*/).as("deleteSub");
    
    cy.contains('button', 'Delete')
      .filter(':visible')
      .click();
    
    cy.wait("@deleteSub")
      .its("response.statusCode")
      .should("eq", 200);
    
    cy.contains("HBO Max").should("not.exist");
    
    });
  });
  