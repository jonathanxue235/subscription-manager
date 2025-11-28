// backend tests with test doubles for supabase and bcrypt

const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// mock supabase client - test double
const mockSupabaseClient = {
  from: jest.fn(),
};

// mock environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.JWT_SECRET = 'test-jwt-secret';

// mock supabase module
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

// Now require the server after mocks are set up
// Note: In real implementation, you'd separate server logic from server.js
// For now, we'll create a test version

describe('Backend API - Tests with Supabase Test Doubles', () => {
  let app;

  beforeAll(() => {
    // create a simplified version of your server for testing
    app = express();
    app.use(express.json());

    // register endpoint (same logic as your server.js)
    app.post('/api/register', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // mock supabase call - check if user exists
        const { data: existingUser } = await mockSupabaseClient
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
        }

        // hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // mock supabase call - insert user
        const { data, error } = await mockSupabaseClient
          .from('users')
          .insert([{ email, password: hashedPassword, created_at: new Date().toISOString() }])
          .select()
          .single();

        if (error) {
          return res.status(500).json({ error: 'Failed to create user' });
        }

        // generate jwt
        const token = jwt.sign({ userId: data.id, email: data.email }, process.env.JWT_SECRET, {
          expiresIn: '24h',
        });

        res.status(201).json({
          message: 'User created successfully',
          token,
          user: { id: data.id, email: data.email },
        });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // login endpoint
    app.post('/api/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({ error: 'Email and password are required' });
        }

        // mock supabase call - find user
        const { data: user, error } = await mockSupabaseClient
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !user) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // compare password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // generate jwt
        const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, {
          expiresIn: '24h',
        });

        res.json({
          message: 'Login successful',
          token,
          user: { id: user.id, email: user.email },
        });
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    });
  });

  beforeEach(() => {
    // reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /api/register', () => {
    test('successfully registers a new user', async () => {
      // stub: mock supabase responses
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        password: await bcrypt.hash('password123', 10),
        created_at: new Date().toISOString(),
      };

      // mock: user doesn't exist check
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      });

      // mock: insert new user
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      });

      const response = await request(app).post('/api/register').send({
        email: 'newuser@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@example.com');
      expect(response.body.message).toBe('User created successfully');

      // verify supabase was called correctly (mock verification)
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    });

    test('returns error when user already exists', async () => {
      // stub: mock existing user
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: 'user-456', email: 'existing@example.com' },
          error: null,
        }),
      });

      const response = await request(app).post('/api/register').send({
        email: 'existing@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already exists');
    });

    test('returns error when password is too short', async () => {
      const response = await request(app).post('/api/register').send({
        email: 'test@example.com',
        password: '12345',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 6 characters');

      // verify that supabase was not called
      expect(mockSupabaseClient.from).not.toHaveBeenCalled();
    });

    test('returns error when email or password is missing', async () => {
      const response = await request(app).post('/api/register').send({
        email: 'test@example.com',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('POST /api/login', () => {
    test('successfully logs in with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
      };

      // stub: mock supabase find user
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      });

      const response = await request(app).post('/api/login').send({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('test@example.com');
      expect(response.body.message).toBe('Login successful');
    });

    test('returns error with incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: hashedPassword,
      };

      // stub: mock user found
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      });

      const response = await request(app).post('/api/login').send({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    test('returns error when user does not exist', async () => {
      // stub: mock user not found
      mockSupabaseClient.from.mockReturnValueOnce({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      });

      const response = await request(app).post('/api/login').send({
        email: 'nonexistent@example.com',
        password: 'password123',
      });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });
  });
});
