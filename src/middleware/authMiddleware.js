const jwt = require('jsonwebtoken');

/**
 * Middleware för att autentisera JWT-token i Authorization-headern.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Ingen eller ogiltig Authorization-header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Lägg till decoded user-data i request
    next();
  } catch (err) {
    console.error('JWT-verifiering misslyckades:', err.message);
    return res.status(403).json({ error: 'Ogiltig eller utgången token' });
  }
};

/**
 * Middleware för att kontrollera användarens roll(er).
 * @param {...string} roles - En eller flera roller som är tillåtna.
 */
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Åtkomst nekad: Otillräckliga rättigheter' });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRole,
};
