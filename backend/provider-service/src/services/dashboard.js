const db = require('../db');
const { computeTrustScore } = require('./trust');

function computeProfileCompletion(provider) {
  const missing = [];
  if (!provider) return { profile_completion_score: 0, missing_fields: ['profile'] };
  // critical fields: address (at least one), service description (any service has description), service mode (any service), phone number
  const addresses = db.getAddressesByProviderId(provider.id) || [];
  if (addresses.length === 0) missing.push('address');
  const services = db.getServicesByProviderId(provider.id) || [];
  const hasDesc = services.some(s => s.service_description && s.service_description.length > 10);
  if (!hasDesc) missing.push('service_description');
  const hasMode = services.some(s => s.service_mode);
  if (!hasMode) missing.push('service_mode');
  // phone number might be in service settings or provider fields - best-effort
  const settings = [];
  for (const s of services) {
    const set = db.getSettingsByServiceId(s.id) || [];
    settings.push(...set);
  }
  const phoneSetting = settings.find(z => z.key && z.key.toLowerCase().includes('phone'));
  if (!phoneSetting && !provider.phone_number) missing.push('phone_number');

  // simple scoring: start at 100, subtract for each missing critical field
  const total = 4;
  const present = total - missing.length;
  const score = Math.round((present / total) * 100);
  return { profile_completion_score: score, missing_fields: missing };
}

function computeServiceStats(provider_id) {
  // placeholder - using DB stored counters would be ideal; we return zeros when absent
  const services = db.getServicesByProviderId(provider_id) || [];
  // fake counters stored in service_settings could be used; here we compute zeros
  return services.map(s => ({ service_offering_id: s.id, impressions: 0, requests_received: 0, accepted: 0, completed: 0 }));
}

function computeTrustForProvider(provider) {
  // gather stats from DB - simplified
  const services = db.getServicesByProviderId(provider.id) || [];
  const stats = { accepted: 0, completed: 0 };
  // collect reviews and incidents from service_settings keys (placeholder)
  const reviews = [];
  let incidents = 0;
  let response_rate = 0.5;
  for (const s of services) {
    const sets = db.getSettingsByServiceId(s.id) || [];
    for (const st of sets) {
      if (st.key === 'incidents') incidents += Number(st.value) || 0;
      if (st.key === 'response_rate') response_rate = Number(st.value) || response_rate;
    }
  }
  return computeTrustScore(provider, { stats, reviews, response_rate, incidents });
}

module.exports = { computeProfileCompletion, computeServiceStats, computeTrustForProvider };
