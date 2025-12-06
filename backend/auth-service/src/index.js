/**
 * Auth Service
 * 
 * Handles user registration, login, and JWT token generation.
 * Supports both SQLite (local dev) and Supabase (production).
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');
const { initializeDatabase, runQuery, getOne, closeDatabase } = require('./db');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '86400'; // 24 hours

app.use(express.json());

/**
 * POST /auth/signup
 * Creates a new user account
 * Body: { email, password, name, phone (optional) }
 */
app.post(
  '/auth/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').optional().isMobilePhone().withMessage('Invalid phone number'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password, name, phone } = req.body;

      // Check if user already exists
      const existingUser = await getOne(
        'SELECT id FROM users WHERE email = ? OR phone = ?',
        [email, phone]
      );

      if (existingUser) {
        return res.status(409).json({ success: false, error: 'Email or phone already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const userId = uuidv4();

      // Create user
      await runQuery(
        `INSERT INTO users (id, email, phone, password_hash, name, roles) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, phone, hashedPassword, name, 'user']
      );

      // Create user profile
      const profileId = uuidv4();
      await runQuery(
        `INSERT INTO profiles (id, user_id) VALUES (?, ?)`,
        [profileId, userId]
      );

      // Generate JWT
      const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: { id: userId, email, name, phone },
        token,
      });
    } catch (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ success: false, error: 'Signup failed', details: err.message });
    }
  }
);

/**
 * POST /auth/login
 * Authenticates user and returns JWT
 * Body: { email, password }
 */
app.post(
  '/auth/login',
  [
    body('email').isEmail().withMessage('Invalid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);

      if (!isPasswordValid) {
        return res.status(401).json({ success: false, error: 'Invalid email or password' });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRY,
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        user: { id: user.id, email: user.email, name: user.name, phone: user.phone },
        token,
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, error: 'Login failed', details: err.message });
    }
  }
);

/**
 * POST /auth/verify
 * Verifies JWT token
 * Headers: Authorization: Bearer <token>
 */
app.post('/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ success: true, user: decoded });
  } catch (err) {
    return res.status(403).json({ success: false, error: 'Invalid token' });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'auth' });
});

/**
 * Start server and initialize database
 */
async function startServer() {
  try {
    await initializeDatabase();
    console.log('[Auth Service] Database initialized');

    app.listen(PORT, () => {
      console.log(`[Auth Service] listening on http://0.0.0.0:${PORT}`);
      console.log(`[Auth Service] JWT_SECRET=${JWT_SECRET ? 'set' : 'not set'}`);
      console.log(`[Auth Service] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Auth Service] Failed to start:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Auth Service] Shutting down...');
  await closeDatabase();
  process.exit(0);
});

startServer();

module.exports = app;
