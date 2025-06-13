const express = require('express');
const pool = require('../db'); // 🟢 Importera databaspoolen
require('dotenv').config();

const authRoutes = require('./routes/auth'); // ✅ Importera auth-routes
const authenticateToken = require('./middleware/authMiddleware'); // 🛡️ Importera JWT-middleware

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// 🔗 Lägg till auth-routes
app.use('/api', authRoutes); // 👉 Alla auth-routes som /api/register och /api/login

// 🔐 Skyddad route som kräver JWT-token
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({
    message: 'Detta är en skyddad route',
    user: req.user, // Här finns data från JWT-token
  });
});

// 🔍 Test-rutt för att kolla databasanslutning
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).send('Database connection failed');
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servern körs på http://localhost:${PORT}`);
});
