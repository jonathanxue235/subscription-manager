describe("Login, Notifications, Search, Add/Edit/Delete Subscription", () => {
    const email = "123@hello.com";
    const password = "123456";
  
    const addSub = (name, date, cost, freq = "Monthly", card = "Paypal") => {
      cy.contains("button", "+ Add Subscription")
        .filter(":visible")
        .click();
  
      cy.get('div[style*="background-color: white"]')
        .filter(":visible")
        .within(() => {
          cy.get('input[placeholder="e.g., Netflix"]').clear().type(name);
          cy.get("select").eq(0).select(freq);     // Frequency
          cy.get("select").eq(1).select(card);     // Card Issuer
          cy.get('input[type="date"]').type(date);
          cy.get('input[placeholder="0.00"]').clear().type(cost);
  
          cy.intercept("POST", "http://localhost:5001/api/subscriptions").as("addSub");
          cy.get('button[type="submit"]').click();
        });
  
      cy.wait("@addSub").its("response.statusCode").should("be.oneOf", [200, 201]);
      cy.contains(name).should("exist");
    };
  
    it("logs in, checks notifications, searches, adds/edits/deletes subscription", () => {
      // LOGIN
      cy.visit("http://localhost:3000/login");
      cy.get('input[placeholder="Email"]').type(email);
      cy.get('input[placeholder="Password"]').type(password);
  
      cy.intercept("POST", "http://localhost:5001/api/login").as("login");
      cy.get('button[type="submit"]').click();
      cy.wait("@login").its("response.statusCode").should("eq", 200);
  
      cy.url({ timeout: 8000 }).should("include", "/dashboard");
  
    // OPEN NOTIFICATIONS
      cy.contains("🔔")
      .filter(":visible")
      .click({ force: true });
      cy.contains("Upcoming Renewals").should("exist");
      cy.contains("Mark all as read").click();
      cy.get(".notification-count").should("not.exist");

  
      // SEARCH FIELD
      const searchBar = 'input[placeholder="Search subscriptions..."]';
  
      // SEARCH PARTIAL: "spot"
      cy.get(searchBar).clear().type("spot");
      cy.contains("Spotify").should("exist");
      cy.contains("Discord").should("not.exist");
  
      // SEARCH CASE-INSENSITIVE: "NETF"
      cy.get(searchBar).clear().type("NETF");
      cy.contains("Netflix").should("exist");
      cy.contains("Discord").should("not.exist");
  
      // SEARCH EXACT: "zzz"
      cy.get(searchBar).clear().type("zzz");
      cy.contains("zzz").should("exist");
  
      // CLEAR SEARCH
      cy.get(searchBar).clear();
      cy.contains("Discord").should("exist");
      cy.contains("Spotify").should("exist");
      cy.contains("Netflix").should("exist");
      cy.contains("zzz").should("exist");
      cy.contains("test1").should("exist");
  
      // ADD SUBSCRIPTION
      addSub("Paramount+", "2025-12-25", "8.99");
  
      // EDIT SUBSCRIPTION
      cy.contains("Paramount+").click();
      cy.get('div[style*="background-color: white"]')
        .filter(":visible")
        .within(() => {
          cy.get('input[placeholder="e.g., Netflix"]').clear().type("Paramount Premium");
          cy.get('input[placeholder="0.00"]').clear().type("12.99");
  
          cy.intercept("PUT", /api\/subscriptions\/.*/).as("editSub");
          cy.contains("Save Changes").click();
        });
  
      cy.wait("@editSub").its("response.statusCode").should("eq", 200);
      cy.contains("Paramount Premium").should("exist");
  
      // DELETE SUBSCRIPTION
      cy.contains("Paramount Premium")
        .closest("tr")
        .within(() => {
          cy.contains("Remove").click();
        });
  
      cy.intercept("DELETE", /api\/subscriptions\/.*/).as("deleteSub");
      cy.contains("button", "Delete")
        .filter(":visible")
        .click();
  
      cy.wait("@deleteSub").its("response.statusCode").should("eq", 204);
      cy.contains("Paramount Premium").should("not.exist");
    });
  });
  