const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(bodyParser.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Accept both prefixed and rewritten routes so gateway and direct calls both work
function handleSignup(req, res) {
  const { email } = req.body || {};
  console.log('[Auth] Signup request for', email || '<no-email>');
  // return a fake token for development
  return res.json({ token: 'dev-token', user: { email: email || 'dev@local' } });
}

function handleLogin(req, res) {
  const { email } = req.body || {};
  console.log('[Auth] Login request for', email || '<no-email>');
  return res.json({ token: 'dev-token', user: { email: email || 'dev@local' } });
}

// Routes used when gateway rewrites /api/auth/* -> /*
app.post('/signup', handleSignup);
app.post('/login', handleLogin);

// Keep original prefixed routes for direct calls and tests
app.post('/api/auth/signup', handleSignup);
app.post('/api/auth/login', handleLogin);

app.listen(port, '0.0.0.0', () => {
  console.log(`[Auth Service] listening on http://0.0.0.0:${port}`);
});
