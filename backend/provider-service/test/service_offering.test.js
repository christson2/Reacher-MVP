const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/index');

const DATA_FILE = path.join(__dirname, '..', 'data', 'provider.json');
function resetData(sample) { fs.writeFileSync(DATA_FILE, JSON.stringify(sample, null, 2), 'utf8'); }

const baseSample = {
  provider_profiles: [],
  service_categories: [
    { id: 'cat-1', name: 'Fitness', slug: 'fitness', parent_id: null, level: 0, description: null, is_active: true, created_at: new Date().toISOString() },
    { id: 'cat-2', name: 'Yoga', slug: 'yoga', parent_id: 'cat-1', level: 1, description: null, is_active: true, created_at: new Date().toISOString() }
  ],
  services: [],
  trainer_profiles: [],
  agency_profiles: [],
  addresses: [],
  service_settings: []
};

describe('ServiceOffering and Addresses API', function() {
  beforeEach(() => resetData(baseSample));

  it('creates provider, posts service offering, normalizes and tags', async () => {
    // create provider
    const prof = await request(app).post('/api/provider/profile').set('Authorization','Bearer dev-token').send({ provider_type: 'trainer', display_name: 'T1', location_country: 'Neverland' });
    if (prof.status !== 201) throw new Error('profile creation failed');

    const res = await request(app).post('/api/provider/services').set('Authorization','Bearer dev-token').send({
      category_id: 'cat-2', service_mode: 'physical', coverage_scope: 'local', pricing_model: 'fixed',
      raw_service_input: 'Experienced yoga instructor for beginners and intermediates',
      input_type: 'text', service_role_or_name: 'Yoga'
    });
    if (res.status !== 201) throw new Error('service creation failed');
    const s = res.body.data;
    if (!s.normalized_service_name) throw new Error('normalized missing');
    if (!Array.isArray(s.tags) || s.tags.length === 0) throw new Error('tags missing');
    // suggested_category may be present
  });

  it('creates and updates address via API', async () => {
    const prof = await request(app).post('/api/provider/profile').set('Authorization','Bearer dev-token').send({ provider_type: 'individual', display_name: 'P1', location_country: 'Neverland' });
    if (prof.status !== 201) throw new Error('profile creation failed');
    const post = await request(app).post('/api/provider/addresses').set('Authorization','Bearer dev-token').send({ raw_address: '8 Abanise Street, Aduralere Quarters, Akure, Ondo' });
    if (post.status !== 201) throw new Error('address create failed');
    const addr = post.body.data;
    if (!addr.raw_address) throw new Error('raw_address missing');
    const upd = await request(app).put(`/api/provider/addresses/${addr.id}`).set('Authorization','Bearer dev-token').send({ raw_address: '9 New St, SomeTown, Neverland' });
    if (upd.status !== 200) throw new Error('address update failed');
    if (!upd.body.data) throw new Error('no updated address');
  });
});
