describe("Login, Notifications, Search, Add/Edit/Delete Subscription", () => {
    const email = "123@hello.com";
    const password = "Ab*12345";
    beforeEach(() => {
      cy.login(email, password);
    });
    it("logs in, checks notifications, searches, adds/edits/deletes subscription", () => {
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
      cy.addSubscription("Paramount+", "2025-12-25", "8.99");
  
      // EDIT SUBSCRIPTION
      cy.editSubscription("Paramount+", {
        name: "Paramount Premium",
        cost: "12.99"
      });
  
      cy.contains("Paramount Premium").should("exist");
  
      // DELETE SUBSCRIPTION
      cy.deleteSubscription("Paramount Premium");

      cy.contains("Paramount Premium").should("not.exist");
    });
  });
  