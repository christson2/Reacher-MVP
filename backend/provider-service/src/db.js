const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'provider.json');

function read() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    const parsed = JSON.parse(raw);
    // ensure all expected collections exist for backward compatibility
    const defaults = {
      provider_profiles: [],
      service_categories: [],
      services: [],
      trainer_profiles: [],
      agency_profiles: [],
      addresses: [],
      service_settings: [],
      payments: [],
      escrows: [],
      jobs: [],
      job_applications: [],
      digital_products: [],
      purchases: [],
      subscription_plans: [],
      provider_subscriptions: []
      ,
      // request-driven marketplace
      requests: [],
      quotes: []
    };
    for (const k of Object.keys(defaults)) if (!Object.prototype.hasOwnProperty.call(parsed, k)) parsed[k] = defaults[k];
    return parsed;
  } catch (e) {
    return {
      provider_profiles: [],
      service_categories: [],
      services: [],
      trainer_profiles: [],
      agency_profiles: [],
      addresses: [],
      service_settings: [],
      // Marketplace / Monetization collections
      payments: [],
      escrows: [],
      jobs: [],
      job_applications: [],
      digital_products: [],
      purchases: [],
      subscription_plans: [],
      provider_subscriptions: []
    };
  }
}

function write(data) {
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2), 'utf8');
}

function init() {
  const dir = path.dirname(FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = read();
  write(data);
}

// Categories
function getCategories(parent_id) {
  const d = read();
  if (parent_id) return d.service_categories.filter(c => c.parent_id === parent_id && c.is_active);
  return d.service_categories.filter(c => c.is_active);
}
function getCategoryById(id) { const d = read(); return d.service_categories.find(c => c.id === id && c.is_active); }
function insertCategory(cat) { const d = read(); d.service_categories.push(cat); write(d); }

// Addresses
function insertAddress(addr) {
  const d = read();
  const now = new Date().toISOString();
  const id = addr.id || uuidv4();
  const record = {
    id,
    provider_id: addr.provider_id || null,
    service_id: addr.service_id || null,
    raw_address: addr.raw_address,
    premise: addr.premise || null,
    street: addr.street || null,
    community: addr.community || null,
    area: addr.area || null,
    district: addr.district || null,
    city: addr.city || null,
    state: addr.state || null,
    country: addr.country || null,
    latitude: addr.latitude || null,
    longitude: addr.longitude || null,
    address_confidence: typeof addr.address_confidence === 'number' ? addr.address_confidence : null,
    created_at: now,
    updated_at: now
  };
  // Save raw first
  d.addresses.push(record);
  write(d);

  // Best-effort deterministic parsing (non-AI)
  try {
    const parsed = parseAddressDeterministic(record.raw_address);
    let confidence = 0;
    for (const k of ['premise','street','community','area','district','city','state','country']) if (parsed[k]) confidence += 10;
    const updated = { ...record, ...parsed, address_confidence: Math.min(100, confidence), updated_at: new Date().toISOString() };
    // replace the saved record
    const nd = read();
    nd.addresses = nd.addresses.map(a => a.id === id ? updated : a);
    write(nd);
    return updated;
  } catch (e) {
    return record;
  }
}

function getAddressesByProviderId(provider_id) { const d = read(); return d.addresses.filter(a => a.provider_id === provider_id); }
function getAddressesByServiceId(service_id) { const d = read(); return d.addresses.filter(a => a.service_id === service_id); }

// Deterministic, rule-based parsing — best-effort only
function parseAddressDeterministic(raw) {
  if (!raw || typeof raw !== 'string') return {};
  const out = {};
  const s = raw.trim();
  // premise: numeric prefix
  const mPremise = s.match(/^\s*(\d+[-\w]*)\b/);
  if (mPremise) out.premise = mPremise[1];

  // street heuristics
  const streetRegex = /\b(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|dr\.?|boulevard|blvd\.?|way)\b/i;
  const communityRegex = /\b(?:estate|quarter|quarters|village|camp|community)\b/i;
  const areaRegex = /\b(?:roundabout|junction|axis|landmark|power line|quarry|near|opposite|beside)\b/i;

  if (streetRegex.test(s)) {
    const seg = s.split(/,|;/).find(part => streetRegex.test(part));
    out.street = seg ? seg.trim() : null;
  }
  if (communityRegex.test(s)) {
    const seg = s.split(/,|;/).find(part => communityRegex.test(part));
    out.community = seg ? seg.trim() : null;
  }
  if (areaRegex.test(s)) {
    const seg = s.split(/,|;/).find(part => areaRegex.test(part));
    out.area = seg ? seg.trim() : null;
  }

  // city/state/country heuristics — look for capitalized tokens at end
  const parts = s.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 1) {
    const last = parts[parts.length - 1];
    // if last contains two words, assume 'State Country' or 'City Country'
    const tokens = last.split(/\s+/);
    if (tokens.length === 1) {
      out.country = tokens[0];
    } else if (tokens.length === 2) {
      out.state = tokens[0];
      out.country = tokens[1];
    } else if (tokens.length >= 3) {
      out.city = tokens.slice(0, tokens.length-2).join(' ');
      out.state = tokens[tokens.length-2];
      out.country = tokens[tokens.length-1];
    }
  }

  // district heuristic: look for tokens containing 'district' or 'suburb' or 'lga'
  const districtRegex = /\b(?:district|suburb|lga|town)\b/i;
  const districtSeg = parts.find(p => districtRegex.test(p));
  if (districtSeg) out.district = districtSeg;

  // normalize empty -> undefined
  for (const k of Object.keys(out)) if (!out[k]) delete out[k];
  return out;
}

// Providers
function getProviderByUserId(user_id) { const d = read(); return d.provider_profiles.find(p => p.user_id === user_id); }
function getProviderById(id) { const d = read(); return d.provider_profiles.find(p => p.id === id); }
function insertProvider(profile) { const d = read(); d.provider_profiles.push(profile); write(d); }

// Trainer/Agency
function insertTrainer(tp) { const d = read(); d.trainer_profiles.push(tp); write(d); }
function insertAgency(ap) { const d = read(); d.agency_profiles.push(ap); write(d); }
function getTrainerByProviderId(id) { const d = read(); return d.trainer_profiles.find(t => t.provider_id === id); }
function getAgencyByProviderId(id) { const d = read(); return d.agency_profiles.find(a => a.provider_id === id); }

// Services
function hasPrimaryService(provider_id) { const d = read(); return d.services.some(s => s.provider_id === provider_id && s.is_primary); }
function clearPrimary(provider_id) { const d = read(); d.services = d.services.map(s => s.provider_id === provider_id ? { ...s, is_primary: false } : s); write(d); }
function insertService(svc) { const d = read(); d.services.push(svc); write(d); }
function getServiceById(id) { const d = read(); return d.services.find(s => s.id === id); }
function updateService(id, fields) { const d = read(); d.services = d.services.map(s => s.id === id ? { ...s, ...fields } : s); write(d); }
function getServicesByProviderId(provider_id) { const d = read(); return d.services.filter(s => s.provider_id === provider_id); }
function getAllServices() { const d = read(); return d.services.filter(s => s.is_active); }
function searchServices({ q, category_id, service_mode, coverage_scope }) {
  // New signature supports location-aware, tiered search.
  // Accepts: { q, category_id, service_mode, coverage_scope, location: { country, state, city }, explicitLocation }
  const opts = arguments[0] || {};
  const qv = opts.q || null;
  const cat = opts.category_id || null;
  const smode = opts.service_mode || null;
  const cov = opts.coverage_scope || null;
  const loc = opts.location || null; // { country, state, city }
  const explicit = !!opts.explicitLocation;

  const data = read();
  const providers = data.provider_profiles || [];
  const provMap = providers.reduce((acc, p) => { acc[p.id] = p; return acc; }, {});
  const categories = data.service_categories || [];

  function collectDescendants(startId) {
    const res = new Set();
    const stack = [startId];
    while (stack.length) {
      const cur = stack.pop();
      res.add(cur);
      for (const c of categories) {
        if (c.parent_id === cur) stack.push(c.id);
      }
    }
    return res;
  }

  // Mandatory filters: service active and provider active
  let rows = data.services.filter(s => s.is_active && provMap[s.provider_id] && provMap[s.provider_id].is_active);

  // Apply simple filters
  if (smode) rows = rows.filter(s => s.service_mode === smode);
  if (cov) rows = rows.filter(s => s.coverage_scope === cov);
  if (cat) rows = rows.filter(s => s.category_id === cat || s.subcategory_id === cat);
  if (qv) {
    const qlow = qv.toLowerCase();
    // find categories whose name matches the query
    const matchedCats = categories.filter(c => (c.name || '').toLowerCase().includes(qlow)).map(c => c.id);
    const matchedCatSet = new Set();
    for (const cid of matchedCats) {
      for (const d of collectDescendants(cid)) matchedCatSet.add(d);
    }
    rows = rows.filter(s => {
      const textMatch = ((s.service_name || '') + ' ' + (s.service_description || '') + ' ' + (s.service_role_or_name || '') + ' ' + (s.normalized_service_name || '')).toLowerCase().includes(qlow);
      const tagMatch = Array.isArray(s.tags) && s.tags.some(t => (t || '').toLowerCase().includes(qlow));
      const catMatch = matchedCatSet.size ? matchedCatSet.has(s.category_id) : false;
      return textMatch || tagMatch || catMatch;
    });
  }

  // If explicit location provided, restrict to that location (city > state > country)
  if (explicit && loc) {
    const matchLevel = loc.city ? 'city' : (loc.state ? 'state' : (loc.country ? 'country' : null));
    if (matchLevel) {
      rows = rows.filter(s => {
        const p = provMap[s.provider_id];
        if (!p) return false;
        if (matchLevel === 'city') return (p.location_city || '').toLowerCase() === (loc.city || '').toLowerCase();
        if (matchLevel === 'state') return (p.location_state || '').toLowerCase() === (loc.state || '').toLowerCase();
        return (p.location_country || '').toLowerCase() === (loc.country || '').toLowerCase();
      });
    }
    // Secondary ranking within explicit scope: simple scoring
    rows.sort((a,b) => {
      const pa = provMap[a.provider_id]; const pb = provMap[b.provider_id];
      const score = s => ((s.service_name||'').length + (s.service_description||'').length);
      return score(b) - score(a);
    });
    return rows;
  }

  // If no location provided at all, we cannot compute local tiers—treat as broad search (Tier 3 only)
  if (!loc || (!loc.country && !loc.state && !loc.city)) {
    // return national/global and remote outside country first (Tier 3)
    const tier3 = rows.filter(s => (s.coverage_scope === 'national' || s.coverage_scope === 'global' || s.service_mode === 'remote'));
    return tier3;
  }

  // Tier classification
  const tier1 = []; const tier2 = []; const tier3 = [];
  for (const s of rows) {
    const p = provMap[s.provider_id];
    if (!p) continue;
    const sameCity = p.location_city && loc.city && p.location_city.toLowerCase() === loc.city.toLowerCase();
    const sameState = p.location_state && loc.state && p.location_state.toLowerCase() === loc.state.toLowerCase();
    const sameCountry = p.location_country && loc.country && p.location_country.toLowerCase() === loc.country.toLowerCase();

    // Tier 1: local physical & hybrid services (same city OR state OR country) AND service_mode in (physical, hybrid)
    if ((sameCity || sameState || sameCountry) && (s.service_mode === 'physical' || s.service_mode === 'hybrid')) {
      tier1.push({ service: s, provider: p });
      continue;
    }

    // Tier 2: local remote services (same country, service_mode=remote, coverage_scope local|national)
    if (sameCountry && s.service_mode === 'remote' && (s.coverage_scope === 'local' || s.coverage_scope === 'national')) {
      tier2.push({ service: s, provider: p });
      continue;
    }

    // Tier 3: national/global services OR fully remote providers outside country
    if ((s.coverage_scope === 'national' || s.coverage_scope === 'global') || (s.service_mode === 'remote' && !sameCountry)) {
      tier3.push({ service: s, provider: p });
      continue;
    }
  }

  // De-duplicate and order with expansion rules
  const threshold = parseInt(process.env.SEARCH_MIN_THRESHOLD || '5', 10);
  let results = [];
  const pushServices = arr => {
    for (const it of arr) {
      if (!results.find(r => r.id === it.service.id)) results.push({ ...it.service, provider: it.provider });
    }
  };

  pushServices(tier1);
  if (results.length < threshold) pushServices(tier2);
  if (results.length < threshold) pushServices(tier3);

  // Secondary ranking within same tier: simple heuristic (keyword/category match + verification)
  const scoreFor = svc => {
    let score = 0;
    if (cat && (svc.category_id === cat || svc.subcategory_id === cat)) score += 30;
    if (qv) {
      const text = ((svc.service_name||'') + ' ' + (svc.service_description||'')).toLowerCase();
      const matches = (text.match(new RegExp(qv.toLowerCase(), 'g')) || []).length;
      score += Math.min(20, matches * 5);
    }
    const ver = (svc.provider && svc.provider.verification_level) || 'none';
    if (ver === 'trusted') score += 10; else if (ver === 'basic') score += 5;
    return score;
  };

  results.sort((a,b) => scoreFor(b) - scoreFor(a));
  return results;
}

// Service settings (extensible key-value)
function insertServiceSetting(setting) { const d = read(); const s = { id: setting.id || uuidv4(), service_id: setting.service_id, key: setting.key, value: setting.value, created_at: new Date().toISOString() }; d.service_settings.push(s); write(d); return s; }
function getSettingsByServiceId(service_id) { const d = read(); return d.service_settings.filter(s => s.service_id === service_id); }
function updateAddress(id, fields) {
  const d = read();
  let updated = null;
  d.addresses = d.addresses.map(a => {
    if (a.id !== id) return a;
    const merged = { ...a, ...fields, updated_at: new Date().toISOString() };
    // if raw_address changed, re-run parser but keep raw preserved
    if (fields.raw_address && fields.raw_address !== a.raw_address) {
      try {
        const parsed = parseAddressDeterministic(fields.raw_address);
        let confidence = 0;
        for (const k of ['premise','street','community','area','district','city','state','country']) if (parsed[k]) confidence += 10;
        Object.assign(merged, parsed);
        merged.address_confidence = Math.min(100, confidence);
      } catch (e) {}
    }
    updated = merged;
    return merged;
  });
  write(d);
  return updated;
}

// Payments & Escrow
function insertPayment(payment) { const d = read(); const now = new Date().toISOString(); const p = { id: payment.id || uuidv4(), payer_id: payment.payer_id, payee_id: payment.payee_id, amount: payment.amount, currency: payment.currency || 'USD', payment_mode: payment.payment_mode || 'direct', status: payment.status || 'pending', created_at: now }; d.payments.push(p); write(d); return p; }
function getPaymentById(id) { const d = read(); return d.payments.find(p => p.id === id); }

function insertEscrow(e) { const d = read(); const now = new Date().toISOString(); const esc = { id: e.id || uuidv4(), payment_id: e.payment_id, release_condition: e.release_condition || 'manual', status: e.status || 'held', created_at: now, released_at: null }; d.escrows.push(esc); write(d); return esc; }
function getEscrowById(id) { const d = read(); return d.escrows.find(x => x.id === id); }
function updateEscrow(id, fields) { const d = read(); let updated = null; d.escrows = d.escrows.map(x => { if (x.id !== id) return x; const merged = { ...x, ...fields }; if (fields.released_at) merged.released_at = fields.released_at; updated = merged; return merged; }); write(d); return updated; }

// Jobs marketplace
function insertJob(job) { const d = read(); const now = new Date().toISOString(); const j = { id: job.id || uuidv4(), title: job.title, description: job.description || '', category_path: job.category_path || null, job_type: job.job_type || 'gig', location_scope: job.location_scope || 'local', salary_range: job.salary_range || null, posted_by: job.posted_by, status: job.status || 'open', created_at: now }; d.jobs.push(j); write(d); return j; }
function getJobById(id) { const d = read(); return d.jobs.find(j => j.id === id); }

function insertJobApplication(app) { const d = read(); const now = new Date().toISOString(); const a = { id: app.id || uuidv4(), job_id: app.job_id, applicant_id: app.applicant_id, message: app.message || null, status: app.status || 'applied', applied_at: now }; d.job_applications.push(a); write(d); return a; }
function getApplicationsByJobId(job_id) { const d = read(); return d.job_applications.filter(a => a.job_id === job_id); }

// Digital products
function insertDigitalProduct(p) { const d = read(); const now = new Date().toISOString(); const prod = { id: p.id || uuidv4(), creator_id: p.creator_id, title: p.title, description: p.description || '', category_path: p.category_path || null, price: p.price || 0, access_type: p.access_type || 'download', status: p.status || 'active', created_at: now }; d.digital_products.push(prod); write(d); return prod; }
function getProductById(id) { const d = read(); return d.digital_products.find(x => x.id === id); }
function insertPurchase(rec) { const d = read(); const now = new Date().toISOString(); const pur = { id: rec.id || uuidv4(), product_id: rec.product_id, buyer_id: rec.buyer_id, amount: rec.amount || 0, currency: rec.currency || 'USD', created_at: now }; d.purchases.push(pur); write(d); return pur; }
function hasAccessToProduct(product_id, user_id) { const d = read(); return d.purchases.some(p => p.product_id === product_id && p.buyer_id === user_id); }

// Subscriptions
function insertSubscriptionPlan(plan) { const d = read(); const now = new Date().toISOString(); const p = { id: plan.id || uuidv4(), name: plan.name, benefits: plan.benefits || [], price: plan.price || 0, billing_cycle: plan.billing_cycle || 'monthly', created_at: now }; d.subscription_plans.push(p); write(d); return p; }
function getSubscriptionPlanById(id) { const d = read(); return d.subscription_plans.find(p => p.id === id); }
function subscribeProvider(rec) { const d = read(); const now = new Date().toISOString(); const s = { id: rec.id || uuidv4(), provider_id: rec.provider_id, plan_id: rec.plan_id, status: rec.status || 'active', started_at: now }; d.provider_subscriptions.push(s); write(d); return s; }
function getProviderSubscription(provider_id) { const d = read(); return d.provider_subscriptions.find(p => p.provider_id === provider_id); }

// Requests & Quotes (request-driven marketplace)
function insertRequest(reqRec) {
  const d = read();
  const now = new Date().toISOString();
  const r = {
    id: reqRec.id || uuidv4(),
    title: reqRec.title,
    description: reqRec.description || '',
    category_path: reqRec.category_path || null,
    location: reqRec.location || null,
    budget_min: reqRec.budget_min || null,
    budget_max: reqRec.budget_max || null,
    posted_by: reqRec.posted_by,
    status: reqRec.status || 'open',
    created_at: now
  };
  d.requests.push(r);
  write(d);
  return r;
}

function getRequestById(id) { const d = read(); return d.requests.find(x => x.id === id); }

function searchRequests({ category_path, location, distance_km, budget_min, budget_max }) {
  const d = read();
  let rows = d.requests.filter(r => r.status === 'open');
  if (category_path) rows = rows.filter(r => (r.category_path || '').startsWith(category_path));
  if (budget_min) rows = rows.filter(r => (r.budget_max === null || r.budget_max >= budget_min));
  if (budget_max) rows = rows.filter(r => (r.budget_min === null || r.budget_min <= budget_max));
  // location filtering is best-effort; providers will do local matching in their client
  return rows;
}

function getRequestsByUser(user_id) { const d = read(); return d.requests.filter(r => r.posted_by === user_id); }

function insertQuote(q) {
  const d = read();
  const now = new Date().toISOString();
  const rec = {
    id: q.id || uuidv4(),
    request_id: q.request_id,
    provider_id: q.provider_id,
    amount: q.amount || null,
    message: q.message || null,
    status: q.status || 'submitted',
    created_at: now
  };
  d.quotes.push(rec);
  write(d);
  return rec;
}

function getQuotesByRequestId(request_id) { const d = read(); return d.quotes.filter(x => x.request_id === request_id); }
function getQuoteById(id) { const d = read(); return d.quotes.find(x => x.id === id); }

function countQuotesByProviderInWindow(provider_id, days=7) {
  const d = read();
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
  return d.quotes.filter(q => q.provider_id === provider_id && new Date(q.created_at).getTime() >= cutoff).length;
}

function updateRequest(id, fields) { const d = read(); let updated = null; d.requests = d.requests.map(r => { if (r.id !== id) return r; const merged = { ...r, ...fields }; updated = merged; return merged; }); write(d); return updated; }

function updateQuote(id, fields) { const d = read(); let updated = null; d.quotes = d.quotes.map(q => { if (q.id !== id) return q; const merged = { ...q, ...fields }; updated = merged; return merged; }); write(d); return updated; }

module.exports = {
  init,
  getCategories,
  getCategoryById,
  insertCategory,
  getProviderByUserId,
  getProviderById,
  insertProvider,
  insertTrainer,
  insertAgency,
  getTrainerByProviderId,
  getAgencyByProviderId,
  hasPrimaryService,
  clearPrimary,
  insertService,
  getServiceById,
  updateService,
  getServicesByProviderId,
  searchServices
  ,
  // addresses
  insertAddress,
  getAddressesByProviderId,
  getAddressesByServiceId,
  updateAddress,
  // settings
  insertServiceSetting,
  getSettingsByServiceId
  ,
  // payments/escrow
  insertPayment,
  getPaymentById,
  insertEscrow,
  getEscrowById,
  updateEscrow,
  // jobs
  insertJob,
  getJobById,
  insertJobApplication,
  getApplicationsByJobId,
  // digital
  insertDigitalProduct,
  getProductById,
  insertPurchase,
  hasAccessToProduct,
  // subscriptions
  insertSubscriptionPlan,
  getSubscriptionPlanById,
  subscribeProvider,
  getProviderSubscription,
  // requests & quotes
  insertRequest,
  getRequestById,
  searchRequests,
  insertQuote,
  getQuotesByRequestId,
  getQuoteById,
  countQuotesByProviderInWindow,
  updateRequest,
  updateQuote,
  // helpers
  getAllServices
};
