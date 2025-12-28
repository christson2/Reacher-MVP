const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const assert = require('assert');

describe('Provider nearby requests', function() {
  it('returns requests within provider service radius', async function() {
    // create provider
    const provUser = 'near-prov';
    db.insertProvider({ id: 'prov-near', user_id: provUser, provider_type: 'trainer', display_name: 'NearProv', location_country: 'Kenya', location_state: 'Nairobi', location_city: 'Nairobi', is_active: true });
    // create primary service directly
    db.insertService({ id: 'svc-near', provider_id: 'prov-near', category_id: null, service_name: 'Plumbing', normalized_service_name: 'plumbing', tags: ['plumbing'], service_mode: 'physical', coverage_scope: 'local', is_primary: true, is_active: true, created_at: new Date().toISOString() });
    // set service_radius via settings
    db.insertServiceSetting({ service_id: 'svc-near', key: 'service_radius', value: '5' });

    // create a nearby request (same city)
    const req = db.insertRequest({ title: 'Fix tap', description: 'Tap leaking', location: { city: 'Nairobi', state: 'Nairobi', country: 'Kenya' }, posted_by: 'some-user' });

    const res = await request(app).get('/api/provider/requests/nearby').set('x-user-id', provUser);
    assert.strictEqual(res.status,200);
    const rows = res.body.data;
    assert(Array.isArray(rows));
    // should include our request
    const found = rows.find(r => r.id === req.id);
    assert(found, 'nearby request returned');
  });
});
