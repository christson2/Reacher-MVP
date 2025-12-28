const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const assert = require('assert');

describe('Digital product access control', function() {
  it('allows purchase and grants access only to buyer', async function() {
    const creator = 'creator-user';
    db.insertProvider({ id: 'prov-creator', user_id: creator, provider_type: 'agency', display_name: 'Creator', location_country: 'Country', is_active: true });

    const create = await request(app).post('/api/digital').set('x-user-id', creator).send({ title: 'Course 101', price: 10 });
    assert.strictEqual(create.status,201);
    const prod = create.body.data;

    // buyer purchases
    const buyer = 'buyer-user';
    const pur = await request(app).post(`/api/digital/${prod.id}/purchase`).set('x-user-id', buyer).send({});
    assert.strictEqual(pur.status,201);

    // buyer has access
    const access = await request(app).get(`/api/digital/${prod.id}/access`).set('x-user-id', buyer);
    assert.strictEqual(access.status,200);
    assert(access.body.data.access === true);

    // other user does not
    const other = await request(app).get(`/api/digital/${prod.id}/access`).set('x-user-id', 'someone-else');
    assert.strictEqual(other.status,200);
    assert(other.body.data.access === false);
  });
});
