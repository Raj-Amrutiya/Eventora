const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const auth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    throw new HttpError(401, 'Authentication required.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch {
    throw new HttpError(401, 'Invalid or expired token.');
  }

  const user = await User.findById(decoded.userId).select('-password');
  if (!user) {
    throw new HttpError(401, 'User no longer exists.');
  }

  if (user.isBlocked) {
    throw new HttpError(403, 'Your account is blocked. Contact admin.');
  }

  req.user = user;
  next();
});

const requireAdmin = (req, _res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new HttpError(403, 'Admin access required.'));
  }
  next();
};

module.exports = { auth, requireAdmin };
