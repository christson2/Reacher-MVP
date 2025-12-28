const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const assert = require('assert');

describe('Provider subscriptions', function() {
  it('creates a plan and subscribes a provider', async function() {
    const admin = 'admin-user';
    // create plan
    const plan = await request(app).post('/api/subscription/plans').set('authorization','Bearer dev-token').send({ name: 'Pro', benefits: ['priority'], price: 5 });
    assert.strictEqual(plan.status,201);
    const planId = plan.body.data.id;

    // provider profile
    const provUser = 'sub-prov';
    db.insertProvider({ id: 'prov-sub', user_id: provUser, provider_type: 'trainer', display_name: 'SubProv', location_country: 'Country', is_active: true });

    const sub = await request(app).post('/api/provider/subscriptions').set('x-user-id', provUser).send({ plan_id: planId });
    assert.strictEqual(sub.status,201);
    const rec = sub.body.data;
    assert.strictEqual(rec.provider_id, 'prov-sub');

    const me = await request(app).get('/api/provider/subscriptions/me').set('x-user-id', provUser);
    assert.strictEqual(me.status,200);
    assert(me.body.data && me.body.data.plan_id === planId);
  });
});
