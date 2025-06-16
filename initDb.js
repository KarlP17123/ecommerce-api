const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  password: 'postgres', // Byt till ditt riktiga lösenord!
  port: 5432,
});

const dbName = 'ecommerce';

(async () => {
  try {
    await client.connect();
    // Kontrollera om databasen redan finns
    const res = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbName]
    );
    if (res.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Databas "${dbName}" skapad!`);
    } else {
      console.log(`ℹ️ Databasen "${dbName}" finns redan.`);
    }
  } catch (err) {
    console.error('🚫 Fel:', err.message);
  } finally {
    await client.end();
  }
})();
