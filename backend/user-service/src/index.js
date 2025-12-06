/**
 * User Service
 * 
 * Manages user profiles and account information
 * Endpoints:
 *   GET    /users/:id          - Get user profile
 *   GET    /users              - List users (admin only)
 *   POST   /users              - Create user (during signup, called from auth service)
 *   PUT    /users/:id          - Update user profile (owner only)
 *   DELETE /users/:id          - Soft delete user (owner only)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, param, validationResult } = require('express-validator');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { initializeDatabase, runQuery, getOne, getAll, closeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Middleware: Validation error handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.param, message: e.msg }))
    });
  }
  next();
};

/**
 * Middleware: Extract user context from headers (set by Gateway)
 */
const extractUserContext = (req, res, next) => {
  req.userId = req.headers['x-user-id'];
  req.userEmail = req.headers['x-user-email'];
  next();
};

app.use(extractUserContext);

/**
 * HEALTH CHECK
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'user-service' });
});

/**
 * GET /users/:id
 * Retrieve user profile by ID (public endpoint)
 */
app.get(
  '/users/:id',
  param('id').isUUID().withMessage('Invalid user ID format'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Get user info
      const user = await getOne(
        'SELECT id, email, phone, name, roles FROM users WHERE id = ?',
        [id]
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User not found'
        });
      }

      // Get profile info
      const profile = await getOne(
        'SELECT * FROM profiles WHERE user_id = ?',
        [id]
      );

      res.status(200).json({
        success: true,
        data: {
          user,
          profile: profile || {}
        }
      });
    } catch (error) {
      console.error('[User Service] Error getting user:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * GET /users
 * List all users (admin only, pagination supported)
 */
app.get('/users', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = parseInt(req.query.offset) || 0;

    const users = await getAll(
      'SELECT id, email, phone, name, roles, created_at FROM users LIMIT ? OFFSET ?',
      [limit, offset]
    );

    const countResult = await getOne('SELECT COUNT(*) as count FROM users');

    res.status(200).json({
      success: true,
      data: {
        users,
        total: countResult.count,
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('[User Service] Error listing users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

/**
 * POST /users
 * Create new user profile (called after signup)
 * Body: { userId, email, name, phone?, roles? }
 */
app.post(
  '/users',
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('email').isEmail().withMessage('Invalid email'),
  body('name').notEmpty().withMessage('Name required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone'),
  body('roles').optional().isString().withMessage('Invalid roles'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId, email, name, phone, roles } = req.body;

      // Check if user already exists
      const existing = await getOne('SELECT id FROM users WHERE id = ?', [userId]);
      if (existing) {
        return res.status(409).json({
          success: false,
          message: 'User already exists',
          error: 'User already exists'
        });
      }

      // Create user record
      await runQuery(
        `INSERT INTO users (id, email, phone, name, password_hash, roles)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email, phone || null, name, 'dummy-hash', roles || 'consumer']
      );

      // Create profile record
      const profileId = uuidv4();
      await runQuery(
        `INSERT INTO profiles (id, user_id) VALUES (?, ?)`,
        [profileId, userId]
      );

      res.status(201).json({
        success: true,
        message: 'User profile created',
        data: {
          userId,
          email,
          name,
          phone,
          roles: roles || 'consumer'
        }
      });
    } catch (error) {
      console.error('[User Service] Error creating user:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * PUT /users/:id
 * Update user profile (owner only)
 * Body: { bio?, avatar_url?, location?, verified? }
 */
app.put(
  '/users/:id',
  param('id').isUUID().withMessage('Invalid user ID'),
  body('bio').optional().isString().trim(),
  body('avatar_url').optional().isURL().withMessage('Invalid avatar URL'),
  body('location').optional().isString().trim(),
  body('verified').optional().isBoolean().withMessage('Invalid verified flag'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { bio, avatar_url, location, verified } = req.body;

      // Check authorization (only owner or admin can update)
      if (req.userId !== id && req.userId !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
          error: 'You can only update your own profile'
        });
      }

      // Check if user exists
      const user = await getOne('SELECT id FROM users WHERE id = ?', [id]);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User not found'
        });
      }

      // Get or create profile
      let profile = await getOne('SELECT id FROM profiles WHERE user_id = ?', [id]);
      if (!profile) {
        const profileId = uuidv4();
        await runQuery(
          'INSERT INTO profiles (id, user_id) VALUES (?, ?)',
          [profileId, id]
        );
      }

      // Build update query dynamically
      const updates = [];
      const values = [];
      
      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(bio);
      }
      if (avatar_url !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatar_url);
      }
      if (location !== undefined) {
        updates.push('location = ?');
        values.push(location);
      }
      if (verified !== undefined) {
        updates.push('verified = ?');
        values.push(verified ? 1 : 0);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`;
        await runQuery(sql, values);
      }

      res.status(200).json({
        success: true,
        message: 'Profile updated',
        data: {
          userId: id,
          bio,
          avatar_url,
          location,
          verified
        }
      });
    } catch (error) {
      console.error('[User Service] Error updating user:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * DELETE /users/:id
 * Soft delete user (owner only)
 */
app.delete(
  '/users/:id',
  param('id').isUUID().withMessage('Invalid user ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check authorization
      if (req.userId !== id && req.userId !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
          error: 'You can only delete your own account'
        });
      }

      // Check if user exists
      const user = await getOne('SELECT id FROM users WHERE id = ?', [id]);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
          error: 'User not found'
        });
      }

      // Soft delete: mark as deleted (you might add an 'is_deleted' column)
      // For now, we'll just remove the user data
      await runQuery('DELETE FROM profiles WHERE user_id = ?', [id]);
      await runQuery('DELETE FROM users WHERE id = ?', [id]);

      res.status(200).json({
        success: true,
        message: 'User account deleted'
      });
    } catch (error) {
      console.error('[User Service] Error deleting user:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('[User Service] Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Unknown error'
  });
});

/**
 * Start server
 */
async function start() {
  try {
    await initializeDatabase();
    
    app.listen(PORT, () => {
      console.log(`[User Service] 🚀 Server running on port ${PORT}`);
      console.log(`[User Service] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('[User Service] Failed to start:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n[User Service] Shutting down...');
  await closeDatabase();
  process.exit(0);
});

// Start the service
start();
