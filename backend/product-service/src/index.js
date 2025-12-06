/**
 * Product Service
 * 
 * Handles product listings, search, and product management for sellers.
 */

const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());

// TODO: Implement product CRUD operations
app.get('/products', (req, res) => {
  res.status(501).json({ message: 'Search products - not implemented' });
});

app.post('/products', (req, res) => {
  res.status(501).json({ message: 'Create product - not implemented' });
});

app.get('/products/:id', (req, res) => {
  res.status(501).json({ message: 'Get product - not implemented' });
});

app.put('/products/:id', (req, res) => {
  res.status(501).json({ message: 'Update product - not implemented' });
});

app.delete('/products/:id', (req, res) => {
  res.status(501).json({ message: 'Delete product - not implemented' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[Product Service] listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
