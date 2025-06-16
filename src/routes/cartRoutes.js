const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/authMiddleware');
const { body, validationResult } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Hantering av varukorg
 */

/**
 * @swagger
 * /api/cart/add:
 *   post:
 *     summary: Lägg till produkt i kundvagn
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Produkt tillagd eller uppdaterad i varukorgen
 *       404:
 *         description: Produkten finns inte
 */
router.post(
  '/add',
  authenticateToken,
  [
    body('product_id').isInt({ gt: 0 }).withMessage('Ogiltigt produkt-ID'),
    body('quantity').isInt({ gt: 0 }).withMessage('Kvantitet måste vara ett positivt heltal'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, quantity } = req.body;
    const user_id = req.user.id;

    try {
      const productCheck = await db.query('SELECT * FROM products WHERE id = $1', [product_id]);
      if (productCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Produkten finns inte' });
      }

      let cartResult = await db.query('SELECT * FROM carts WHERE user_id = $1', [user_id]);
      if (cartResult.rows.length === 0) {
        cartResult = await db.query(
          'INSERT INTO carts (user_id, updated_at) VALUES ($1, NOW()) RETURNING *',
          [user_id]
        );
      }
      const cart_id = cartResult.rows[0].id;

      const existingItem = await db.query(
        'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart_id, product_id]
      );

      if (existingItem.rows.length > 0) {
        const newQuantity = existingItem.rows[0].quantity + quantity;
        const updatedItem = await db.query(
          'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
          [newQuantity, existingItem.rows[0].id]
        );
        await db.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cart_id]);
        return res.status(200).json({ message: '✅ Produktkvantitet uppdaterad i varukorgen', item: updatedItem.rows[0] });
      } else {
        const newItem = await db.query(
          'INSERT INTO cart_items (cart_id, product_id, quantity, updated_at) VALUES ($1, $2, $3, NOW()) RETURNING *',
          [cart_id, product_id, quantity]
        );
        await db.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cart_id]);
        return res.status(200).json({ message: '✅ Produkt tillagd i varukorgen', item: newItem.rows[0] });
      }
    } catch (err) {
      console.error('❌ Fel vid tillägg i varukorg:', err);
      res.status(500).json({ error: '❌ Något gick fel' });
    }
  }
);

/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Hämta hela kundvagnen för användaren
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Varukorgens innehåll
 */
router.get('/', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  try {
    const cartResult = await db.query('SELECT * FROM carts WHERE user_id = $1', [user_id]);
    if (cartResult.rows.length === 0) {
      return res.status(200).json({ cart: [], message: 'Varukorgen är tom' });
    }
    const cart_id = cartResult.rows[0].id;

    const itemsResult = await db.query(`
      SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.description, p.price
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.cart_id = $1
    `, [cart_id]);

    res.status(200).json({ cart: itemsResult.rows });
  } catch (err) {
    console.error('❌ Fel vid hämtning av kundvagn:', err);
    res.status(500).json({ error: '❌ Något gick fel' });
  }
});

/**
 * @swagger
 * /api/cart/update:
 *   put:
 *     summary: Uppdatera kvantitet för produkt i kundvagn
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *               - quantity
 *             properties:
 *               product_id:
 *                 type: integer
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Produktkvantitet uppdaterad eller borttagen
 *       404:
 *         description: Produkten finns inte i varukorgen
 */
router.put(
  '/update',
  authenticateToken,
  [
    body('product_id').isInt({ gt: 0 }).withMessage('Ogiltigt produkt-ID'),
    body('quantity').isInt({ min: 0 }).withMessage('Kvantitet måste vara 0 eller högre'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { product_id, quantity } = req.body;
    const user_id = req.user.id;

    try {
      const cartResult = await db.query('SELECT * FROM carts WHERE user_id = $1', [user_id]);
      if (cartResult.rows.length === 0) {
        return res.status(404).json({ error: 'Varukorg finns inte' });
      }
      const cart_id = cartResult.rows[0].id;

      const existingItem = await db.query(
        'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart_id, product_id]
      );
      if (existingItem.rows.length === 0) {
        return res.status(404).json({ error: 'Produkten finns inte i varukorgen' });
      }

      if (quantity === 0) {
        await db.query('DELETE FROM cart_items WHERE id = $1', [existingItem.rows[0].id]);
        await db.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cart_id]);
        return res.status(200).json({ message: '✅ Produkten togs bort från varukorgen' });
      } else {
        const updatedItem = await db.query(
          'UPDATE cart_items SET quantity = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
          [quantity, existingItem.rows[0].id]
        );
        await db.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cart_id]);
        return res.status(200).json({ message: '✅ Produktkvantitet uppdaterad', item: updatedItem.rows[0] });
      }
    } catch (err) {
      console.error('❌ Fel vid uppdatering av varukorg:', err);
      res.status(500).json({ error: '❌ Något gick fel' });
    }
  }
);

/**
 * @swagger
 * /api/cart/remove:
 *   delete:
 *     summary: Ta bort produkt från kundvagn
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - product_id
 *             properties:
 *               product_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Produkten togs bort från varukorgen
 *       404:
 *         description: Produkten finns inte i varukorgen
 */
router.delete(
  '/remove',
  authenticateToken,
  [
    body('product_id').isInt({ gt: 0 }).withMessage('Ogiltigt produkt-ID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const product_id = req.body.product_id || req.query.product_id;
    const user_id = req.user.id;

    try {
      const cartResult = await db.query('SELECT * FROM carts WHERE user_id = $1', [user_id]);
      if (cartResult.rows.length === 0) {
        return res.status(404).json({ error: 'Varukorg finns inte' });
      }
      const cart_id = cartResult.rows[0].id;

      const existingItem = await db.query(
        'SELECT * FROM cart_items WHERE cart_id = $1 AND product_id = $2',
        [cart_id, product_id]
      );
      if (existingItem.rows.length === 0) {
        return res.status(404).json({ error: 'Produkten finns inte i varukorgen' });
      }

      await db.query('DELETE FROM cart_items WHERE id = $1', [existingItem.rows[0].id]);
      await db.query('UPDATE carts SET updated_at = NOW() WHERE id = $1', [cart_id]);

      res.status(200).json({ message: '✅ Produkten togs bort från varukorgen' });
    } catch (err) {
      console.error('❌ Fel vid borttagning från varukorg:', err);
      res.status(500).json({ error: '❌ Något gick fel' });
    }
  }
);

/**
 * @swagger
 * /api/cart/checkout:
 *   post:
 *     summary: Skapa order från varukorg (checkout)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Order skapad från varukorg
 *       400:
 *         description: Varukorgen är tom eller saknas
 */
router.post('/checkout', authenticateToken, async (req, res) => {
  const user_id = req.user.id;
  try {
    const cartResult = await db.query('SELECT * FROM carts WHERE user_id = $1', [user_id]);
    if (cartResult.rows.length === 0) {
      return res.status(400).json({ error: 'Ingen varukorg att checka ut' });
    }
    const cart_id = cartResult.rows[0].id;

    const itemsResult = await db.query(
      'SELECT * FROM cart_items WHERE cart_id = $1',
      [cart_id]
    );
    if (itemsResult.rows.length === 0) {
      return res.status(400).json({ error: 'Varukorgen är tom' });
    }

    let total = 0;
    for (const item of itemsResult.rows) {
      const product = await db.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
      total += Number(product.rows[0].price) * item.quantity;
    }

    const orderResult = await db.query(
      'INSERT INTO orders (user_id, total, status) VALUES ($1, $2, $3) RETURNING *',
      [user_id, total, 'pending']
    );
    const order_id = orderResult.rows[0].id;

    for (const item of itemsResult.rows) {
      await db.query(
        'INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)',
        [order_id, item.product_id, item.quantity]
      );
    }

    await db.query('DELETE FROM cart_items WHERE cart_id = $1', [cart_id]);

    res.status(201).json({ message: 'Order skapad!', order: orderResult.rows[0] });
  } catch (err) {
    console.error('Fel vid checkout:', err);
    res.status(500).json({ error: 'Något gick fel vid checkout' });
  }
});

module.exports = router;