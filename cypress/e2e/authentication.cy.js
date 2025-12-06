describe("User Registration (JWT Auto Login)", () => {
    const email = `cypress${Date.now()}@example.com`;
    const username = "Test123";
    const password = "Test123!";
  
    it("registers a new user and redirects to dashboard", () => {
      cy.register(email, username, password);

      // Frontend auto-navigates to dashboard
      cy.url({ timeout: 8000 }).should("include", "/dashboard");
  
      // Check dashboard content
      cy.contains("Dashboard").should("exist");
      cy.contains("Total Monthly Cost").should("exist");
  
      cy.window().then(win => {
        const keys = Object.keys(win.localStorage);
        const tokenKey = keys.find(k => k.toLowerCase().includes("token"));
        expect(tokenKey, "JWT token key should exist").to.exist;
        expect(win.localStorage.getItem(tokenKey)).to.be.a("string");
      });
    });
    it("successfully logs in an existing user", () => {
      const email = "123@hello.com";
      const password = "Ab*12345";
  
      cy.login(email, password);
  
      cy.contains("Dashboard").should("exist");
    });
  });
  