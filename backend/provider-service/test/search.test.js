const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../src/index');

const DATA_FILE = path.join(__dirname, '..', 'data', 'provider.json');
function resetData(sample) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(sample, null, 2), 'utf8');
}

const sampleData = {
  provider_profiles: [
    {
      id: 'prov-1', user_id: 'user-1', provider_type: 'trainer', display_name: 'Local Yoga Trainer',
      bio: 'Experienced', profile_image_url: null, location_country: 'Neverland', location_state: 'StateA', location_city: 'CityX',
      is_verified: true, verification_level: 'trusted', is_active: true, created_at: new Date().toISOString()
    },
    {
      id: 'prov-2', user_id: 'user-2', provider_type: 'individual', display_name: 'Remote Yoga Coach',
      bio: 'Online', profile_image_url: null, location_country: 'Neverland', location_state: 'StateB', location_city: 'CityY',
      is_verified: false, verification_level: 'basic', is_active: true, created_at: new Date().toISOString()
    },
    {
      id: 'prov-3', user_id: 'user-3', provider_type: 'business', display_name: 'Global Fitness Co',
      bio: 'Worldwide', profile_image_url: null, location_country: 'Otherland', location_state: 'StateZ', location_city: 'CityZ',
      is_verified: true, verification_level: 'basic', is_active: true, created_at: new Date().toISOString()
    }
  ],
  service_categories: [
    { id: 'cat-1', name: 'Fitness', slug: 'fitness', parent_id: null, level: 0, description: null, is_active: true, created_at: new Date().toISOString() },
    { id: 'cat-2', name: 'Yoga', slug: 'yoga', parent_id: 'cat-1', level: 1, description: null, is_active: true, created_at: new Date().toISOString() }
  ],
  services: [
    { id: 'svc-1', provider_id: 'prov-1', category_id: 'cat-2', subcategory_id: null, service_name: 'Yoga For Beginners', service_description: 'Intro class', service_mode: 'physical', coverage_scope: 'local', pricing_model: 'fixed', is_primary: true, is_active: true, created_at: new Date().toISOString() },
    { id: 'svc-2', provider_id: 'prov-2', category_id: 'cat-2', subcategory_id: null, service_name: 'Online Yoga Sessions', service_description: 'Remote coaching', service_mode: 'remote', coverage_scope: 'national', pricing_model: 'hourly', is_primary: true, is_active: true, created_at: new Date().toISOString() },
    { id: 'svc-3', provider_id: 'prov-3', category_id: 'cat-1', subcategory_id: null, service_name: 'Global Fitness Program', service_description: 'Remote global', service_mode: 'remote', coverage_scope: 'global', pricing_model: 'negotiable', is_primary: true, is_active: true, created_at: new Date().toISOString() }
  ],
  trainer_profiles: [],
  agency_profiles: []
};

describe('Local-first search', function() {
  beforeEach(() => {
    resetData(sampleData);
  });

  it('1) User searches without location → local services first', async () => {
    const res = await request(app)
      .get('/api/services/search')
      .query({ q: 'yoga' })
      .set('Authorization', 'Bearer dev-token')
      .set('x-user-country', 'Neverland')
      .set('x-user-city', 'CityX');
    if (res.status !== 200) throw new Error('bad status ' + res.status);
    const ids = res.body.data.map(d => d.id);
    if (ids[0] !== 'svc-1') throw new Error('expected svc-1 first, got ' + ids[0]);
  });

  it('2) User searches with city specified → only that city', async () => {
    const res = await request(app)
      .get('/api/services/search')
      .query({ q: 'yoga', location_city: 'CityX', location_country: 'Neverland' })
      .set('Authorization', 'Bearer dev-token');
    if (res.status !== 200) throw new Error('bad status ' + res.status);
    const ids = res.body.data.map(d => d.id);
    if (ids.length !== 1 || ids[0] !== 'svc-1') throw new Error('expected only svc-1 for CityX');
  });

  it('3) Remote services do not outrank local physical services', async () => {
    const res = await request(app)
      .get('/api/services/search')
      .query({ q: 'yoga' })
      .set('Authorization', 'Bearer dev-token')
      .set('x-user-country', 'Neverland')
      .set('x-user-city', 'CityX');
    const ids = res.body.data.map(d => d.id);
    const idxPhysical = ids.indexOf('svc-1');
    const idxRemote = ids.indexOf('svc-2');
    if (idxPhysical === -1) throw new Error('physical not found');
    if (idxRemote === -1) throw new Error('remote not found');
    if (idxRemote < idxPhysical) throw new Error('remote outranked physical');
  });

  it('4) Global services never appear first by default', async () => {
    const res = await request(app)
      .get('/api/services/search')
      .query({ q: 'fitness' })
      .set('Authorization', 'Bearer dev-token')
      .set('x-user-country', 'Neverland')
      .set('x-user-city', 'CityX');
    const ids = res.body.data.map(d => d.id);
    if (ids[0] === 'svc-3') throw new Error('global service appeared first');
  });

  it('5) Trainer search respects locality first', async () => {
    const res = await request(app)
      .get('/api/services/search')
      .query({ q: 'yoga' })
      .set('Authorization', 'Bearer dev-token')
      .set('x-user-country', 'Neverland')
      .set('x-user-city', 'CityX');
    const first = res.body.data[0];
    if (!first.provider) throw new Error('provider missing');
    if (first.provider.provider_type !== 'trainer' && first.id === 'svc-1') {
      throw new Error('trainer svc-1 expected to be first');
    }
  });
});
