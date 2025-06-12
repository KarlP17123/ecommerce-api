const { Client } = require('pg');

const client = new Client({
  user: 'postgres',           // Standardanvändare
  host: 'localhost',          // Din lokala dator
  password: 'postgres',  // ← Byt detta till ditt riktiga lösenord!
  port: 5432,                 // Standardport för PostgreSQL
});

const dbName = 'ecommerce';   // Namnet på databasen du vill skapa

(async () => {
  try {
    await client.connect();
    await client.query(`CREATE DATABASE ${dbName}`);
    console.log(`✅ Databas "${dbName}" skapad!`);
  } catch (err) {
    console.error('🚫 Fel:', err);
  } finally {
    await client.end();
  }
})();
