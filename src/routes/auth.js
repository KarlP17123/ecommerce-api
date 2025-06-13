const express = require('express');
const { registerUser, loginUser } = require('../controllers/authController');

const router = express.Router();

// Route för registrering
router.post('/register', registerUser);

// Route för inloggning
router.post('/login', loginUser);

module.exports = router;
