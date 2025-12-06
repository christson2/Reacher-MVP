/**
 * Service Provider Service
 * 
 * Handles professional services listings and management for service providers.
 */

const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5004;

app.use(express.json());

// TODO: Implement service provider CRUD operations
app.get('/services', (req, res) => {
  res.status(501).json({ message: 'Search services - not implemented' });
});

app.post('/services', (req, res) => {
  res.status(501).json({ message: 'Create service - not implemented' });
});

app.get('/services/:id', (req, res) => {
  res.status(501).json({ message: 'Get service - not implemented' });
});

app.put('/services/:id', (req, res) => {
  res.status(501).json({ message: 'Update service - not implemented' });
});

app.delete('/services/:id', (req, res) => {
  res.status(501).json({ message: 'Delete service - not implemented' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[Service Provider Service] listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
