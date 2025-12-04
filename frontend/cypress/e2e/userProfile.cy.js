/**
 * Comprehensive E2E Test for User Profile Feature
 *
 * This test covers:
 * 1. User registration with all profile fields
 * 2. Viewing profile data
 * 3. Editing profile fields
 * 4. Saving profile changes
 * 5. Canceling edits
 * 6. Navigation
 * 7. Logout functionality
 */

describe("User Profile - Complete E2E Test", () => {
  const timestamp = Date.now();
  const testUser = {
    email: `profiletest${timestamp}@example.com`,
    username: `testuser${timestamp}`,
    password: "Test123!",
    monthlyBudget: "500",
    location: "San Francisco",
    primaryCurrency: "USD",
  };

  const updatedUser = {
    username: `updated${timestamp}`,
    monthlyBudget: "750",
    location: "New York",
    primaryCurrency: "EUR",
  };

  // Helper function to create session
  const login = (email, password) => {
    cy.session([email, password], () => {
      cy.visit("http://localhost:3000/login");
      cy.get('input[placeholder="Email"]').type(email);
      cy.get('input[placeholder="Password"]').type(password);
      cy.intercept("POST", "http://localhost:5001/api/login").as("login");
      cy.get('button[type="submit"]').click();
      cy.wait("@login").its("response.statusCode").should("eq", 200);
      cy.url({ timeout: 10000 }).should("include", "/dashboard");
    });
  };

  before(() => {
    // Clear any existing session
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe("Feature: User Registration with Profile Fields", () => {
    it("should sign up a new user with complete profile information", () => {
      cy.visit("http://localhost:3000/signup");

      // Fill in email
      cy.get('input[placeholder="Email"]')
        .should("be.visible")
        .type(testUser.email);

      // Fill in username
      cy.get('input[placeholder="Username"]')
        .should("be.visible")
        .type(testUser.username);

      // Fill in password fields
      cy.get('input[placeholder="Password"]').first().type(testUser.password);
      cy.get('input[placeholder="Confirm Password"]').type(testUser.password);

      // Fill in monthly budget
      cy.get('input[placeholder*="Monthly Budget"]').type(
        testUser.monthlyBudget,
      );

      // Fill in location
      cy.get('input[placeholder*="Location"]').type(testUser.location);

      // Select primary currency
      cy.get("select").select(testUser.primaryCurrency);

      // Intercept the registration request
      cy.intercept("POST", "http://localhost:5001/api/register").as("register");

      // Submit the form
      cy.get('button[type="submit"]').click();

      // Wait for successful registration
      cy.wait("@register")
        .its("response.statusCode")
        .should("be.oneOf", [200, 201]);
    });

    it("should login with the newly created account", () => {
      // Navigate to login page
      cy.visit("http://localhost:3000/login");

      // Fill in credentials
      cy.get('input[placeholder="Email"]').type(testUser.email);
      cy.get('input[placeholder="Password"]').type(testUser.password);

      // Intercept login request
      cy.intercept("POST", "http://localhost:5001/api/login").as("login");

      // Submit login form
      cy.get('button[type="submit"]').click();

      // Wait for successful login
      cy.wait("@login").its("response.statusCode").should("eq", 200);

      // Should redirect to dashboard
      cy.url({ timeout: 10000 }).should("include", "/dashboard");
    });
  });

  describe("Feature: Viewing User Profile", () => {
    beforeEach(() => {
      // Use session to maintain authentication
      login(testUser.email, testUser.password);
    });

    it("should display all user profile information correctly", () => {
      // Navigate to profile page
      cy.visit("http://localhost:3000/profile");

      // Wait for page to load
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      // Verify email is displayed
      cy.contains(testUser.email).should("be.visible");

      // Verify username is displayed
      cy.contains(testUser.username).should("be.visible");

      // Verify monthly budget is displayed with currency formatting
      cy.contains("$500.00").should("be.visible");

      // Verify location is displayed
      cy.contains(testUser.location).should("be.visible");

      // Verify primary currency is displayed
      cy.contains(testUser.primaryCurrency).should("be.visible");

      // Verify user avatar with initial
      cy.get(".avatar").should(
        "contain",
        testUser.username.charAt(0).toUpperCase(),
      );

      // Verify "Member Since" is displayed
      cy.contains("Member Since").should("be.visible");
    });

    it("should display Edit Profile and Logout buttons", () => {
      cy.visit("http://localhost:3000/profile");

      cy.contains("Edit Profile").should("be.visible");
      cy.contains("Logout").should("be.visible");
    });
  });

  describe("Feature: Editing Profile", () => {
    beforeEach(() => {
      login(testUser.email, testUser.password);
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");
    });

    it("should enter edit mode when clicking Edit Profile", () => {
      // Click Edit Profile button
      cy.contains("button", "Edit Profile").click();

      // Should show Save Changes and Cancel buttons
      cy.contains("button", "Save Changes").should("be.visible");
      cy.contains("button", "Cancel").should("be.visible");

      // Should show input fields with current values
      cy.get('input[type="text"]')
        .filter((index, el) => el.value === testUser.username)
        .should("exist");
      cy.get('input[type="number"]').should(
        "have.value",
        testUser.monthlyBudget,
      );

      // Email should still be read-only (not editable)
      cy.get('input[value="' + testUser.email + '"]').should("not.exist");
    });

    it("should allow editing username", () => {
      cy.contains("button", "Edit Profile").click();

      // Find and clear username input
      cy.get('input[type="text"]').first().clear().type(updatedUser.username);

      // Verify new value is displayed
      cy.get('input[type="text"]')
        .first()
        .should("have.value", updatedUser.username);
    });

    it("should allow editing monthly budget", () => {
      cy.contains("button", "Edit Profile").click();

      // Edit budget
      cy.get('input[type="number"][step="0.01"]')
        .clear()
        .type(updatedUser.monthlyBudget);

      // Verify new value
      cy.get('input[type="number"][step="0.01"]').should(
        "have.value",
        updatedUser.monthlyBudget,
      );
    });

    it("should allow editing location", () => {
      cy.contains("button", "Edit Profile").click();

      // Find location input by placeholder or by filtering text inputs
      cy.get('input[type="text"]').eq(1).clear().type(updatedUser.location);

      // Verify new value
      cy.get('input[type="text"]')
        .eq(1)
        .should("have.value", updatedUser.location);
    });

    it("should allow changing primary currency via dropdown", () => {
      cy.contains("button", "Edit Profile").click();

      // Change currency
      cy.get("select").select(updatedUser.primaryCurrency);

      // Verify selection
      cy.get("select").should("have.value", updatedUser.primaryCurrency);

      // Verify all currency options are available
      cy.get("select option").should("have.length", 8);
      cy.get("select").within(() => {
        cy.contains("USD - US Dollar").should("exist");
        cy.contains("EUR - Euro").should("exist");
        cy.contains("GBP - British Pound").should("exist");
        cy.contains("CAD - Canadian Dollar").should("exist");
        cy.contains("AUD - Australian Dollar").should("exist");
        cy.contains("JPY - Japanese Yen").should("exist");
        cy.contains("CNY - Chinese Yuan").should("exist");
        cy.contains("INR - Indian Rupee").should("exist");
      });
    });
  });

  describe("Feature: Saving Profile Changes", () => {
    beforeEach(() => {
      login(testUser.email, testUser.password);
    });

    it("should successfully save all profile changes", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      // Enter edit mode
      cy.contains("button", "Edit Profile").click();

      // Edit all fields
      cy.get('input[type="text"]').first().clear().type(updatedUser.username);
      cy.get('input[type="number"]').clear().type(updatedUser.monthlyBudget);
      cy.get('input[type="text"]').eq(1).clear().type(updatedUser.location);
      cy.get("select").select(updatedUser.primaryCurrency);

      // Intercept the update request
      cy.intercept("PUT", "http://localhost:5001/api/user").as("updateProfile");

      // Click Save Changes
      cy.contains("button", "Save Changes").click();

      // Wait for API call
      cy.wait("@updateProfile").its("response.statusCode").should("eq", 200);

      // Verify success message appears
      cy.contains(/profile updated successfully/i, { timeout: 5000 }).should(
        "be.visible",
      );

      // Should exit edit mode
      cy.contains("button", "Edit Profile", { timeout: 5000 }).should(
        "be.visible",
      );

      // Verify updated values are displayed
      cy.contains(updatedUser.username).should("be.visible");
      cy.contains(updatedUser.location).should("be.visible");

      // Verify budget is formatted with new currency
      cy.contains("€750.00").should("be.visible");
    });

    it("should show loading state while saving", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Edit Profile").click();

      // Make a small change
      cy.get('input[type="text"]').first().clear().type("tempname");

      // Intercept with delay
      cy.intercept("PUT", "http://localhost:5001/api/user", (req) => {
        req.reply((res) => {
          res.delay = 1000; // Add delay to see loading state
          res.send();
        });
      }).as("updateProfile");

      cy.contains("button", "Save Changes").click();

      // Should show "Saving..." text
      cy.contains(/saving\.\.\./i).should("be.visible");

      // Button should be disabled
      cy.contains("button", "Saving...").should("be.disabled");
    });

    it("should handle empty budget field by sending null", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Edit Profile").click();

      // Clear budget field
      cy.get('input[type="number"]').clear();

      cy.intercept("PUT", "http://localhost:5001/api/user").as("updateProfile");

      cy.contains("button", "Save Changes").click();

      cy.wait("@updateProfile").then((interception) => {
        // Verify null was sent for empty budget
        expect(interception.request.body.monthly_budget).to.be.null;
      });
    });

    it("should handle empty location field by sending null", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Edit Profile").click();

      // Clear location field
      cy.get('input[type="text"]').eq(1).clear();

      cy.intercept("PUT", "http://localhost:5001/api/user").as("updateProfile");

      cy.contains("button", "Save Changes").click();

      cy.wait("@updateProfile").then((interception) => {
        // Verify null was sent for empty location
        expect(interception.request.body.location).to.be.null;
      });
    });
  });

  describe("Feature: Canceling Edits", () => {
    beforeEach(() => {
      login(testUser.email, testUser.password);
    });

    it("should restore original values when canceling", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      // Capture the current username before editing
      let originalUsername;
      cy.contains("button", "Edit Profile").click();
      cy.get('input[type="text"]')
        .first()
        .invoke("val")
        .then((val) => {
          originalUsername = val;
        });

      // Make changes
      cy.get('input[type="text"]').first().clear().type("temporaryname");

      // Verify temporary change
      cy.get('input[type="text"]')
        .first()
        .should("have.value", "temporaryname");

      // Click Cancel
      cy.contains("button", "Cancel").click();

      // Should exit edit mode
      cy.contains("button", "Edit Profile").should("be.visible");

      // Original value should be restored
      cy.then(() => {
        cy.contains(originalUsername).should("be.visible");
      });
      cy.contains("temporaryname").should("not.exist");
    });

    it("should clear error messages when canceling", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Edit Profile").click();

      // Make a change
      cy.get('input[type="text"]').first().clear().type("newname");

      // Mock a failed update
      cy.intercept("PUT", "http://localhost:5001/api/user", {
        statusCode: 400,
        body: { error: "Failed to update profile" },
      }).as("updateProfile");

      cy.contains("button", "Save Changes").click();

      // Wait for error
      cy.contains(/failed to update profile/i, { timeout: 5000 }).should(
        "be.visible",
      );

      // Cancel
      cy.contains("button", "Cancel").click();

      // Error should be cleared
      cy.contains(/failed to update profile/i).should("not.exist");
    });
  });

  describe("Feature: Error Handling", () => {
    beforeEach(() => {
      login(testUser.email, testUser.password);
    });

    it("should display error message when save fails", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Edit Profile").click();

      cy.get('input[type="text"]').first().clear().type("errortest");

      // Mock failed request
      cy.intercept("PUT", "http://localhost:5001/api/user", {
        statusCode: 500,
        body: { error: "Internal server error" },
      }).as("updateProfile");

      cy.contains("button", "Save Changes").click();

      // Should show error message
      cy.contains(/internal server error/i, { timeout: 5000 }).should(
        "be.visible",
      );

      // Should remain in edit mode
      cy.contains("button", "Save Changes").should("be.visible");
    });

    it("should handle network errors gracefully", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Edit Profile").click();

      // Mock network failure
      cy.intercept("PUT", "http://localhost:5001/api/user", {
        forceNetworkError: true,
      }).as("updateProfile");

      cy.contains("button", "Save Changes").click();

      // Should show error
      cy.contains(/error/i, { timeout: 5000 }).should("be.visible");
    });
  });

  describe("Feature: Navigation", () => {
    beforeEach(() => {
      login(testUser.email, testUser.password);
    });

    it("should navigate back to dashboard when clicking back button", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      // Click back button
      cy.contains("button", /back to dashboard/i).click();

      // Should navigate to dashboard
      cy.url({ timeout: 5000 }).should("include", "/dashboard");
    });

    it("should be accessible directly via URL when authenticated", () => {
      // Visit profile directly
      cy.visit("http://localhost:3000/profile");

      // Should load successfully
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      // Verify profile content is displayed (check for email instead of username)
      cy.contains(testUser.email).should("be.visible");
    });
  });

  describe("Feature: Logout", () => {
    beforeEach(() => {
      login(testUser.email, testUser.password);
    });

    it("should logout and redirect to login page", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      // Click logout button
      cy.contains("button", "Logout").click();

      // Should redirect to login page
      cy.url({ timeout: 5000 }).should("include", "/login");

      // JWT token should be cleared
      cy.window().then((win) => {
        const token = win.localStorage.getItem("token");
        expect(token).to.be.null;
      });
    });

    it("should not be accessible after logout", () => {
      // Try to visit profile page after logout
      cy.visit("http://localhost:3000/profile");

      // Should redirect to login or show error
      cy.url({ timeout: 5000 }).should("satisfy", (url) => {
        return url.includes("/login") || url.includes("/signup");
      });
    });
  });

  describe("Feature: Data Persistence", () => {
    it("should persist profile data across page refreshes", () => {
      // Use session for authentication
      login(testUser.email, testUser.password);

      // Navigate to profile
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      // Verify data is still there from previous updates
      cy.contains(updatedUser.username).should("be.visible");

      // Reload page
      cy.reload();

      // Data should still be visible
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");
      cy.contains(updatedUser.username).should("be.visible");
    });
  });

  describe("Feature: Currency Formatting", () => {
    beforeEach(() => {
      login(testUser.email, testUser.password);
    });

    it("should format budget with correct currency symbol", () => {
      cy.visit("http://localhost:3000/profile");
      cy.contains("My Profile", { timeout: 10000 }).should("be.visible");

      // EUR symbol should be shown (from previous update)
      cy.contains("€").should("be.visible");

      // Change to USD
      cy.contains("button", "Edit Profile").click();
      cy.get("select").select("USD");
      cy.get('input[type="number"]').clear().type("1000");

      cy.intercept("PUT", "http://localhost:5001/api/user").as("updateProfile");
      cy.contains("button", "Save Changes").click();
      cy.wait("@updateProfile");

      // Should show $ symbol
      cy.contains("$1,000.00", { timeout: 5000 }).should("be.visible");

      // Change to GBP
      cy.contains("button", "Edit Profile").click();
      cy.get("select").select("GBP");

      cy.intercept("PUT", "http://localhost:5001/api/user").as(
        "updateProfile2",
      );
      cy.contains("button", "Save Changes").click();
      cy.wait("@updateProfile2");

      // Should show £ symbol
      cy.contains("£1,000.00", { timeout: 5000 }).should("be.visible");
    });
  });
});
