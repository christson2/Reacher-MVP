/**
 * Auth Service
 * 
 * Handles user registration, login, and JWT token generation.
 * Connects to Supabase for user persistence and password hashing.
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(express.json());

/**
 * POST /auth/signup
 * Creates a new user account
 */
app.post(
  '/auth/signup',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password, name } = req.body;

      // TODO: Connect to Supabase and create user
      // const hashedPassword = await bcrypt.hash(password, 10);
      // const user = await supabaseClient.auth.admin.createUser({ email, password });

      return res.status(201).json({
        message: 'User created successfully',
        user: { id: '1', email, name },
      });
    } catch (err) {
      console.error('Signup error:', err);
      return res.status(500).json({ error: 'Signup failed' });
    }
  }
);

/**
 * POST /auth/login
 * Authenticates user and returns JWT
 */
app.post(
  '/auth/login',
  [
    body('email').isEmail(),
    body('password').notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // TODO: Connect to Supabase and verify credentials
      // const user = await supabaseClient.auth.signInWithPassword({ email, password });
      // const token = jwt.sign({ userId: user.user.id, email }, JWT_SECRET, { expiresIn: '24h' });

      return res.status(200).json({
        message: 'Login successful',
        user: { id: '1', email },
        token: 'jwt-token-here',
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
  }
);

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[Auth Service] listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
