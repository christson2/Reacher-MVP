/**
 * Message Service
 * 
 * Handles in-app messaging between users.
 * Supports real-time messaging via WebSockets.
 */

const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5006;

app.use(express.json());

// TODO: Implement messaging operations
app.post('/messages', (req, res) => {
  res.status(501).json({ message: 'Send message - not implemented' });
});

app.get('/messages/:conversationId', (req, res) => {
  res.status(501).json({ message: 'Get conversation - not implemented' });
});

app.get('/conversations', (req, res) => {
  res.status(501).json({ message: 'List conversations - not implemented' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`[Message Service] listening on http://0.0.0.0:${PORT}`);
});

module.exports = app;
