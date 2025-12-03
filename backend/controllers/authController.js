/* authentication controller's purpose is to handle HTTP request/response for auth. it hides login in AuthService, databse in UserRepository and only knows about the express req/res objects

 */

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res) {
    try {
      const { email, password, username, monthly_budget, location, primary_curr } = req.body;

      const { user, token } = await this.authService.register(email, password, {
        username,
        monthly_budget,
        location,
        primary_curr
      });

      res.status(201).json({
        message: 'User created successfully',
        token: token,
        user: user
      });
    } catch (error) {
      this._handleError(error, res);
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      const { user, token } = await this.authService.login(email, password);

      res.json({
        message: 'Login successful',
        token: token,
        user: user
      });
    } catch (error) {
      this._handleError(error, res);
    }
  }

  async getProtectedData(req, res) {
    try {
      res.json({
        message: 'This is protected data',
        user: req.user
      });
    } catch (error) {
      this._handleError(error, res);
    }
  }

  async updateProfile(req, res) {
    try {
      const { username, monthly_budget, location, primary_curr } = req.body;
      const userId = req.user.userId;

      const updates = {};
      if (username !== undefined) updates.username = username;
      if (monthly_budget !== undefined) updates.monthly_budget = monthly_budget;
      if (location !== undefined) updates.location = location;
      if (primary_curr !== undefined) updates.primary_curr = primary_curr;

      const updatedUser = await this.authService.updateProfile(userId, updates);

      res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      this._handleError(error, res);
    }
  }

  _handleError(error, res) {
    console.error('Controller error:', error);

    const errorMessage = error.message;

    // Handle validation errors (400 Bad Request)
    if (
      errorMessage.includes('required') ||
      errorMessage.includes('at least') ||
      errorMessage.includes('must contain') ||
      errorMessage.includes('Invalid email format') ||
      errorMessage.includes('already exists') ||
      errorMessage.includes('already in use') ||
      errorMessage.includes('already taken') ||
      errorMessage.includes('No valid fields to update')
    ) {
      return res.status(400).json({ error: errorMessage });
    }

    // Handle authentication errors (401 Unauthorized)
    if (
      errorMessage.includes('Invalid email or password') ||
      errorMessage.includes('Invalid or expired token')
    ) {
      return res.status(401).json({ error: errorMessage });
    }

    // Handle all other errors as internal server errors
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = AuthController;
