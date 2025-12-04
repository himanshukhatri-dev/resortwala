const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'resortwala-secret-key-change-this', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Middleware to check if user is vendor (or admin)
const requireHost = (req, res, next) => {
  if (!req.user || (req.user.role !== 'vendor' && req.user.role !== 'admin')) {
    return res.status(403).json({ error: 'Vendor access required' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireAdmin,
  requireHost
};