const jwt = require('jsonwebtoken');
const { User } = require('../models');

const errorResponse = (res, statusCode, message) => res.status(statusCode).json({
  success: false,
  message,
});

const getBearerToken = (authorizationHeader) => {
  if (!authorizationHeader) return null;

  const [scheme, token] = authorizationHeader.split(' ');
  if (scheme !== 'Bearer' || !token) return null;

  return token;
};

const authenticate = async (req, res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) {
      return errorResponse(res, 401, 'Authorization token is required');
    }

    if (!process.env.JWT_SECRET) {
      return errorResponse(res, 500, 'JWT secret is not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.sub || decoded.id;
    if (!userId) {
      return errorResponse(res, 401, 'Invalid token payload');
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return errorResponse(res, 401, 'Authenticated user not found');
    }

    if (user.status !== 'ACTIVE') {
      return errorResponse(res, 403, 'User is inactive');
    }

    req.user = typeof user.toJSON === 'function' ? user.toJSON() : user;
    req.tokenPayload = decoded;

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired');
    }

    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token');
    }

    return errorResponse(res, 500, error.message || 'Internal server error');
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication is required');
  }

  if (!roles.includes(req.user.role)) {
    return errorResponse(res, 403, 'Permission denied');
  }

  return next();
};

const authorizeOwnerOrRoles = (paramName = 'id', ...roles) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication is required');
  }

  if (roles.includes(req.user.role)) {
    return next();
  }

  if (String(req.user.id) === String(req.params[paramName])) {
    return next();
  }

  return errorResponse(res, 403, 'Permission denied');
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrRoles,
};
