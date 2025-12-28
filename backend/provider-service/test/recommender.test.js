const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const assert = require('assert');

describe('Recommendations explainability', function() {
  it('returns explainable recommendations with reason_codes and confidence', async function() {
    // seed provider and service
    db.insertProvider({ id: 'prov-rec', user_id: 'rec-user', provider_type: 'trainer', display_name: 'RecProv', location_country: 'Country', is_active: true, verification_level: 'trusted' });
    db.insertService({ id: 'svc-rec', provider_id: 'prov-rec', category_id: null, service_name: 'Yoga Class', service_description: 'Morning yoga', normalized_service_name: 'yoga class', tags: ['yoga'], service_mode: 'physical', coverage_scope: 'local', is_active: true, created_at: new Date().toISOString() });

    const res = await request(app).get('/api/recommendations').set('authorization','Bearer dev-token').query({ q: 'yoga' });
    assert.strictEqual(res.status,200);
    const recs = res.body.data;
    assert(Array.isArray(recs));
    assert(recs.length > 0);
    assert(recs[0].reason_codes && Array.isArray(recs[0].reason_codes));
    assert(typeof recs[0].confidence_score === 'number');
  });
});
