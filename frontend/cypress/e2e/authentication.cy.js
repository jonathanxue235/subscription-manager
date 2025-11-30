describe("User Registration (JWT Auto Login)", () => {
    const email = `cypress${Date.now()}@example.com`;
    const password = "Test123!";
  
    it("registers a new user, stores JWT, and redirects to dashboard", () => {
      cy.visit("http://localhost:3000/signup");
  
      cy.get('input[placeholder="Email"]').type(email);
      cy.get('input[placeholder="Password"]').type(password);
      cy.get('input[placeholder="Confirm Password"]').type(password);
  
      cy.intercept("POST", "http://localhost:5001/api/register").as("register");
  
      cy.get('button[type="submit"]').click();
  
      // Wait for backend to respond
      cy.wait("@register").its("response.statusCode")
        .should("be.oneOf", [200, 201]);
  
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
  });
  