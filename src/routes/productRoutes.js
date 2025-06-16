const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');

// Middleware för valideringsfel
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Hantering av produkter
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Hämta alla produkter
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista av produkter
 */
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM products ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    next({ message: 'Fel vid hämtning av produkter', error: err });
  }
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Hämta en produkt via ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Produktens ID
 *     responses:
 *       200:
 *         description: En produkt
 *       404:
 *         description: Produkten hittades inte
 */
router.get(
  '/:id',
  param('id').isInt({ min: 1 }).withMessage('Produkt-ID måste vara ett positivt heltal'),
  validate,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { rows } = await db.query('SELECT * FROM products WHERE id = $1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Produkten hittades inte' });
      }
      res.json(rows[0]);
    } catch (err) {
      next({ message: 'Fel vid hämtning av produkt', error: err });
    }
  }
);

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Skapa ny produkt (skyddad)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Produkten skapades
 */
router.post(
  '/',
  authenticateToken,
  body('name').notEmpty().withMessage('Namn krävs'),
  body('price').isFloat({ gt: 0 }).withMessage('Priset måste vara ett positivt nummer'),
  validate,
  async (req, res, next) => {
    try {
      const { name, description = '', price } = req.body;
      const { rows } = await db.query(
        'INSERT INTO products (name, description, price) VALUES ($1, $2, $3) RETURNING *',
        [name, description, price]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next({ message: 'Fel vid skapande av produkt', error: err });
    }
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Uppdatera produkt (skyddad)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Produktens ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Produkten uppdaterad
 *       404:
 *         description: Produkten hittades inte
 */
router.put(
  '/:id',
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('Produkt-ID måste vara ett positivt heltal'),
  body('name').notEmpty().withMessage('Namn krävs'),
  body('price').isFloat({ gt: 0 }).withMessage('Priset måste vara ett positivt nummer'),
  validate,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { name, description = '', price } = req.body;
      const { rows } = await db.query(
        'UPDATE products SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING *',
        [name, description, price, id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Produkten hittades inte' });
      }
      res.json(rows[0]);
    } catch (err) {
      next({ message: 'Fel vid uppdatering av produkt', error: err });
    }
  }
);

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Ta bort produkt (skyddad)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Produktens ID
 *     responses:
 *       204:
 *         description: Produkten borttagen
 *       404:
 *         description: Produkten hittades inte
 */
router.delete(
  '/:id',
  authenticateToken,
  param('id').isInt({ min: 1 }).withMessage('Produkt-ID måste vara ett positivt heltal'),
  validate,
  async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      const { rows } = await db.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Produkten hittades inte' });
      }
      res.status(204).send();
    } catch (err) {
      next({ message: 'Fel vid borttagning av produkt', error: err });
    }
  }
);

module.exports = router;