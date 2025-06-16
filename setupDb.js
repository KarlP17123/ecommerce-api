const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Stöd både DATABASE_URL och separata variabler
const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
      }
);

(async () => {
  try {
    // Sökväg till schema.sql i projektroten
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    await pool.query(schema);
    console.log('✅ Databasschema skapat!');
  } catch (err) {
    console.error('🚫 Fel vid skapande av schema.sql:', err.message);
  } finally {
    await pool.end();
  }
})();
