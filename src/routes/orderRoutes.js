const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order-hantering
 */

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Hämta alla ordrar för inloggad användare
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista av ordrar
 */
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fel vid hämtning av ordrar:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Hämta en specifik order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Orderns ID
 *     responses:
 *       200:
 *         description: En order
 *       404:
 *         description: Ordern hittades inte
 */
router.get('/:id', authenticateToken, async (req, res, next) => {
  const orderId = Number(req.params.id);
  try {
    const result = await db.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ordern hittades inte' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Fel vid hämtning av order:', err);
    next(err);
  }
});

/**
 * @swagger
 * /api/orders/{id}:
 *   delete:
 *     summary: Ta bort en order (endast ägare)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Orderns ID
 *     responses:
 *       200:
 *         description: Order borttagen
 *       404:
 *         description: Ordern hittades inte eller tillhör inte dig
 */
router.delete('/:id', authenticateToken, async (req, res, next) => {
  const orderId = Number(req.params.id);
  try {
    const result = await db.query(
      'DELETE FROM orders WHERE id = $1 AND user_id = $2 RETURNING *',
      [orderId, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ordern hittades inte eller tillhör inte dig' });
    }
    res.json({ message: 'Order borttagen' });
  } catch (err) {
    console.error('Fel vid borttagning av order:', err);
    next(err);
  }
});

module.exports = router