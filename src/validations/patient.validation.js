const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const errorResponse = (res, message) => res.status(400).json({
  success: false,
  message,
});

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isValidDateOnly = (value) => {
  if (!value) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value));
};

const validateIdParam = (paramName = 'id') => (req, res, next) => {
  if (!isPositiveInteger(req.params[paramName])) {
    return errorResponse(res, `${paramName} must be a positive integer`);
  }

  return next();
};

const validateCreatePatient = (req, res, next) => {
  const { user_id, date_of_birth, gender } = req.body;

  if (!user_id) {
    return errorResponse(res, 'user_id is required');
  }

  if (!isPositiveInteger(user_id)) {
    return errorResponse(res, 'user_id must be a positive integer');
  }

  if (!isValidDateOnly(date_of_birth)) {
    return errorResponse(res, 'date_of_birth must use YYYY-MM-DD format');
  }

  if (gender && !VALID_GENDERS.includes(gender)) {
    return errorResponse(res, 'gender must be MALE, FEMALE, or OTHER');
  }

  return next();
};

const validateUpdatePatient = (req, res, next) => {
  const { user_id, date_of_birth, gender } = req.body;

  if (user_id !== undefined) {
    return errorResponse(res, 'user_id cannot be updated directly');
  }

  if (!isValidDateOnly(date_of_birth)) {
    return errorResponse(res, 'date_of_birth must use YYYY-MM-DD format');
  }

  if (gender && !VALID_GENDERS.includes(gender)) {
    return errorResponse(res, 'gender must be MALE, FEMALE, or OTHER');
  }

  return next();
};

const validatePagination = (req, res, next) => {
  const { page, limit } = req.query;

  if (page !== undefined && !isPositiveInteger(page)) {
    return errorResponse(res, 'page must be a positive integer');
  }

  if (limit !== undefined && !isPositiveInteger(limit)) {
    return errorResponse(res, 'limit must be a positive integer');
  }

  return next();
};

module.exports = {
  validateCreatePatient,
  validateUpdatePatient,
  validateIdParam,
  validatePagination,
};
