const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const assert = require('assert');

describe('Jobs marketplace flows', function() {
  it('posts a job and allows applications which the owner can list', async function() {
    // create poster
    const posterUser = 'poster-user';
    db.insertProvider({ id: 'prov-poster', user_id: posterUser, provider_type: 'agency', display_name: 'Poster', location_country: 'Country', is_active: true });

    // post job
    const post = await request(app).post('/api/jobs').set('x-user-id', posterUser).send({ title: 'Test Job', description: 'Do work' });
    assert.strictEqual(post.status,201);
    const job = post.body.data;

    // applicant applies
    const applicant = 'applicant-user';
    const appRes = await request(app).post(`/api/jobs/${job.id}/apply`).set('x-user-id', applicant).send({ message: 'I can do it' });
    assert.strictEqual(appRes.status,201);

    // poster can list applications
    const list = await request(app).get(`/api/jobs/${job.id}/applications`).set('x-user-id', posterUser);
    assert.strictEqual(list.status,200);
    assert(Array.isArray(list.body.data));
    assert(list.body.data.length >= 1);
  });
});
