const { init } = require('./db');
const fs = require('fs');
const path = require('path');

fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
init();
console.log('Migration complete');
