const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  // Hämta token från Authorization header (format: "Bearer <token>")
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) return res.status(401).json({ error: 'Ingen token tillhandahållen' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Ogiltig token' });

    // Spara användardata i request-objektet för åtkomst i nästa steg/route
    req.user = user;
    next();
  });
};

module.exports = authenticateToken;
