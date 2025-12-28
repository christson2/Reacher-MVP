const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const assert = require('assert');

describe('Consumer flows', function() {
  it('creates consumer profile and can list own requests', async function() {
    const user = 'consumer1';
    // create consumer profile
    const res = await request(app).post('/api/consumer/profile').set('x-user-id', user).send({ full_name: 'Alice', location_country: 'Country', phone: '+123' });
    assert.strictEqual(res.status,201);
    const profile = res.body.data;
    assert(profile.id);

    // create a request as consumer
    const post = await request(app).post('/api/requests').set('x-user-id', user).send({ title: 'Need plumbing', description: 'Sink repair', location: { city: 'Nairobi', state: 'Nairobi', country: 'Kenya' } });
    assert.strictEqual(post.status,201);
    const my = await request(app).get('/api/consumer/requests/me').set('x-user-id', user);
    assert.strictEqual(my.status,200);
    assert(Array.isArray(my.body.data));
    assert(my.body.data.length >= 1);
  });
});
