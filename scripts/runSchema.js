const fs = require('fs');
const path = require('path');
const pool = require('../db'); // justera om din db.js ligger någon annanstans

(async () => {
  try {
    const schemaPath = path.join(__dirname, '../schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    await pool.query(sql);
    console.log('✅ Databasen skapad via schema.sql!');
  } catch (err) {
    console.error('❌ Fel vid körning av schema.sql:', err);
  } finally {
    await pool.end();
  }
})();
