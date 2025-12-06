/**
 * Notification Service
 * 
 * Handles push notifications, email alerts, and SMS notifications.
 */

const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5007;

app.use(express.json());

// TODO: Implement notification operations
app.post('/notifications', (req, res) => {
  res.status(501).json({ message: 'Send notification - not implemented' });
});

app.get('/notifications/:userId', (req, res) => {
  res.status(501).json({ message: 'Get notifications - not implemented' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[Notification Service] listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
