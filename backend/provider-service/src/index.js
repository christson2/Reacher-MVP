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

if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => console.log(`[Provider] listening on http://0.0.0.0:${PORT}`));
}

module.exports = app;
