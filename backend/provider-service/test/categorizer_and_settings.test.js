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

describe('Categorizer suggestions and service_settings API', function() {
  beforeEach(() => resetData(baseSample));

  it('returns suggested_category_id on service creation when text matches category', async () => {
    const prof = await request(app).post('/api/provider/profile').set('Authorization','Bearer dev-token').send({ provider_type: 'trainer', display_name: 'T1', location_country: 'Neverland' });
    if (prof.status !== 201) throw new Error('profile creation failed');

    const res = await request(app).post('/api/provider/services').set('Authorization','Bearer dev-token').send({
      category_id: 'cat-2', service_mode: 'physical', coverage_scope: 'local', pricing_model: 'fixed',
      raw_service_input: 'Professional Yoga Trainer for adults',
      service_role_or_name: 'Yoga'
    });
    if (res.status !== 201) throw new Error('service creation failed');
    const s = res.body.data;
    if (!s.suggested_category_id) throw new Error('expected suggested_category_id');
  });

  it('creates and lists service settings', async () => {
    const prof = await request(app).post('/api/provider/profile').set('Authorization','Bearer dev-token').send({ provider_type: 'individual', display_name: 'P1', location_country: 'Neverland' });
    if (prof.status !== 201) throw new Error('profile creation failed');
    const svc = await request(app).post('/api/provider/services').set('Authorization','Bearer dev-token').send({ category_id: 'cat-2', service_mode: 'physical', coverage_scope: 'local', pricing_model: 'fixed', service_name: 'S1' });
    if (svc.status !== 201) throw new Error('service creation failed');
    const id = svc.body.data.id;
    const post = await request(app).post(`/api/provider/services/${id}/settings`).set('Authorization','Bearer dev-token').send({ key: 'phone', value: '+123456789' });
    if (post.status !== 201) throw new Error('setting create failed');
    const list = await request(app).get(`/api/provider/services/${id}/settings`).set('Authorization','Bearer dev-token');
    if (list.status !== 200) throw new Error('settings list failed');
    if (!Array.isArray(list.body.data) || list.body.data.length !== 1) throw new Error('unexpected settings');
  });
});
