const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/authMiddleware');

// GET: Hämta alla användare (kan begränsas till admin senare)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query('SELECT id, username, email FROM users');
    res.json(result.rows);
  } catch (err) {
    console.error('Fel vid hämtning av användare:', err);
    next(err);
  }
});

// GET: Hämta specifik användare (endast den egna användaren)
router.get('/:id', authenticateToken, async (req, res, next) => {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Ogiltigt användar-ID' });
  }

  if (userId !== req.user.id) {
    return res.status(403).json({ error: 'Åtkomst nekad' });
  }

  try {
    const result = await db.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Användare hittades inte' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fel vid hämtning av användare:', err);
    next(err);
  }
});

// PUT: Uppdatera användare (endast den egna användaren)
router.put('/:id', authenticateToken, async (req, res, next) => {
  const userId = Number(req.params.id);
  const { username, email } = req.body;

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Ogiltigt användar-ID' });
  }

  if (userId !== req.user.id) {
    return res.status(403).json({ error: 'Åtkomst nekad' });
  }

  if (!username && !email) {
    return res.status(400).json({ error: 'Inga uppgifter att uppdatera' });
  }

  try {
    const result = await db.query(
      `UPDATE users 
       SET username = COALESCE($1, username), 
           email = COALESCE($2, email) 
       WHERE id = $3 
       RETURNING id, username, email`,
      [username || null, email || null, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Användare hittades inte' });
    }

    res.json({ message: 'Användare uppdaterad', user: result.rows[0] });
  } catch (err) {
    console.error('Fel vid uppdatering av användare:', err);
    next(err);
  }
});

module.exports = router;
