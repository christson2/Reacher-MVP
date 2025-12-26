const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
db.init();

// simple seed - no categories added by default, but helper demonstrates insertion
function seedCategories(items) {
  const now = new Date().toISOString();
  for (const it of items) {
    const cat = {
      id: it.id || uuidv4(),
      name: it.name,
      slug: it.slug || (it.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      parent_id: it.parent_id || null,
      level: it.level || 0,
      description: it.description || null,
      is_active: it.is_active === false ? false : true,
      created_at: now
    };
    db.insertCategory(cat);
  }
}

console.log('Seeding sample categories (no-op if exist)');
seedCategories([
  { name: 'Fitness', slug: 'fitness', level: 0 },
  { name: 'Yoga', slug: 'yoga', parent_id: null, level: 1 }
]);
console.log('Seed complete');
