const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const categorizer = require('./categorizer');
const fs = require('fs');
const path = require('path');
const ranking = require('./services/ranking');
const trustSvc = require('./services/trust');
const market = require('./services/market');
// marketplace modules use db directly

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(bodyParser.json());

// initialize DB
fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
db.init();

// Simple auth middleware: prefer x-user-id (gateway sets it); fallback to dev token
function requireAuth(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (userId) {
    req.userId = userId;
    return next();
  }
  const auth = req.headers.authorization || '';
  if (auth === 'Bearer dev-token') {
    req.userId = 'dev-user';
    return next();
  }
  return res.status(401).json({ success: false, error: 'Authentication required' });
}

// Helpers
function now() { return new Date().toISOString(); }

// Routes
// Service Categories
app.get('/api/service-categories', requireAuth, (req, res) => {
  const parent_id = req.query.parent_id || null;
  const rows = db.getCategories(parent_id);
  res.json({ success: true, data: rows });
});

// Provider Profile
app.post('/api/provider/profile', requireAuth, (req, res) => {
  const payload = req.body || {};
  const user_id = req.userId;
  // Validate required fields
  const required = ['provider_type', 'display_name', 'location_country'];
  for (const f of required) if (!payload[f]) return res.status(400).json({ success: false, error: `${f} is required` });

  // Ensure one profile per user
  const existing = db.getProviderByUserId(user_id);
  if (existing) return res.status(409).json({ success: false, error: 'Provider profile already exists for user' });

  const id = uuidv4();
  const profile = {
    id,
    user_id,
    provider_type: payload.provider_type,
    display_name: payload.display_name,
    bio: payload.bio || null,
    profile_image_url: payload.profile_image_url || null,
    location_country: payload.location_country,
    location_state: payload.location_state || null,
    location_city: payload.location_city || null,
    is_verified: false,
    verification_level: 'none',
    is_active: payload.is_active === false ? false : true,
    created_at: now()
  };
  db.insertProvider(profile);

  if (payload.provider_type === 'trainer' && payload.trainer_profile) {
    const t = payload.trainer_profile;
    db.insertTrainer({ provider_id: id, teaching_mode: t.teaching_mode || 'online', target_audience: t.target_audience || [], experience_level: t.experience_level || 'beginner' });
  }
  if (payload.provider_type === 'agency' && payload.agency_profile) {
    const a = payload.agency_profile;
    db.insertAgency({ provider_id: id, agency_size: a.agency_size || 'small', registered_business_name: a.registered_business_name || null, team_size: a.team_size || null });
  }

  const created = db.getProviderById(id);
  // If address provided, save it (raw first, then best-effort parse)
  if (payload.address && payload.address.raw_address) {
    try {
      const addr = db.insertAddress({ provider_id: id, raw_address: payload.address.raw_address });
      created.addresses = db.getAddressesByProviderId(id);
    } catch (e) {
      // parsing or write failure should not block profile creation
    }
  }
  res.status(201).json({ success: true, data: created });
});

app.get('/api/provider/profile/me', requireAuth, (req, res) => {
  const user_id = req.userId;
  const profile = db.getProviderByUserId(user_id);
  if (!profile) return res.status(404).json({ success: false, error: 'Profile not found' });
  // attach extensions
  if (profile.provider_type === 'trainer') {
    const tp = db.getTrainerByProviderId(profile.id);
    profile.trainer_profile = tp || null;
  }
  if (profile.provider_type === 'agency') {
    const ap = db.getAgencyByProviderId(profile.id);
    profile.agency_profile = ap || null;
  }
  // attach addresses if any
  try { profile.addresses = db.getAddressesByProviderId(profile.id); } catch (e) { profile.addresses = []; }
  res.json({ success: true, data: profile });
});

// Services
app.post('/api/provider/services', requireAuth, (req, res) => {
  const payload = req.body || {};
  const user_id = req.userId;
  const profile = db.getProviderByUserId(user_id);
  if (!profile) return res.status(400).json({ success: false, error: 'Provider profile required' });
  if (profile.is_active === false && payload.is_active) return res.status(400).json({ success: false, error: 'Inactive providers cannot have active services' });
  // Support extended ServiceOffering fields per domain spec
  const reqFields = ['category_id', 'service_mode', 'coverage_scope', 'pricing_model'];
  for (const f of reqFields) if (!payload[f]) return res.status(400).json({ success: false, error: `${f} is required` });

  // category must exist
  const cat = db.getCategoryById(payload.category_id);
  if (!cat) return res.status(400).json({ success: false, error: 'Invalid category' });

  const id = uuidv4();

  // If is_primary true, clear other primary services for this provider
  if (payload.is_primary) {
    db.clearPrimary(profile.id);
  } else {
    // If provider has no primary yet, make this primary by default
    const hasPrimary = db.hasPrimaryService(profile.id);
    if (!hasPrimary) payload.is_primary = 1;
  }

  // Basic deterministic normalization / tagging (best-effort, replaceable by AI later)
  function normalizeInput(raw, input_type, role) {
    if (!raw && role) return role.toLowerCase();
    if (!raw) return role ? role.toLowerCase() : null;
    const text = raw.toString().trim();
    // heuristic: take first two words as normalized name
    const tokens = text.split(/\s+/).filter(Boolean);
    const norm = tokens.slice(0,2).join(' ').toLowerCase();
    // extract simple tags: unique words longer than 3 chars
    const tags = Array.from(new Set(tokens.filter(t => t.length>3).map(t => t.toLowerCase()))).slice(0,10);
    return { normalized: role ? role.toLowerCase() : norm, tags };
  }

  const norm = normalizeInput(payload.raw_service_input || payload.service_name || payload.service_role_or_name || '', payload.input_type || 'text', payload.service_role_or_name);

  const svc = {
    id,
    provider_id: profile.id,
    category_id: payload.category_id,
    subcategory_id: payload.subcategory_id || null,
    service_name: payload.service_name || payload.service_role_or_name || null,
    service_description: payload.description || payload.service_description || null,
    raw_service_input: payload.raw_service_input || null,
    input_type: payload.input_type || 'text',
    service_role_or_name: payload.service_role_or_name || null,
    normalized_service_name: norm && norm.normalized ? norm.normalized : null,
    category_path: payload.category_path || null,
    tags: (payload.tags && Array.isArray(payload.tags)) ? payload.tags : (norm && norm.tags ? norm.tags : []),
    service_mode: payload.service_mode,
    coverage_scope: payload.coverage_scope,
    pricing_model: payload.pricing_model,
    is_primary: payload.is_primary ? true : false,
    is_active: payload.is_active === false ? false : true,
    created_at: now()
  };
  // Add suggested categorization (non-authoritative, pluggable)
  try {
    const cats = db.getCategories(null); // all top-level; categorizer will inspect names/parents
    const suggestion = categorizer.categorize((svc.normalized_service_name || svc.service_name || '' ) + ' ' + (svc.service_description || ''), cats.concat(db.getCategories(null)) );
    if (suggestion && suggestion.suggested_category_id) {
      svc.suggested_category_id = suggestion.suggested_category_id;
      svc.suggested_category_path = suggestion.category_path;
    }
  } catch (e) {}

  db.insertService(svc);

  const created = db.getServiceById(id);
  res.status(201).json({ success: true, data: created });
});

app.put('/api/provider/services/:id', requireAuth, (req, res) => {
  const payload = req.body || {};
  const user_id = req.userId;
  const svcId = req.params.id;
  const profile = db.getProviderByUserId(user_id);
  if (!profile) return res.status(400).json({ success: false, error: 'Provider profile required' });
  const svc = db.getServiceById(svcId);
  if (!svc) return res.status(404).json({ success: false, error: 'Service not found' });
  if (svc.provider_id !== profile.id) return res.status(403).json({ success: false, error: 'Not allowed' });
  // Prevent active services for inactive providers
  if (profile.is_active === false && (payload.is_active === true || svc.is_active === true)) return res.status(400).json({ success: false, error: 'Inactive providers cannot have active services' });

  // Validate category if provided
  if (payload.category_id) {
    const cat = db.getCategoryById(payload.category_id);
    if (!cat) return res.status(400).json({ success: false, error: 'Invalid category' });
  }

  // Handle primary flag
  if (payload.is_primary) {
    db.clearPrimary(profile.id);
  }

  // Build update object
  const up = {};
  for (const key of ['category_id','subcategory_id','service_name','service_description','service_mode','coverage_scope','pricing_model']) {
    if (payload[key] !== undefined) up[key] = payload[key];
  }
  if (payload.is_primary !== undefined) up.is_primary = payload.is_primary ? true : false;
  if (payload.is_active !== undefined) up.is_active = payload.is_active ? true : false;
  if (Object.keys(up).length === 0) return res.status(400).json({ success: false, error: 'Nothing to update' });

  db.updateService(svcId, up);
  const updated = db.getServiceById(svcId);
  res.json({ success: true, data: updated });
});

app.get('/api/provider/services/me', requireAuth, (req, res) => {
  const user_id = req.userId;
  const profile = db.getProviderByUserId(user_id);
  if (!profile) return res.status(200).json({ success: true, data: [] });
  const rows = db.getServicesByProviderId(profile.id);
  res.json({ success: true, data: rows });
});

// Discovery
app.get('/api/services/search', requireAuth, (req, res) => {
  const q = req.query.q || null;
  const category_id = req.query.category_id || null;
  const service_mode = req.query.service_mode || null;
  const coverage_scope = req.query.coverage_scope || null;

  // Location precedence: explicit query params > authenticated user's provider profile > headers fallback
  const explicitLoc = (req.query.location_city || req.query.location_state || req.query.location_country) ? true : false;
  const loc = {};
  if (req.query.location_country) loc.country = req.query.location_country;
  if (req.query.location_state) loc.state = req.query.location_state;
  if (req.query.location_city) loc.city = req.query.location_city;

  if (!explicitLoc) {
    // try to derive from authenticated user's provider profile
    const userProv = db.getProviderByUserId(req.userId);
    if (userProv) {
      loc.country = userProv.location_country || loc.country;
      loc.state = userProv.location_state || loc.state;
      loc.city = userProv.location_city || loc.city;
    } else {
      // fallback to headers if present (optional)
      if (req.headers['x-user-country']) loc.country = req.headers['x-user-country'];
      if (req.headers['x-user-state']) loc.state = req.headers['x-user-state'];
      if (req.headers['x-user-city']) loc.city = req.headers['x-user-city'];
    }
  }

  // Enforce mandatory filters: keywords OR category (or subcategory)
  if (!q && !category_id && !req.query.subcategory_id) {
    return res.status(400).json({ success: false, error: 'Search requires at least keywords or category/subcategory' });
  }

  const rows = db.searchServices({ q, category_id, service_mode, coverage_scope, location: loc, explicitLocation: explicitLoc });
  // Enhance results with explainable scores: trust, distance estimate, price/market, final_score
  try {
    const enhanced = rows.map(r => {
      const svc = r;
      const provider = svc.provider || db.getProviderById(svc.provider_id) || {};

      // Estimate distance (simple heuristic)
      function estimateDistanceKm(p, loc) {
        if (!p || !loc) return null;
        if (p.location_city && loc.city && p.location_city.toLowerCase() === loc.city.toLowerCase()) return 1;
        if (p.location_state && loc.state && p.location_state.toLowerCase() === loc.state.toLowerCase()) return 20;
        if (p.location_country && loc.country && p.location_country.toLowerCase() === loc.country.toLowerCase()) return 200;
        return 1000;
      }

      const distance_km = estimateDistanceKm(provider, loc);

      // Derive simple relevance: presence of query gives medium relevance
      const relevance_score = q ? 0.6 : 0.3;

      // Availability: default optimistic (can be replaced by real calendar/slot data)
      const availability_score = 0.8;

      // Try to extract a numeric price from service settings (best-effort)
      let price = null;
      try {
        const settings = db.getSettingsByServiceId(svc.id) || [];
        for (const s of settings) {
          const key = (s.key || '').toLowerCase();
          if (/(price|rate|amount|fee)/.test(key)) {
            const v = parseFloat(s.value);
            if (!isNaN(v)) { price = v; break; }
          }
        }
      } catch (e) {}

      // Compute a local market average fallback (best-effort using this service price)
      let marketAgg = null;
      try { if (price !== null) marketAgg = market.aggregatePrices([price]); } catch (e) { marketAgg = null; }

      // Compute trust using available provider fields; stats/reviews not available here (could be extended)
      const trustRes = trustSvc.computeTrustScore(provider, {});

      const final = ranking.computeFinalScore({ distance_km, relevance_score, trust_score: trustRes.trust_score, price, marketAvg: marketAgg ? marketAgg.avg_price : null, availability_score });

      return { ...svc, provider, distance_km, price, market: marketAgg, trust: trustRes, final_score: final.final_score, score_components: final.components };
    });

    // sort by final_score if present
    enhanced.sort((a,b) => (b.final_score || 0) - (a.final_score || 0));
    return res.json({ success: true, data: enhanced });
  } catch (e) {
    return res.json({ success: true, data: rows });
  }
});

// Addresses endpoints
app.post('/api/provider/addresses', requireAuth, (req, res) => {
  const payload = req.body || {};
  const user_id = req.userId;
  const profile = db.getProviderByUserId(user_id);
  if (!profile) return res.status(400).json({ success: false, error: 'Provider profile required' });
  if (!payload.raw_address) return res.status(400).json({ success: false, error: 'raw_address is required' });
  const addr = db.insertAddress({ provider_id: profile.id, raw_address: payload.raw_address });
  res.status(201).json({ success: true, data: addr });
});

app.put('/api/provider/addresses/:id', requireAuth, (req, res) => {
  const payload = req.body || {};
  const user_id = req.userId;
  const profile = db.getProviderByUserId(user_id);
  if (!profile) return res.status(400).json({ success: false, error: 'Provider profile required' });
  const id = req.params.id;
  const addr = db.getAddressesByProviderId(profile.id).find(a => a.id === id);
  if (!addr) return res.status(404).json({ success: false, error: 'Address not found' });
  const up = {};
  for (const k of ['raw_address','premise','street','community','area','district','city','state','country','latitude','longitude']) if (payload[k] !== undefined) up[k] = payload[k];
  const updated = db.updateAddress(id, up);
  res.json({ success: true, data: updated });
});

// Service settings endpoints (key/value)
app.post('/api/provider/services/:id/settings', requireAuth, (req, res) => {
  const payload = req.body || {};
  const user_id = req.userId;
  const profile = db.getProviderByUserId(user_id);
  if (!profile) return res.status(400).json({ success: false, error: 'Provider profile required' });
  const svc = db.getServiceById(req.params.id);
  if (!svc) return res.status(404).json({ success: false, error: 'Service not found' });
  if (svc.provider_id !== profile.id) return res.status(403).json({ success: false, error: 'Not allowed' });
  if (!payload.key) return res.status(400).json({ success: false, error: 'key is required' });
  const setting = db.insertServiceSetting({ service_id: svc.id, key: payload.key, value: payload.value || '' });
  res.status(201).json({ success: true, data: setting });
});

app.get('/api/provider/services/:id/settings', requireAuth, (req, res) => {
  const user_id = req.userId;
  const profile = db.getProviderByUserId(user_id);
  if (!profile) return res.status(400).json({ success: false, error: 'Provider profile required' });
  const svc = db.getServiceById(req.params.id);
  if (!svc) return res.status(404).json({ success: false, error: 'Service not found' });
  if (svc.provider_id !== profile.id) return res.status(403).json({ success: false, error: 'Not allowed' });
  const settings = db.getSettingsByServiceId(svc.id);
  res.json({ success: true, data: settings });
});

app.get('/health', (req, res) => res.json({ status: 'ok', service: 'provider' }));

// Serve API docs and OpenAPI spec
app.get('/docs/openapi.yaml', (req, res) => {
  try {
    const p = path.join(__dirname, '..', 'docs', 'openapi.yaml');
    if (!fs.existsSync(p)) return res.status(404).send('OpenAPI spec not found');
    const src = fs.readFileSync(p, 'utf8');
    res.type('yaml').send(src);
  } catch (e) {
    res.status(500).send('error');
  }
});

app.get('/docs', (req, res) => {
  try {
    const p = path.join(__dirname, '..', 'docs', 'API.md');
    if (!fs.existsSync(p)) return res.status(404).send('API docs not found');
    const src = fs.readFileSync(p, 'utf8');
    res.type('text').send(src);
  } catch (e) {
    res.status(500).send('error');
  }
});

// --- Payments & Escrow ---
app.post('/api/payments', requireAuth, (req, res) => {
  const payload = req.body || {};
  if (!payload.payee_id || !payload.amount) return res.status(400).json({ success: false, error: 'payee_id and amount required' });
  const payer_id = req.userId;
  const payment = db.insertPayment({ payer_id, payee_id: payload.payee_id, amount: payload.amount, currency: payload.currency, payment_mode: payload.payment_mode || 'direct', status: 'pending' });
  let escrow = null;
  if (payment.payment_mode === 'escrow') {
    // create escrow record linked to payment
    escrow = db.insertEscrow({ payment_id: payment.id, release_condition: payload.release_condition || 'job_completed', status: 'held' });
  }
  res.status(201).json({ success: true, data: { payment, escrow } });
});

app.get('/api/payments/:id', requireAuth, (req, res) => {
  const p = db.getPaymentById(req.params.id);
  if (!p) return res.status(404).json({ success: false, error: 'payment not found' });
  res.json({ success: true, data: p });
});

app.post('/api/escrows/:id/release', requireAuth, (req, res) => {
  const id = req.params.id;
  const esc = db.getEscrowById(id);
  if (!esc) return res.status(404).json({ success: false, error: 'escrow not found' });
  const payload = req.body || {};
  // Only allow release if condition satisfied
  if (esc.release_condition === 'job_completed') {
    if (!payload.job_completed) return res.status(400).json({ success: false, error: 'job must be completed to release escrow' });
  }
  // Manual release allowed for trusted operators (dev-token) — simple check
  if (payload.force_release && req.headers.authorization !== 'Bearer dev-token') return res.status(403).json({ success: false, error: 'not allowed' });
  const now = new Date().toISOString();
  const updated = db.updateEscrow(id, { status: 'released', released_at: now });
  // update payment status if present
  const payment = db.getPaymentById(esc.payment_id);
  if (payment) db.insertPayment({ ...payment, status: 'released' });
  res.json({ success: true, data: updated });
});

// --- Jobs marketplace ---
app.post('/api/jobs', requireAuth, (req, res) => {
  const payload = req.body || {};
  if (!payload.title) return res.status(400).json({ success: false, error: 'title required' });
  const posted_by = req.userId;
  const job = db.insertJob({ title: payload.title, description: payload.description, category_path: payload.category_path, job_type: payload.job_type, location_scope: payload.location_scope, salary_range: payload.salary_range, posted_by });
  res.status(201).json({ success: true, data: job });
});

app.post('/api/jobs/:id/apply', requireAuth, (req, res) => {
  const job = db.getJobById(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'job not found' });
  const applicant_id = req.userId;
  const appRec = db.insertJobApplication({ job_id: job.id, applicant_id, message: (req.body||{}).message });
  res.status(201).json({ success: true, data: appRec });
});

app.get('/api/jobs/:id/applications', requireAuth, (req, res) => {
  const job = db.getJobById(req.params.id);
  if (!job) return res.status(404).json({ success: false, error: 'job not found' });
  if (job.posted_by !== req.userId) return res.status(403).json({ success: false, error: 'not allowed' });
  const apps = db.getApplicationsByJobId(job.id);
  res.json({ success: true, data: apps });
});

// --- Digital products ---
app.post('/api/digital', requireAuth, (req, res) => {
  const payload = req.body || {};
  if (!payload.title) return res.status(400).json({ success: false, error: 'title required' });
  const creator_id = req.userId;
  const p = db.insertDigitalProduct({ creator_id, title: payload.title, description: payload.description, category_path: payload.category_path, price: payload.price, access_type: payload.access_type });
  res.status(201).json({ success: true, data: p });
});

app.post('/api/digital/:id/purchase', requireAuth, (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'product not found' });
  const buyer_id = req.userId;
  const pur = db.insertPurchase({ product_id: product.id, buyer_id, amount: product.price, currency: 'USD' });
  res.status(201).json({ success: true, data: pur });
});

app.get('/api/digital/:id/access', requireAuth, (req, res) => {
  const product = db.getProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, error: 'product not found' });
  const has = db.hasAccessToProduct(product.id, req.userId);
  res.json({ success: true, data: { access: !!has } });
});

// --- Subscriptions ---
app.post('/api/subscription/plans', requireAuth, (req, res) => {
  const payload = req.body || {};
  if (!payload.name) return res.status(400).json({ success: false, error: 'name required' });
  const plan = db.insertSubscriptionPlan({ name: payload.name, benefits: payload.benefits || [], price: payload.price || 0, billing_cycle: payload.billing_cycle || 'monthly' });
  res.status(201).json({ success: true, data: plan });
});

app.post('/api/provider/subscriptions', requireAuth, (req, res) => {
  const profile = db.getProviderByUserId(req.userId);
  if (!profile) return res.status(400).json({ success: false, error: 'provider profile required' });
  const plan = db.getSubscriptionPlanById((req.body||{}).plan_id);
  if (!plan) return res.status(400).json({ success: false, error: 'invalid plan' });
  const sub = db.subscribeProvider({ provider_id: profile.id, plan_id: plan.id });
  res.status(201).json({ success: true, data: sub });
});

app.get('/api/provider/subscriptions/me', requireAuth, (req, res) => {
  const profile = db.getProviderByUserId(req.userId);
  if (!profile) return res.status(200).json({ success: true, data: null });
  const s = db.getProviderSubscription(profile.id);
  res.json({ success: true, data: s || null });
});

// --- Recommendations (explainable, rule-based) ---
app.get('/api/recommendations', requireAuth, (req, res) => {
  const q = req.query.q || null;
  const category_id = req.query.category_id || null;
  // start with service recommendations
  const services = db.searchServices({ q, category_id, location: {}, explicitLocation: false }) || [];
  let servicesList = services;
  if (!servicesList || servicesList.length === 0) servicesList = db.getAllServices() || [];
  const recs = [];
  for (const s of servicesList.slice(0,10)) {
    const provider = db.getProviderById(s.provider_id) || {};
    const reasons = [];
    let confidence = 0.5;
    if (provider.verification_level === 'trusted') { reasons.push('trusted'); confidence += 0.2; }
    if (s.tags && s.tags.length) { reasons.push('matches_tags'); confidence += 0.1; }
    // affordability
    const settings = db.getSettingsByServiceId(s.id) || [];
    const priceSetting = settings.find(x => /(price|rate|amount|fee)/i.test(x.key));
    if (priceSetting) {
      const v = parseFloat(priceSetting.value);
      if (!isNaN(v)) { reasons.push('price_available'); confidence += 0.05; }
    }
    recs.push({ target_id: s.id, target_type: 'service', reason_codes: reasons, confidence_score: Math.max(0, Math.min(1, confidence)) });
  }
  res.json({ success: true, data: recs });
});

// --- Requests & Quotes (request-driven marketplace) ---
app.post('/api/requests', requireAuth, (req, res) => {
  const payload = req.body || {};
  if (!payload.title) return res.status(400).json({ success: false, error: 'title required' });
  const userId = req.userId;
  const r = db.insertRequest({ title: payload.title, description: payload.description, category_path: payload.category_path, location: payload.location, budget_min: payload.budget_min, budget_max: payload.budget_max, posted_by: userId });
  res.status(201).json({ success: true, data: r });
});

app.get('/api/requests', requireAuth, (req, res) => {
  const q = req.query || {};
  const rows = db.searchRequests({ category_path: q.category_path, location: q.location, budget_min: q.budget_min, budget_max: q.budget_max });
  res.json({ success: true, data: rows });
});

app.get('/api/requests/:id', requireAuth, (req, res) => {
  const r = db.getRequestById(req.params.id);
  if (!r) return res.status(404).json({ success: false, error: 'request not found' });
  const quotes = db.getQuotesByRequestId(r.id);
  res.json({ success: true, data: { request: r, quotes } });
});

// Providers submit a single quote per request. Enforce per-provider limit by subscription/frequency.
app.post('/api/requests/:id/quotes', requireAuth, (req, res) => {
  const payload = req.body || {};
  const requestId = req.params.id;
  const reqRec = db.getRequestById(requestId);
  if (!reqRec) return res.status(404).json({ success: false, error: 'request not found' });
  const provider = db.getProviderByUserId(req.userId);
  if (!provider) return res.status(400).json({ success: false, error: 'provider profile required to quote' });

  // Rate-limit: subscription-based or free tier
  const quotesInWindow = db.countQuotesByProviderInWindow(provider.id, 7);
  const plan = db.getProviderSubscription(provider.id);
  const freeLimit = 5; const paidLimit = 1000;
  const allowed = plan ? paidLimit : freeLimit;
  if (quotesInWindow >= allowed) return res.status(429).json({ success: false, error: 'quote limit reached for your plan' });

  // prevent duplicate quote by same provider for same request
  const existing = db.getQuotesByRequestId(requestId).find(q => q.provider_id === provider.id);
  if (existing) return res.status(409).json({ success: false, error: 'already quoted' });

  const quote = db.insertQuote({ request_id: requestId, provider_id: provider.id, amount: payload.amount, message: payload.message });
  res.status(201).json({ success: true, data: quote });
});

// Request owner accepts a quote -> create payment and optional escrow, update statuses
app.post('/api/requests/:id/accept-quote', requireAuth, (req, res) => {
  const payload = req.body || {};
  const requestId = req.params.id;
  const quoteId = payload.quote_id;
  if (!quoteId) return res.status(400).json({ success: false, error: 'quote_id required' });
  const reqRec = db.getRequestById(requestId);
  if (!reqRec) return res.status(404).json({ success: false, error: 'request not found' });
  if (reqRec.posted_by !== req.userId) return res.status(403).json({ success: false, error: 'not allowed' });
  const quote = db.getQuoteById(quoteId);
  if (!quote || quote.request_id !== requestId) return res.status(404).json({ success: false, error: 'quote not found' });

  // create payment record; if escrow requested, create escrow
  const payment_mode = payload.payment_mode || 'escrow';
  const payment = db.insertPayment({ payer_id: req.userId, payee_id: quote.provider_id, amount: quote.amount, currency: payload.currency || 'USD', payment_mode, status: 'pending' });
  let escrow = null;
  if (payment.payment_mode === 'escrow') {
    escrow = db.insertEscrow({ payment_id: payment.id, release_condition: 'job_completed', status: 'held' });
  }

  // update request and quote statuses
  db.updateRequest(requestId, { status: 'assigned', assigned_quote_id: quote.id, assigned_provider_id: quote.provider_id });
  db.updateQuote(quote.id, { status: 'accepted' });

  res.json({ success: true, data: { payment, escrow, request: db.getRequestById(requestId), quote: db.getQuoteById(quote.id) } });
});

// --- Consumer endpoints ---
app.post('/api/consumer/profile', requireAuth, (req, res) => {
  const payload = req.body || {};
  const user_id = req.userId;
  if (!payload.full_name || !payload.location_country) return res.status(400).json({ success: false, error: 'full_name and location_country required' });
  // reuse provider_profiles for consumer records (lightweight)
  const id = require('uuid').v4();
  const profile = { id, user_id, provider_type: 'consumer', display_name: payload.full_name, phone: payload.phone || null, location_country: payload.location_country, location_state: payload.location_state || null, location_city: payload.location_city || null, profile_photo: payload.profile_photo || null, created_at: new Date().toISOString() };
  db.insertProvider(profile);
  res.status(201).json({ success: true, data: db.getProviderById(id) });
});

app.get('/api/consumer/requests/me', requireAuth, (req, res) => {
  const rows = db.getRequestsByUser(req.userId);
  res.json({ success: true, data: rows });
});

// --- Provider nearby requests ---
app.get('/api/provider/requests/nearby', requireAuth, (req, res) => {
  const provider = db.getProviderByUserId(req.userId);
  if (!provider) return res.status(400).json({ success: false, error: 'provider profile required' });
  // find primary service or any
  const services = db.getServicesByProviderId(provider.id) || [];
  const primary = services.find(s => s.is_primary) || services[0] || null;
  // determine radius from settings or default 5km
  let radiusKm = 5;
  try {
    if (primary) {
      const settings = db.getSettingsByServiceId(primary.id) || [];
      const rset = settings.find(s => (s.key||'').toLowerCase() === 'service_radius');
      if (rset) {
        const rv = parseFloat(rset.value);
        if (!isNaN(rv)) radiusKm = rv;
      }
    }
  } catch (e) {}

  const all = db.searchRequests({});
  const matches = [];
  for (const r of all) {
    // heuristic distance: match city/state/country
    let dist = 1000;
    if (r.location && provider.location_city && r.location.city && provider.location_city.toLowerCase() === r.location.city.toLowerCase()) dist = 1;
    else if (r.location && provider.location_state && r.location.state && provider.location_state && provider.location_state.toLowerCase() === r.location.state.toLowerCase()) dist = 20;
    else if (r.location && provider.location_country && r.location.country && provider.location_country && provider.location_country.toLowerCase() === r.location.country.toLowerCase()) dist = 200;
    if (dist <= radiusKm) matches.push({ ...r, distance_km: dist });
  }
  // sort by distance then by created_at
  matches.sort((a,b) => (a.distance_km - b.distance_km) || (new Date(b.created_at) - new Date(a.created_at)));
  res.json({ success: true, data: matches });
});

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`[Provider] listening on http://0.0.0.0:${PORT}`));
}

module.exports = app;
