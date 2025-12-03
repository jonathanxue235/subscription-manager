/**
 * Main Server File
 *
 * Purpose: Wire all modules together using dependency injection
 * Clean Architecture:
 *   - Config layer provides environment variables
 *   - Database layer provides database client
 *   - Repository layer handles database operations
 *   - Service layer handles business logic
 *   - Controller layer handles HTTP requests
 *   - Middleware layer handles authentication
 */

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Import configuration
const { getConfig } = require('./config/environment');
const { createDatabaseClient } = require('./config/database');

// Import layers
const UserRepository = require('./repositories/userRepository');
const SubscriptionRepository = require('./repositories/subscriptionRepository');
const AuthService = require('./services/authService');
const SubscriptionService = require('./services/subscriptionService');
const BudgetService = require('./services/budgetService');
const AuthController = require('./controllers/authController');
const SubscriptionController = require('./controllers/subscriptionController');
const { createAuthMiddleware } = require('./middleware/authMiddleware');

// Initialize Express app
const app = express();

// Get configuration
const config = getConfig();

// Middleware
// Configure CORS allowed origins via `CORS_ALLOWED` env var (comma-separated)
// Fallback to localhost for development
const allowedOrigins = (process.env.CORS_ALLOWED || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., server-to-server or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed'));
  },
  optionsSuccessStatus: 200,
  credentials: true // allow cookies/credentials when using cookie-based auth
};

app.use(cors(corsOptions));

// Secure HTTP headers
app.use(helmet());

// Simple rate limiter for auth endpoints to mitigate brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
});
app.use(express.json());

// =============================================================================
// DEPENDENCY INJECTION - Wire all modules together
// =============================================================================

// 1. Create database client
const dbClient = createDatabaseClient();

// 2. Create repositories (depend on database client)
const userRepository = new UserRepository(dbClient);
const subscriptionRepository = new SubscriptionRepository(dbClient);

// 3. Create services (depend on repositories)
const authService = new AuthService(userRepository, config.jwtSecret);
const subscriptionService = new SubscriptionService(subscriptionRepository);
const budgetService = new BudgetService(subscriptionService, userRepository);

// 4. Create controllers (depend on services)
const authController = new AuthController(authService);
const subscriptionController = new SubscriptionController(subscriptionService, budgetService);

// 5. Create middleware (depends on service)
const authenticateToken = createAuthMiddleware(authService);

// =============================================================================
// ROUTES - Clean and simple!
// =============================================================================

// Authentication routes
// Apply `authLimiter` to authentication endpoints
app.post('/api/register', authLimiter, (req, res) => authController.register(req, res));
app.post('/api/login', authLimiter, (req, res) => authController.login(req, res));

// Protected routes (require authentication)
app.get('/api/protected', authenticateToken, (req, res) =>
  authController.getProtectedData(req, res)
);

// Get current user data
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
app.put('/api/user', authenticateToken, (req, res) => authController.updateProfile(req, res));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== SUBSCRIPTION ENDPOINTS ====================
app.get('/api/subscriptions', authenticateToken, (req, res) => subscriptionController.getAll(req, res));
app.get('/api/subscriptions/stats', authenticateToken, (req, res) => subscriptionController.getDashboard(req, res));
app.get('/api/subscriptions/history', authenticateToken, (req, res) => subscriptionController.getHistory(req, res));
app.post('/api/subscriptions', authenticateToken, (req, res) => subscriptionController.create(req, res));
app.put('/api/subscriptions/:id', authenticateToken, (req, res) => subscriptionController.update(req, res));
app.delete('/api/subscriptions/:id', authenticateToken, (req, res) => subscriptionController.delete(req, res));

// Test endpoint
app.get('/api/data', (req, res) => {
  res.json({ message: 'Backend is connected!' });
});

// ==================== BUDGET ENDPOINTS ====================
app.get('/api/budget', authenticateToken, async (req, res) => {
  try {
    const status = await budgetService.getBudgetStatus(req.user.userId);
    res.json({ monthlyBudget: status.budgetLimit || 0 });
  } catch (error) {
    console.error('Error fetching budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/budget', authenticateToken, async (req, res) => {
  try {
    const { monthlyBudget } = req.body;

    if (monthlyBudget === undefined || monthlyBudget === null) {
      return res.status(400).json({ error: 'Monthly budget is required' });
    }

    const budgetValue = parseFloat(monthlyBudget);
    if (isNaN(budgetValue) || budgetValue < 0) {
      return res.status(400).json({ error: 'Budget must be a non-negative number' });
    }

    const user = await budgetService.updateBudgetLimit(req.user.userId, budgetValue);
    res.json({ monthlyBudget: user.monthly_budget });
  } catch (error) {
    console.error('Error updating budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/budget/check', authenticateToken, async (req, res) => {
  try {
    const { cost, frequency, customFrequencyDays } = req.body;

    if (!cost || !frequency) {
      return res.status(400).json({ error: 'Cost and frequency are required' });
    }

    const result = await budgetService.checkBudgetLimit(req.user.userId, {
      cost,
      billing_cycle: frequency.toLowerCase(),
      custom_frequency_days: customFrequencyDays
    });

    if (!result.exceedsLimit) {
      return res.json({
        exceedsBudget: false,
        monthlyBudget: parseFloat(result.budgetLimit || 0),
        currentMonthlyCost: parseFloat(result.currentTotal || 0),
        newMonthlyCost: parseFloat(result.newTotal || 0),
        overageAmount: 0
      });
    }

    res.json({
      exceedsBudget: true,
      monthlyBudget: parseFloat(result.budgetLimit),
      currentMonthlyCost: parseFloat(result.currentTotal),
      newMonthlyCost: parseFloat(result.newTotal),
      overageAmount: parseFloat((result.newTotal - result.budgetLimit).toFixed(2))
    });
  } catch (error) {
    console.error('Error checking budget:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============================================================================
// START SERVER
// =============================================================================

app.listen(config.port, () => {
  console.log(`✅ Server running on http://localhost:${config.port}`);
  console.log(`✅ Environment: ${config.nodeEnv}`);
  console.log(`✅ Modular architecture initialized!`);
});

// Export for testing
module.exports = app;
