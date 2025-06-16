const pool = require('../../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Registreringsfunktion
const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password } = req.body;

  try {
    const userExists = await pool.query(
      'SELECT * FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (userExists.rows.length > 0) {
      return res.status(400).json({ error: 'Användarnamnet eller e-postadressen är redan taget' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Lägg till 'role' som default 'user'
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'user']
    );

    res.status(201).json({ message: '✅ Registrering lyckades!', user: newUser.rows[0] });
  } catch (err) {
    console.error('❌ Register error:', err);
    res.status(500).json({ error: 'Serverfel vid registrering' });
  }
};

// Loginfunktion
const loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'Felaktigt användarnamn eller lösenord' });
    }

    const user = userResult.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: 'Felaktigt användarnamn eller lösenord' });
    }

    // Inkludera role i token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      message: '✅ Inloggning lyckades!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ error: 'Serverfel vid inloggning' });
  }
};

module.exports = { registerUser, loginUser };
