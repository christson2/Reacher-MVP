/**
 * Product Service
 * 
 * Manages product listings, search, and product management for sellers.
 * Endpoints:
 *   GET    /products              - List/search products
 *   GET    /products/:id          - Get product detail
 *   POST   /products              - Create product (seller only)
 *   PUT    /products/:id          - Update product (seller only)
 *   DELETE /products/:id          - Delete product (seller only)
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { body, param, query, validationResult } = require('express-validator');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { initializeDatabase, runQuery, getOne, getAll, closeDatabase } = require('./db');

const app = express();
const PORT = process.env.PORT || 5003;

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
  res.status(200).json({ status: 'ok', service: 'product-service' });
});

/**
 * GET /products
 * List/search products with filtering and pagination
 * Query params: search, category, min_price, max_price, sort, limit, offset
 */
app.get(
  '/products',
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Invalid limit'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Invalid offset'),
  query('min_price').optional().isFloat({ min: 0 }).withMessage('Invalid min_price'),
  query('max_price').optional().isFloat({ min: 0 }).withMessage('Invalid max_price'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = Math.min(parseInt(req.query.limit) || 20, 100);
      const offset = parseInt(req.query.offset) || 0;
      const search = req.query.search || '';
      const category = req.query.category || '';
      const minPrice = parseFloat(req.query.min_price) || 0;
      const maxPrice = parseFloat(req.query.max_price) || Infinity;
      const sort = req.query.sort || 'created_at';

      // Build query
      let whereClause = 'WHERE is_active = 1';
      const params = [];

      if (search) {
        whereClause += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      if (category) {
        whereClause += ' AND category = ?';
        params.push(category);
      }

      whereClause += ' AND price >= ? AND price <= ?';
      params.push(minPrice, maxPrice);

      // Validate sort option
      const validSorts = ['created_at', 'price', 'rating'];
      const sortField = validSorts.includes(sort) ? sort : 'created_at';

      params.push(limit, offset);

      const products = await getAll(
        `SELECT id, seller_id, title, description, category, price, currency, 
                quantity, location, rating, reviews_count, created_at, updated_at 
         FROM products ${whereClause} ORDER BY ${sortField} DESC LIMIT ? OFFSET ?`,
        params
      );

      // Get total count for pagination
      const countParams = params.slice(0, -2);
      const countResult = await getOne(
        `SELECT COUNT(*) as count FROM products ${whereClause.replace(/LIMIT.*OFFSET.*/, '')}`,
        countParams
      );

      res.status(200).json({
        success: true,
        data: {
          products,
          total: countResult.count,
          limit,
          offset,
          search,
          category,
          minPrice,
          maxPrice
        }
      });
    } catch (error) {
      console.error('[Product Service] Error listing products:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * GET /products/:id
 * Get product detail
 */
app.get(
  '/products/:id',
  param('id').isUUID().withMessage('Invalid product ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      const product = await getOne(
        `SELECT * FROM products WHERE id = ?`,
        [id]
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found'
        });
      }

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('[Product Service] Error getting product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * POST /products
 * Create product (seller only)
 */
app.post(
  '/products',
  body('title').notEmpty().withMessage('Title required').trim(),
  body('description').optional().isString().trim(),
  body('category').notEmpty().withMessage('Category required').trim(),
  body('price').isFloat({ min: 0 }).withMessage('Invalid price'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Invalid quantity'),
  body('currency').optional().isString().withMessage('Invalid currency'),
  body('location').optional().isString().trim(),
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check authorization
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required to create products'
        });
      }

      const {
        title,
        description,
        category,
        price,
        quantity = 1,
        currency = 'USD',
        location,
        images
      } = req.body;

      const productId = uuidv4();

      await runQuery(
        `INSERT INTO products (id, seller_id, title, description, category, price, 
                              quantity, currency, location, images)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          req.userId,
          title,
          description || null,
          category,
          price,
          quantity,
          currency,
          location || null,
          images || null
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Product created',
        data: {
          id: productId,
          seller_id: req.userId,
          title,
          description,
          category,
          price,
          quantity,
          currency,
          location
        }
      });
    } catch (error) {
      console.error('[Product Service] Error creating product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * PUT /products/:id
 * Update product (seller only)
 */
app.put(
  '/products/:id',
  param('id').isUUID().withMessage('Invalid product ID'),
  body('title').optional().isString().trim(),
  body('description').optional().isString().trim(),
  body('category').optional().isString().trim(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Invalid price'),
  body('quantity').optional().isInt({ min: 0 }).withMessage('Invalid quantity'),
  body('location').optional().isString().trim(),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check authorization
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required'
        });
      }

      // Check if product exists and belongs to user
      const product = await getOne(
        'SELECT seller_id FROM products WHERE id = ?',
        [id]
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found'
        });
      }

      if (product.seller_id !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
          error: 'You can only update your own products'
        });
      }

      // Build update query
      const updates = [];
      const values = [];

      if (req.body.title !== undefined) {
        updates.push('title = ?');
        values.push(req.body.title);
      }
      if (req.body.description !== undefined) {
        updates.push('description = ?');
        values.push(req.body.description);
      }
      if (req.body.category !== undefined) {
        updates.push('category = ?');
        values.push(req.body.category);
      }
      if (req.body.price !== undefined) {
        updates.push('price = ?');
        values.push(req.body.price);
      }
      if (req.body.quantity !== undefined) {
        updates.push('quantity = ?');
        values.push(req.body.quantity);
      }
      if (req.body.location !== undefined) {
        updates.push('location = ?');
        values.push(req.body.location);
      }

      if (updates.length > 0) {
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);

        const sql = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
        await runQuery(sql, values);
      }

      res.status(200).json({
        success: true,
        message: 'Product updated',
        data: { id, ...req.body }
      });
    } catch (error) {
      console.error('[Product Service] Error updating product:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: error.message
      });
    }
  }
);

/**
 * DELETE /products/:id
 * Delete product (seller only)
 */
app.delete(
  '/products/:id',
  param('id').isUUID().withMessage('Invalid product ID'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id } = req.params;

      // Check authorization
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
          error: 'Authentication required'
        });
      }

      // Check if product exists and belongs to user
      const product = await getOne(
        'SELECT seller_id FROM products WHERE id = ?',
        [id]
      );

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
          error: 'Product not found'
        });
      }

      if (product.seller_id !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized',
          error: 'You can only delete your own products'
        });
      }

      // Soft delete
      await runQuery(
        'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [id]
      );

      res.status(200).json({
        success: true,
        message: 'Product deleted'
      });
    } catch (error) {
      console.error('[Product Service] Error deleting product:', error);
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
  console.error('[Product Service] Error:', err);
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
      console.log(`[Product Service] 🚀 Server running on port ${PORT}`);
      console.log(`[Product Service] Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('[Product Service] Failed to start:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n[Product Service] Shutting down...');
  await closeDatabase();
  process.exit(0);
});

// Start the service
start();
