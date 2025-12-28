const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const assert = require('assert');

describe('Requests & Quotes flows', function() {
  it('creates a request, provider quotes, and owner accepts quote creating escrow', async function() {
    // create requester
    const requester = 'req-user';
    db.insertProvider({ id: 'prov-req', user_id: requester, provider_type: 'consumer', display_name: 'ReqUser', location_country: 'Country', is_active: true });

    // create provider who will quote
    const providerUser = 'quote-provider';
    db.insertProvider({ id: 'prov-quote', user_id: providerUser, provider_type: 'trainer', display_name: 'Quoter', location_country: 'Country', is_active: true });

    // requester posts a request
    const post = await request(app).post('/api/requests').set('x-user-id', requester).send({ title: 'Fix my sink', description: 'Leaking sink, needs repair', category_path: 'home.plumbing', budget_min: 20, budget_max: 100 });
    assert.strictEqual(post.status,201);
    const reqObj = post.body.data;

    // provider submits quote
    const quoteRes = await request(app).post(`/api/requests/${reqObj.id}/quotes`).set('x-user-id', providerUser).send({ amount: 50, message: 'Can do tomorrow' });
    assert.strictEqual(quoteRes.status,201);
    const quote = quoteRes.body.data;

    // requester accepts quote -> payment + escrow
    const accept = await request(app).post(`/api/requests/${reqObj.id}/accept-quote`).set('x-user-id', requester).send({ quote_id: quote.id, payment_mode: 'escrow' });
    assert.strictEqual(accept.status,200);
    const { payment, escrow } = accept.body.data;
    assert(payment && payment.id);
    assert(escrow && escrow.id);

    // statuses updated
    const updatedReq = db.getRequestById(reqObj.id);
    assert.strictEqual(updatedReq.status, 'assigned');
    const updatedQuote = db.getQuoteById(quote.id);
    assert.strictEqual(updatedQuote.status, 'accepted');
  });

  it('enforces single quote per provider per request and rate limits', async function() {
    const providerUser = 'rate-provider';
    db.insertProvider({ id: 'prov-rate', user_id: providerUser, provider_type: 'trainer', display_name: 'RateProv', location_country: 'Country', is_active: true });
    const requester = 'rate-req';
    db.insertProvider({ id: 'prov-rate-req', user_id: requester, provider_type: 'consumer', display_name: 'Req2', location_country: 'Country', is_active: true });

    const post = await request(app).post('/api/requests').set('x-user-id', requester).send({ title: 'Job A' });
    const r1 = post.body.data;

    const q1 = await request(app).post(`/api/requests/${r1.id}/quotes`).set('x-user-id', providerUser).send({ amount: 10 });
    assert.strictEqual(q1.status,201);

    // duplicate quote should be rejected
    const q2 = await request(app).post(`/api/requests/${r1.id}/quotes`).set('x-user-id', providerUser).send({ amount: 12 });
    assert.strictEqual(q2.status,409);

    // spike submissions to exceed free limit
    for (let i=0;i<6;i++) {
      const p = await request(app).post('/api/requests').set('x-user-id', requester).send({ title: `Job extra ${i}` });
      await request(app).post(`/api/requests/${p.body.data.id}/quotes`).set('x-user-id', providerUser).send({ amount: 5 });
    }
    // next quote should be rate-limited
    const lastPost = await request(app).post('/api/requests').set('x-user-id', requester).send({ title: 'Job final' });
    const limitRes = await request(app).post(`/api/requests/${lastPost.body.data.id}/quotes`).set('x-user-id', providerUser).send({ amount: 6 });
    assert.strictEqual(limitRes.status,429);
  });
});
