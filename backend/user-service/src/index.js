/**
 * User Service
 * 
 * Handles user profiles, account information, and profile management.
 */

const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5002;

app.use(express.json());

// TODO: Implement user profile CRUD operations
app.get('/users', (req, res) => {
  res.status(501).json({ message: 'List users - not implemented' });
});

app.get('/users/:id', (req, res) => {
  res.status(501).json({ message: 'Get user - not implemented' });
});

app.put('/users/:id', (req, res) => {
  res.status(501).json({ message: 'Update user - not implemented' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[User Service] listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
