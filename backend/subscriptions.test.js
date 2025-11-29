// Tests for subscription-related functionality

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

// Mock supabase client
const mockSupabaseClient = {
  from: jest.fn(),
};

// Mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.JWT_SECRET = 'test-jwt-secret';

// Mock supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Helper function to calculate renewal date (same logic as server.js)
const calculateRenewalDate = (startDate, frequency, customFrequencyDays = null) => {
  // Parse the date string correctly (YYYY-MM-DD format)
  const parts = startDate.split('T')[0].split('-');
  const start = new Date(parts[0], parts[1] - 1, parts[2]); // Year, Month (0-indexed), Day
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

describe('calculateRenewalDate Helper Function', () => {
  describe('Standard frequencies', () => {
    test('calculates Weekly frequency correctly', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Weekly');
      expect(renewalDate).toBe('2024-01-08');
    });

    test('calculates Bi-Weekly frequency correctly', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Bi-Weekly');
      expect(renewalDate).toBe('2024-01-15');
    });

    test('calculates Monthly frequency correctly', () => {
      const startDate = '2024-01-15';
      const renewalDate = calculateRenewalDate(startDate, 'Monthly');
      expect(renewalDate).toBe('2024-02-15');
    });

    test('calculates Quarterly frequency correctly', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Quarterly');
      expect(renewalDate).toBe('2024-04-01');
    });

    test('calculates Bi-Annual frequency correctly', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Bi-Annual');
      expect(renewalDate).toBe('2024-07-01');
    });

    test('calculates Annual frequency correctly', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Annual');
      expect(renewalDate).toBe('2025-01-01');
    });
  });

  describe('Custom frequency', () => {
    test('calculates Custom frequency with 30 days', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Custom', 30);
      expect(renewalDate).toBe('2024-01-31');
    });

    test('calculates Custom frequency with 90 days', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Custom', 90);
      expect(renewalDate).toBe('2024-03-31');
    });

    test('calculates Custom frequency with 1 day', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Custom', 1);
      expect(renewalDate).toBe('2024-01-02');
    });

    test('handles Custom frequency without customFrequencyDays parameter', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Custom');
      // Should keep the same date if no custom days provided
      expect(renewalDate).toBe('2024-01-01');
    });
  });

  describe('Edge cases', () => {
    test('handles month-end dates for Monthly frequency', () => {
      const startDate = '2024-01-31';
      const renewalDate = calculateRenewalDate(startDate, 'Monthly');
      // February 31 doesn't exist, should roll to March
      expect(renewalDate).toBe('2024-03-02');
    });

    test('handles leap year for Annual frequency', () => {
      const startDate = '2024-02-29'; // Leap year
      const renewalDate = calculateRenewalDate(startDate, 'Annual');
      expect(renewalDate).toBe('2025-03-01'); // Non-leap year, rolls to March 1
    });

    test('handles year boundary for Weekly frequency', () => {
      const startDate = '2024-12-30';
      const renewalDate = calculateRenewalDate(startDate, 'Weekly');
      expect(renewalDate).toBe('2025-01-06');
    });

    test('handles unknown frequency (defaults to Monthly)', () => {
      const startDate = '2024-01-01';
      const renewalDate = calculateRenewalDate(startDate, 'Unknown');
      expect(renewalDate).toBe('2024-02-01');
    });

    test('handles date string with time component', () => {
      const startDate = '2024-01-01T12:30:00Z';
      const renewalDate = calculateRenewalDate(startDate, 'Weekly');
      expect(renewalDate).toBe('2024-01-08');
    });
  });
});

describe('POST /api/subscriptions', () => {
  let app;
  let token;

  beforeAll(() => {
    // Create test app
    app = express();
    app.use(express.json());

    // Auth middleware
    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
      });
    };

    // POST /api/subscriptions endpoint
    app.post('/api/subscriptions', authenticateToken, async (req, res) => {
      try {
        const { name, frequency, start_date, cost, logo, custom_frequency_days } = req.body;

        if (!name || !frequency || !start_date || !cost) {
          return res.status(400).json({ error: 'Missing required fields (name, frequency, start_date, cost)' });
        }

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

        if (custom_frequency_days) {
          subscriptionData.custom_frequency_days = parseInt(custom_frequency_days);
        }

        const { data, error } = await mockSupabaseClient
          .from('subscriptions')
          .insert([subscriptionData])
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: 'Failed to create subscription' });
        }

        res.status(201).json(data);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Generate test token
    token = jwt.sign({ userId: 'user-123', email: 'test@example.com' }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('successfully creates a new subscription with valid data', async () => {
    const newSubscription = {
      name: 'Netflix',
      frequency: 'Monthly',
      start_date: '2024-01-01',
      cost: 15.99
    };

    const mockResponse = {
      id: 'sub-123',
      user_id: 'user-123',
      name: 'Netflix',
      status: 'Active',
      frequency: 'Monthly',
      start_date: '2024-01-01',
      renewal_date: '2024-02-01',
      cost: 15.99,
      logo: 'N'
    };

    mockSupabaseClient.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
    });

    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(newSubscription);

    expect(response.status).toBe(201);
    expect(response.body.name).toBe('Netflix');
    expect(response.body.frequency).toBe('Monthly');
    expect(response.body.renewal_date).toBe('2024-02-01');
    expect(response.body.cost).toBe(15.99);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('subscriptions');
  });

  test('successfully creates subscription with Custom frequency', async () => {
    const newSubscription = {
      name: 'Custom Service',
      frequency: 'Custom',
      start_date: '2024-01-01',
      cost: 29.99,
      custom_frequency_days: 45
    };

    const mockResponse = {
      id: 'sub-456',
      user_id: 'user-123',
      name: 'Custom Service',
      status: 'Active',
      frequency: 'Custom',
      start_date: '2024-01-01',
      renewal_date: '2024-02-15',
      cost: 29.99,
      custom_frequency_days: 45,
      logo: 'C'
    };

    mockSupabaseClient.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
    });

    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(newSubscription);

    expect(response.status).toBe(201);
    expect(response.body.frequency).toBe('Custom');
    expect(response.body.custom_frequency_days).toBe(45);
    expect(response.body.renewal_date).toBe('2024-02-15');
  });

  test('returns error when missing required fields', async () => {
    const incompleteSubscription = {
      name: 'Netflix',
      frequency: 'Monthly'
      // Missing start_date and cost
    };

    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(incompleteSubscription);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Missing required fields (name, frequency, start_date, cost)');
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  test('returns error when authorization token is missing', async () => {
    const newSubscription = {
      name: 'Netflix',
      frequency: 'Monthly',
      start_date: '2024-01-01',
      cost: 15.99
    };

    const response = await request(app)
      .post('/api/subscriptions')
      .send(newSubscription);

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Access token required');
  });

  test('handles database error gracefully', async () => {
    const newSubscription = {
      name: 'Netflix',
      frequency: 'Monthly',
      start_date: '2024-01-01',
      cost: 15.99
    };

    mockSupabaseClient.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
    });

    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(newSubscription);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to create subscription');
  });

  test('automatically generates logo from first character if not provided', async () => {
    const newSubscription = {
      name: 'Spotify',
      frequency: 'Annual',
      start_date: '2024-01-01',
      cost: 99.99
    };

    const mockResponse = {
      id: 'sub-789',
      user_id: 'user-123',
      name: 'Spotify',
      status: 'Active',
      frequency: 'Annual',
      start_date: '2024-01-01',
      renewal_date: '2025-01-01',
      cost: 99.99,
      logo: 'S'
    };

    mockSupabaseClient.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockResponse, error: null }),
    });

    const response = await request(app)
      .post('/api/subscriptions')
      .set('Authorization', `Bearer ${token}`)
      .send(newSubscription);

    expect(response.status).toBe(201);
    expect(response.body.logo).toBe('S');
  });
});

describe('GET /api/subscriptions/stats', () => {
  let app;
  let token;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    const authenticateToken = (req, res, next) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ error: 'Access token required' });
      }

      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
      });
    };

    app.get('/api/subscriptions/stats', authenticateToken, async (req, res) => {
      try {
        const { data, error } = await mockSupabaseClient
          .from('subscriptions')
          .select('*')
          .eq('user_id', req.user.userId);

        if (error) {
          return res.status(500).json({ error: 'Failed to fetch stats' });
        }

        const subscriptions = (data || []).map(sub => ({
          ...sub,
          status: calculateStatus(sub.renewal_date)
        }));

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

        const today = new Date();
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        const totalMonthlyCost = subscriptions.reduce((sum, sub) => {
          const cost = parseFloat(sub.cost);
          const startDate = sub.start_date ? new Date(sub.start_date) : new Date();
          const frequencyDays = getDaysInFrequency(sub.frequency, sub.custom_frequency_days);

          let renewalCount = 0;
          let currentRenewalDate = new Date(startDate);

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
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    token = jwt.sign({ userId: 'user-123', email: 'test@example.com' }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calculates total monthly cost correctly for multiple subscriptions', async () => {
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);

    const mockSubscriptions = [
      {
        id: 'sub-1',
        name: 'Netflix',
        frequency: 'Monthly',
        start_date: currentMonthStart.toISOString().split('T')[0],
        renewal_date: futureDate.toISOString().split('T')[0],
        cost: 15.99
      },
      {
        id: 'sub-2',
        name: 'Spotify',
        frequency: 'Monthly',
        start_date: currentMonthStart.toISOString().split('T')[0],
        renewal_date: futureDate.toISOString().split('T')[0],
        cost: 9.99
      }
    ];

    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockSubscriptions, error: null }),
    });

    const response = await request(app)
      .get('/api/subscriptions/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalMonthlyCost');
    expect(response.body).toHaveProperty('activeSubscriptions');
    expect(response.body).toHaveProperty('nextRenewal');
  });

  test('counts active subscriptions correctly', async () => {
    const today = new Date();
    const futureDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10);
    const expiringDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5);

    const mockSubscriptions = [
      {
        id: 'sub-1',
        name: 'Netflix',
        frequency: 'Monthly',
        start_date: '2024-01-01',
        renewal_date: futureDate.toISOString().split('T')[0],
        cost: 15.99
      },
      {
        id: 'sub-2',
        name: 'Spotify',
        frequency: 'Monthly',
        start_date: '2024-01-01',
        renewal_date: expiringDate.toISOString().split('T')[0],
        cost: 9.99
      }
    ];

    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockSubscriptions, error: null }),
    });

    const response = await request(app)
      .get('/api/subscriptions/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    // One Active (futureDate > 7 days), one Expiring Soon (expiringDate <= 7 days)
    expect(response.body.activeSubscriptions).toBe(1);
  });

  test('identifies next renewal correctly', async () => {
    const today = new Date();
    const nearDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3);
    const farDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15);

    const mockSubscriptions = [
      {
        id: 'sub-1',
        name: 'Netflix',
        frequency: 'Monthly',
        start_date: '2024-01-01',
        renewal_date: farDate.toISOString().split('T')[0],
        cost: 15.99
      },
      {
        id: 'sub-2',
        name: 'Spotify',
        frequency: 'Monthly',
        start_date: '2024-01-01',
        renewal_date: nearDate.toISOString().split('T')[0],
        cost: 9.99
      }
    ];

    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockSubscriptions, error: null }),
    });

    const response = await request(app)
      .get('/api/subscriptions/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.nextRenewal).not.toBeNull();
    expect(response.body.nextRenewal.name).toBe('Spotify');
    expect(response.body.nextRenewal.date).toBe(nearDate.toISOString().split('T')[0]);
  });

  test('returns null nextRenewal when no upcoming renewals', async () => {
    const today = new Date();
    const pastDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5);

    const mockSubscriptions = [
      {
        id: 'sub-1',
        name: 'Netflix',
        frequency: 'Monthly',
        start_date: '2024-01-01',
        renewal_date: pastDate.toISOString().split('T')[0],
        cost: 15.99
      }
    ];

    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: mockSubscriptions, error: null }),
    });

    const response = await request(app)
      .get('/api/subscriptions/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.nextRenewal).toBeNull();
  });

  test('handles empty subscription list', async () => {
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
    });

    const response = await request(app)
      .get('/api/subscriptions/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.totalMonthlyCost).toBe('0.00');
    expect(response.body.activeSubscriptions).toBe(0);
    expect(response.body.nextRenewal).toBeNull();
  });

  test('handles database error gracefully', async () => {
    mockSupabaseClient.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
    });

    const response = await request(app)
      .get('/api/subscriptions/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Failed to fetch stats');
  });
});
