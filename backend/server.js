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
const AuthService = require('./services/authService');
const AuthController = require('./controllers/authController');
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
// Expose supabase client alias for legacy code that references `supabase`
const supabase = dbClient;

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
// Apply `authLimiter` to authentication endpoints
app.post('/api/register', authLimiter, (req, res) => authController.register(req, res));
app.post('/api/login', authLimiter, (req, res) => authController.login(req, res));

// Protected routes (require authentication)
app.get('/api/protected', authenticateToken, (req, res) =>
  authController.getProtectedData(req, res)
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== SUBSCRIPTION ENDPOINTS ====================

// Helper function to calculate renewal date based on start date and frequency
const calculateRenewalDate = (startDate, frequency, customFrequencyDays = null) => {
  const start = new Date(startDate);
  const renewal = new Date(start);

  switch (frequency) {
    case 'Weekly':
      renewal.setDate(start.getDate() + 7);
      break;
    case 'Bi-Weekly':
      renewal.setDate(start.getDate() + 14);
      break;
    case 'Monthly':
      renewal.setMonth(start.getMonth() + 1);
      break;
    case 'Quarterly':
      renewal.setMonth(start.getMonth() + 3);
      break;
    case 'Bi-Annual':
      renewal.setMonth(start.getMonth() + 6);
      break;
    case 'Annual':
      renewal.setFullYear(start.getFullYear() + 1);
      break;
    case 'Custom':
      if (customFrequencyDays) {
        renewal.setDate(start.getDate() + parseInt(customFrequencyDays));
      }
      break;
    default:
      renewal.setMonth(start.getMonth() + 1); // Default to monthly
  }

  return renewal.toISOString().split('T')[0];
};

// Helper function to calculate status based on renewal date
const calculateStatus = (renewalDate) => {
  const today = new Date();
  const renewal = new Date(renewalDate);
  const daysUntilRenewal = Math.ceil((renewal - today) / (1000 * 60 * 60 * 24));

  if (daysUntilRenewal <= 7 && daysUntilRenewal >= 0) {
    return 'Expiring Soon';
  }
  return 'Active';
};

// Get all subscriptions for authenticated user
app.get('/api/subscriptions', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.userId)
      .order('renewal_date', { ascending: true });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    // Automatically update status based on renewal date
    const subscriptionsWithStatus = (data || []).map(sub => ({
      ...sub,
      status: calculateStatus(sub.renewal_date)
    }));

    res.json(subscriptionsWithStatus);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get dashboard stats
app.get('/api/subscriptions/stats', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch stats' });
    }

    // Update status dynamically for each subscription
    const subscriptions = (data || []).map(sub => ({
      ...sub,
      status: calculateStatus(sub.renewal_date)
    }));

    // Helper function to get days in frequency
    const getDaysInFrequency = (frequency, customDays) => {
      switch (frequency) {
        case 'Weekly': return 7;
        case 'Bi-Weekly': return 14;
        case 'Monthly': return 30;
        case 'Quarterly': return 90;
        case 'Bi-Annual': return 182;
        case 'Annual': return 365;
        case 'Custom': return customDays || 30;
        default: return 30;
      }
    };

    // Calculate total cost for current month by counting actual renewals
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
      const cost = parseFloat(sub.cost);
      const startDate = sub.start_date ? new Date(sub.start_date) : new Date();
      const frequencyDays = getDaysInFrequency(sub.frequency, sub.custom_frequency_days);

      // Count renewals in current month
      let renewalCount = 0;
      let currentRenewalDate = new Date(startDate);

      // Only count if subscription started before month end
      if (startDate <= currentMonthEnd) {
        while (currentRenewalDate <= currentMonthEnd) {
          if (currentRenewalDate >= currentMonthStart && currentRenewalDate <= currentMonthEnd) {
            renewalCount++;
          }
          currentRenewalDate = new Date(currentRenewalDate);
          currentRenewalDate.setDate(currentRenewalDate.getDate() + frequencyDays);
        }
      }

      return sum + (renewalCount * cost);
    }, 0);

    // Find next renewal
    const upcomingRenewals = subscriptions
      .filter(sub => new Date(sub.renewal_date) >= today)
      .sort((a, b) => new Date(a.renewal_date) - new Date(b.renewal_date));

    const nextRenewal = upcomingRenewals[0];

    const stats = {
      totalMonthlyCost: totalMonthlyCost.toFixed(2),
      activeSubscriptions: subscriptions.filter(sub => sub.status === 'Active').length,
      nextRenewal: nextRenewal ? {
        date: nextRenewal.renewal_date,
        name: nextRenewal.name
      } : null
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get subscription history for chart (calculated from start dates)
app.get('/api/subscriptions/history', authenticateToken, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch subscriptions' });
    }

    const subscriptions = data || [];

    if (subscriptions.length === 0) {
      // Return empty array if no subscriptions
      return res.json([]);
    }

    // Find the earliest start date to determine how far back to generate data
    let earliestStartDate = new Date();
    subscriptions.forEach(sub => {
      if (sub.start_date) {
        const startDate = new Date(sub.start_date);
        if (startDate < earliestStartDate) {
          earliestStartDate = startDate;
        }
      }
    });

    // Calculate monthly costs based on start dates
    const monthlyCosts = {};
    const today = new Date();

    // Generate all months from earliest start date to now
    const startMonth = new Date(earliestStartDate.getFullYear(), earliestStartDate.getMonth(), 1);
    const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    let currentDate = new Date(startMonth);
    while (currentDate <= currentMonth) {
      const monthKey = currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      monthlyCosts[monthKey] = 0;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Helper function to get days in frequency
    const getDaysInFrequency = (frequency, customDays) => {
      switch (frequency) {
        case 'Weekly': return 7;
        case 'Bi-Weekly': return 14;
        case 'Monthly': return 30; // Approximate for calculation
        case 'Quarterly': return 90;
        case 'Bi-Annual': return 182;
        case 'Annual': return 365;
        case 'Custom': return customDays || 30;
        default: return 30;
      }
    };

    // Calculate costs for each subscription
    subscriptions.forEach(sub => {
      const startDate = sub.start_date ? new Date(sub.start_date) : new Date();
      const cost = parseFloat(sub.cost);
      const frequencyDays = getDaysInFrequency(sub.frequency, sub.custom_frequency_days);

      // For each month, count how many renewals occur
      Object.keys(monthlyCosts).forEach(monthKey => {
        const [monthStr, yearStr] = monthKey.split(' ');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(monthStr);
        const year = 2000 + parseInt(yearStr);

        // Get first and last day of the month
        const monthStart = new Date(year, monthIndex, 1);
        const monthEnd = new Date(year, monthIndex + 1, 0); // Last day of month

        // Only process if subscription started before month end
        if (startDate <= monthEnd) {
          let renewalCount = 0;
          let currentRenewalDate = new Date(startDate);

          // Count renewals that fall within this month
          while (currentRenewalDate <= monthEnd) {
            if (currentRenewalDate >= monthStart && currentRenewalDate <= monthEnd) {
              renewalCount++;
            }
            // Move to next renewal date
            currentRenewalDate = new Date(currentRenewalDate);
            currentRenewalDate.setDate(currentRenewalDate.getDate() + frequencyDays);
          }

          // Add the cost for this month (renewalCount * cost)
          monthlyCosts[monthKey] += renewalCount * cost;
        }
      });
    });

    // Transform to chart format
    const chartData = Object.entries(monthlyCosts).map(([name, cost]) => ({
      name,
      cost: parseFloat(cost.toFixed(2))
    }));

    res.json(chartData);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new subscription
app.post('/api/subscriptions', authenticateToken, async (req, res) => {
  try {
    const { name, frequency, start_date, cost, logo, custom_frequency_days } = req.body;

    // Validate input
    if (!name || !frequency || !start_date || !cost) {
      return res.status(400).json({ error: 'Missing required fields (name, frequency, start_date, cost)' });
    }

    // Calculate renewal date based on start date and frequency
    const renewal_date = calculateRenewalDate(start_date, frequency, custom_frequency_days);

    const subscriptionData = {
      user_id: req.user.userId,
      name,
      status: 'Active',
      frequency,
      start_date,
      renewal_date,
      cost: parseFloat(cost),
      logo: logo || name.charAt(0).toUpperCase()
    };

    // Add custom_frequency_days if provided
    if (custom_frequency_days) {
      subscriptionData.custom_frequency_days = parseInt(custom_frequency_days);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create subscription' });
    }

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update subscription
app.put('/api/subscriptions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, frequency, start_date, cost, logo, custom_frequency_days } = req.body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (frequency !== undefined) updates.frequency = frequency;
    if (start_date !== undefined) updates.start_date = start_date;
    if (cost !== undefined) updates.cost = parseFloat(cost);
    if (logo !== undefined) updates.logo = logo;
    if (custom_frequency_days !== undefined) updates.custom_frequency_days = parseInt(custom_frequency_days);

    // Recalculate renewal date if frequency or start_date changed
    const newStartDate = start_date || existing.start_date;
    const newFrequency = frequency || existing.frequency;
    const newCustomFrequencyDays = custom_frequency_days || existing.custom_frequency_days;

    if (start_date !== undefined || frequency !== undefined || custom_frequency_days !== undefined) {
      updates.renewal_date = calculateRenewalDate(newStartDate, newFrequency, newCustomFrequencyDays);
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete subscription
app.delete('/api/subscriptions/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const { error } = await supabase
      .from('subscriptions')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to delete subscription' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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
