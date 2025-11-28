const jwt = require('jsonwebtoken');

const ROLE_ORDER = { regular: 1, cashier: 2, manager: 3, superuser: 4 };

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  // No authorization header 
  if (!authHeader) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }

  const token = authHeader.split(' ')[1];  // "Bearer <token>"
    if (!token) {
      return res.status(401).json({ error: 'Missing bearer token' });
    }

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      req.auth = payload;  // attaches payload to request
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

function requireRole(minRole) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ error: 'Unauthorized' });
    const role = req.auth.role;
    if (ROLE_ORDER[role] < ROLE_ORDER[minRole]) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };