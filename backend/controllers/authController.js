/* authentication controller's purpose is to handle HTTP request/response for auth. it hides login in AuthService, databse in UserRepository and only knows about the express req/res objects

 */

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(req, res) {
    try {
      const { email, password } = req.body;

      const { user, token } = await this.authService.register(email, password);

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

  _handleError(error, res) {
    console.error('Controller error:', error);

    const errorMessage = error.message;

    if (
      errorMessage.includes('required') ||
      errorMessage.includes('at least') ||
      errorMessage.includes('already exists')
    ) {
      return res.status(400).json({ error: errorMessage });
    }

    if (errorMessage.includes('Invalid email or password')) {
      return res.status(401).json({ error: errorMessage });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = AuthController;
