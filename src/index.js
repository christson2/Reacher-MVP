/**
 * Reacher API Gateway
 * 
 * Central entry point for all API requests.
 * Validates JWT tokens, routes requests to appropriate services,
 * and handles cross-cutting concerns (logging, rate limiting, etc.)
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const redis = require('redis');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis client for token blacklist
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

redisClient.on('error', (err) => console.error('Redis error:', err));
redisClient.connect();

/**
 * Middleware: JWT Validation
 * Validates token and attaches user context to request
 */
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user to request context
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Public routes (no auth required)
 */
app.post('/api/auth/signup', (req, res) => {
  res.status(501).json({ error: 'Auth service not implemented. Route to auth-service.' });
});

app.post('/api/auth/login', (req, res) => {
  res.status(501).json({ error: 'Auth service not implemented. Route to auth-service.' });
});

/**
 * Protected routes (require valid JWT)
 */
app.use('/api/users', verifyToken);
app.get('/api/users', (req, res) => {
  res.status(501).json({ error: 'User service not implemented. Route to user-service.' });
});

app.use('/api/products', verifyToken);
app.get('/api/products', (req, res) => {
  res.status(501).json({ error: 'Product service not implemented. Route to product-service.' });
});

app.use('/api/services', verifyToken);
app.get('/api/services', (req, res) => {
  res.status(501).json({ error: 'Service provider service not implemented. Route to service-provider-service.' });
});

app.use('/api/messages', verifyToken);
app.get('/api/messages', (req, res) => {
  res.status(501).json({ error: 'Message service not implemented. Route to message-service.' });
});

app.use('/api/trust', verifyToken);
app.get('/api/trust', (req, res) => {
  res.status(501).json({ error: 'Trust service not implemented. Route to trust-service.' });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Gateway] listening on http://0.0.0.0:${PORT}`);
  console.log(`[Gateway] JWT_SECRET=${JWT_SECRET ? 'set' : 'not set'}`);
  console.log(`[Gateway] NODE_ENV=${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
