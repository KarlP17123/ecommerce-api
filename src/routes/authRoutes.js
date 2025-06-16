const express = require('express');
const { body, validationResult } = require('express-validator');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// Middleware för att hantera valideringsfel
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const allowedRoles = ['user', 'admin'];

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autentisering och registrering
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrera ny användare
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Användare skapad
 *       400:
 *         description: Felaktig data
 */
router.post(
  '/register',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Användarnamn krävs'),
    body('email')
      .trim()
      .isEmail()
      .withMessage('Ogiltig e-postadress'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Lösenordet måste vara minst 6 tecken långt'),
    body('role')
      .optional()
      .isIn(allowedRoles)
      .withMessage(`Roll måste vara en av följande: ${allowedRoles.join(', ')}`)
  ],
  validateRequest,
  registerUser
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Logga in användare
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inloggning lyckades, JWT-token returneras
 *       400:
 *         description: Felaktig data
 *       401:
 *         description: Felaktigt användarnamn eller lösenord
 */
router.post(
  '/login',
  [
    body('username')
      .trim()
      .notEmpty()
      .withMessage('Användarnamn krävs'),
    body('password')
      .notEmpty()
      .withMessage('Lösenord krävs')
  ],
  validateRequest,
  loginUser
);

// Felhanteringsmiddleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Något gick fel på servern' });
});

module.exports = router;