const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

const errorResponse = (res, message) => res.status(400).json({
  success: false,
  message,
});

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const validateIdParam = (paramName = 'id') => (req, res, next) => {
  if (!isPositiveInteger(req.params[paramName])) {
    return errorResponse(res, `${paramName} must be a positive integer`);
  }

  return next();
};

const validateStatusValue = (status) => {
  if (status && !VALID_STATUSES.includes(status)) {
    return 'status must be ACTIVE or INACTIVE';
  }

  return null;
};

const validateCreateSymptom = (req, res, next) => {
  const { name, status } = req.body;

  if (isBlank(name)) {
    return errorResponse(res, 'name is required');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateUpdateSymptom = (req, res, next) => {
  const { name, status } = req.body;

  if (name !== undefined && isBlank(name)) {
    return errorResponse(res, 'name cannot be empty');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateChangeSymptomStatus = (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return errorResponse(res, 'status is required');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateGetSymptoms = (req, res, next) => {
  const { page, limit, status } = req.query;

  if (page !== undefined && !isPositiveInteger(page)) {
    return errorResponse(res, 'page must be a positive integer');
  }

  if (limit !== undefined && !isPositiveInteger(limit)) {
    return errorResponse(res, 'limit must be a positive integer');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

module.exports = {
  validateCreateSymptom,
  validateUpdateSymptom,
  validateChangeSymptomStatus,
  validateGetSymptoms,
  validateIdParam,
};
