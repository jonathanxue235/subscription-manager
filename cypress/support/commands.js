

Cypress.Commands.add("login", (email, password) => {
    cy.visit("http://localhost:3000/login");
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Password"]').type(password);
  
    cy.intercept("POST", "http://localhost:5001/api/login").as("loginReq");
    cy.get('button[type="submit"]').click();
  
    cy.wait("@loginReq")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);
  
    cy.url({ timeout: 8000 }).should("include", "/dashboard");
});

Cypress.Commands.add("register", (email, username, password) => {
    cy.visit("http://localhost:3000/signup");
  
    cy.get('input[placeholder="Email"]').type(email);
    cy.get('input[placeholder="Username"]').type(username);
    cy.get('input[placeholder="Password"]').type(password);
    cy.get('input[placeholder="Confirm Password"]').type(password);
  
    cy.intercept("POST", "http://localhost:5001/api/register").as("registerReq");
    cy.get('button[type="submit"]').click();
  
    cy.wait("@registerReq")
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);
  
    cy.url({ timeout: 8000 }).should("include", "/dashboard");
});

Cypress.Commands.add("addSubscription", (name, date, cost, freq = "Monthly", card = "Select card or leave blank") => {
    cy.contains("button", "+ Add Subscription")
      .filter(":visible")
      .click();
  
    cy.get('div[style*="background-color: white"]')
      .filter(":visible")
      .within(() => {
        cy.get('input[placeholder="e.g., Netflix"]').clear().type(name);
  
        cy.get("select").eq(0).select(freq);
  
        cy.get("select").eq(1).select(card);
  
        cy.get('input[type="date"]').type(date);
  
        cy.get('input[placeholder="0.00"]').clear().type(cost);
  
        cy.intercept("POST", "/api/subscriptions").as(`add${name}`);
  
        cy.get('button[type="submit"]').click();
      });
    cy.wait(`@add${name}`)
      .its("response.statusCode")
      .should("be.oneOf", [200, 201]);
  
    cy.contains(name).should("exist");
});

Cypress.Commands.add("addSubscriptionAllowOverBudget", (name, date, cost, freq = "Monthly", card = "Select card or leave blank") => {
    cy.contains("button", "+ Add Subscription")
      .filter(":visible")
      .click();
  
    cy.get('div[style*="background-color: white"]')
      .filter(":visible")
      .within(() => {
        cy.get('input[placeholder="e.g., Netflix"]').clear().type(name);
  
        cy.get("select").eq(0).select(freq);
  
        cy.get("select").eq(1).select(card);
  
        cy.get('input[type="date"]').type(date);
  
        cy.get('input[placeholder="0.00"]').clear().type(cost);
  
        cy.intercept("POST", "/api/subscriptions").as(`add${name}`);
  
        cy.get('button[type="submit"]').click();
      });
    // If the warning appears, confirm it
    cy.contains("Budget Exceeded", { timeout: 3000 }).then(($warning) => {
      if ($warning.length) {
        // Modal exists → click Yes
        cy.contains("button", "Yes, Add Subscription")
          .should("be.visible")
          .click({ force: true });
      }
    });
  
    // After confirmation, wait for it to appear in the table
    cy.contains("td", name, { timeout: 10000 }).should("exist");
  });
  
Cypress.Commands.add("editSubscription", (oldName, newFields) => {
    cy.contains("td span", oldName)
      .closest("tr")
      .find("td")
      .first()
      .click({ force: true });
  
    // Wait for modal
    cy.get('div[style*="background-color: white"]').should("be.visible");
  
    cy.wait(100);
  
    if (newFields.name) {
      cy.get('input[placeholder="e.g., Netflix"]')
        .should("be.enabled")
        .as("nameInput");
  
      cy.get("@nameInput").clear({ force: true });
      cy.get("@nameInput").type(newFields.name, { force: true });
    }
  
    if (newFields.cost) {
      cy.get('input[placeholder="0.00"]')
        .should("be.enabled")
        .as("costInput");
  
      cy.get("@costInput").clear({ force: true });
      cy.get("@costInput").type(newFields.cost, { force: true });
    }
  
    // OPTIONAL FIELDS
    if (newFields.freq) cy.get("select").eq(0).select(newFields.freq, { force: true });
    if (newFields.card) cy.get("select").eq(1).select(newFields.card, { force: true });
    if (newFields.date) {
      cy.get('input[type="date"]')
        .should("be.enabled")
        .as("dateInput");
      cy.get("@dateInput").clear({ force: true }).type(newFields.date, { force: true });
    }
  
    cy.intercept("PUT", /api\/subscriptions\/.*/).as("editReq");
    cy.contains("Save Changes").click({ force: true });
  
    cy.wait("@editReq").its("response.statusCode").should("eq", 200);
  
    if (newFields.name) cy.contains(newFields.name).should("exist");
  });
  
  
  
Cypress.Commands.add("deleteSubscription", (name, options = {}) => {
    const { expectLink = false } = options;
  
    cy.contains("td span", name) 
      .closest("tr")
      .within(() => {
        cy.get("button.btn-remove")
          .filter(":visible")
          .click({ force: true });
      });
  
    cy.contains("Confirm Deletion").should("exist");
    cy.contains(name).should("exist");
  
    if (expectLink) {
      cy.get("a[href*='help']").should("exist");
    }
  
    cy.intercept("DELETE", /api\/subscriptions\/.*/).as("deleteReq");
    cy.contains("button", "Delete")
      .filter(":visible")
      .click({ force: true });
  
    cy.wait("@deleteReq").its("response.statusCode").should("eq", 204);
  
    cy.contains(name).should("not.exist");
  });
  