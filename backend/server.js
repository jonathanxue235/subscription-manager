require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client (for database only, not auth)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET;

// Validate environment variables
if (!supabaseUrl || !supabaseKey || !JWT_SECRET) {
  console.error('ERROR: Missing required environment variables!');
  console.error('Please ensure SUPABASE_URL, SUPABASE_ANON_KEY, and JWT_SECRET are set in .env file');
  process.exit(1);
}

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: email,
          password: hashedPassword,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: data.id, email: data.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token: token,
      user: {
        id: data.id,
        email: data.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user in database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful',
      token: token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Protected route example
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'This is protected data',
    user: req.user
  });
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
});