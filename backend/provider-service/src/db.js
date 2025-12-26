const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const FILE = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'provider.json');

function read() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {
      provider_profiles: [],
      service_categories: [],
      services: [],
      trainer_profiles: [],
      agency_profiles: [],
      addresses: [],
      service_settings: []
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
};
