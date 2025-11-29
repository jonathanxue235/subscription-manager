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

// Import configuration
const { getConfig } = require('./config/environment');
const { createDatabaseClient } = require('./config/database');

// Import layers
const UserRepository = require('./repositories/userRepository');
const AuthService = require('./services/authService');
const AuthController = require('./controllers/authController');
const { createAuthMiddleware } = require('./middleware/authMiddleware');

// Initialize Express app
const app = express();

// Get configuration
const config = getConfig();

// Middleware
app.use(cors());
app.use(express.json());

// =============================================================================
// DEPENDENCY INJECTION - Wire all modules together
// =============================================================================

// 1. Create database client
const dbClient = createDatabaseClient();

// 2. Create repository (depends on database client)
const userRepository = new UserRepository(dbClient);

// 3. Create service (depends on repository)
const authService = new AuthService(userRepository, config.jwtSecret);

// 4. Create controller (depends on service)
const authController = new AuthController(authService);

// 5. Create middleware (depends on service)
const authenticateToken = createAuthMiddleware(authService);

// =============================================================================
// ROUTES - Clean and simple!
// =============================================================================

// Authentication routes
app.post('/api/register', (req, res) => authController.register(req, res));
app.post('/api/login', (req, res) => authController.login(req, res));

// Protected routes (require authentication)
app.get('/api/protected', authenticateToken, (req, res) =>
  authController.getProtectedData(req, res)
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test endpoint
app.get('/api/data', (req, res) => {
  res.json({ message: 'Backend is connected!' });
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
