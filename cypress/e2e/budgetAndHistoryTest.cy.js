describe("Budgeting + History Tracking + Hulu Scenario", () => {
    const email = "cypressTest@gmail.com";
    const password = "Cypress1!";
  
    beforeEach(() => {
      cy.login(email, password);
    });

    it("tests budget, long history, Hulu add/delete, and exceeded budget logic", () => {
  
      // SET BUDGET
      cy.contains("button", "+ Budget").click();
      cy.get('input[placeholder="Enter amount (leave empty for no budget)"]')
      .should("exist")
      .should("be.enabled")
      .invoke("val", "")
      .trigger("input")
      .invoke("val", "50")
      .trigger("input");

      cy.get('input[placeholder="Enter amount (leave empty for no budget)"]')
      .should("have.value", "50");
      cy.wait(50);

      cy.intercept("PUT", "/api/budget").as("saveBudget");
      cy.contains("Save Budget").click();
      cy.wait("@saveBudget")
        .its("response.statusCode")
        .should("be.oneOf", [200, 201]);
      cy.get('button:contains("×")')
        .filter(":visible")
        .click();
      // ADD HULU — WITHIN BUDGET (NO WARNING)
      cy.addSubscription("Hulu", "2025-12-05", "10.00");
  
      cy.contains("Budget Exceeded").should("not.exist");
      cy.contains("Hulu").should("exist");  

      // ADD FORTNITE — EXCEEDS BUDGET
      cy.addSubscriptionAllowOverBudget("Fortnite Premium", "2025-12-01", "150.00");


      // VERIFY HISTORY CHART WORKS
      ["1M", "3M", "6M", "1Y", "MAX"].forEach((rangeLabel, i) => {
        cy.intercept("GET", "/api/subscriptions/history*").as(`hist${i}`);
        cy.contains(rangeLabel).click();
      });
  
      // DELETE HULU (and verify link)
      cy.deleteSubscription("Hulu", { expectLink: true });
  
      // DELETE FORTNITE TOO (cleanup)
      cy.deleteSubscription("Fortnite Premium");
    });
  });
  