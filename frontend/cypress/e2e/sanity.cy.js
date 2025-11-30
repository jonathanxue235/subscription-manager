describe("Sanity Check", () => {
    it("loads homepage", () => {
      cy.visit("/");
      cy.contains("Login"); // or something visible on your landing page
    });
  });
  