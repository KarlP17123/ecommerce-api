const pool = require('../../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // Importera jsonwebtoken

// Registreringsfunktionen
const registerUser = async (req, res) => {
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

    const newUser = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    res.status(201).json({ user: newUser.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfel vid registrering' });
  }
};

// Loginfunktionen med JWT-token
const loginUser = async (req, res) => {
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

    // Skapa JWT-token
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Skicka tillbaka token och användardata
    res.json({
      message: 'Inloggning lyckades!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Serverfel vid inloggning' });
  }
};

module.exports = { registerUser, loginUser };
