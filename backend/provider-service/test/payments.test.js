const request = require('supertest');
const app = require('../src/index');
const db = require('../src/db');
const assert = require('assert');

describe('Payments and Escrow flows', function() {
  it('creates an escrow payment and requires job_completed to release', async function() {
    // create payee provider profile
    const payeeUser = 'payee-user';
    db.insertProvider({ id: 'prov-payee', user_id: payeeUser, provider_type: 'trainer', display_name: 'Payee', location_country: 'Country', is_active: true });

    // create payment as payer
    const res = await request(app).post('/api/payments').set('authorization','Bearer dev-token').send({ payee_id: 'prov-payee', amount: 100, payment_mode: 'escrow', release_condition: 'job_completed' });
    assert.strictEqual(res.status,201);
    const payment = res.body.data.payment;
    const escrow = res.body.data.escrow;
    assert(payment.id && escrow.id);

    // attempt release without job_completed -> fail
    const r2 = await request(app).post(`/api/escrows/${escrow.id}/release`).set('authorization','Bearer dev-token').send({ job_completed: false });
    assert.strictEqual(r2.status,400);

    // release with job_completed true
    const r3 = await request(app).post(`/api/escrows/${escrow.id}/release`).set('authorization','Bearer dev-token').send({ job_completed: true });
    assert.strictEqual(r3.status,200);
    assert.strictEqual(r3.body.data.status,'released');
  });
});
