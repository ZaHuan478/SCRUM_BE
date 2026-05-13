const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

const errorResponse = (res, message) => res.status(400).json({
  success: false,
  message,
});

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isNonNegativeInteger = (value) => /^\d+$/.test(String(value));

const isNonNegativeNumber = (value) => value !== '' && !Number.isNaN(Number(value)) && Number(value) >= 0;

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

const validateCreateDoctor = (req, res, next) => {
  const {
    user_id,
    license_number,
    experience_years,
    consultation_fee,
    status,
  } = req.body;

  if (!user_id) {
    return errorResponse(res, 'user_id is required');
  }

  if (!isPositiveInteger(user_id)) {
    return errorResponse(res, 'user_id must be a positive integer');
  }

  if (!license_number) {
    return errorResponse(res, 'license_number is required');
  }

  if (experience_years !== undefined && !isNonNegativeInteger(experience_years)) {
    return errorResponse(res, 'experience_years must be a non-negative integer');
  }

  if (consultation_fee !== undefined && !isNonNegativeNumber(consultation_fee)) {
    return errorResponse(res, 'consultation_fee must be a non-negative number');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateUpdateDoctor = (req, res, next) => {
  const {
    user_id,
    experience_years,
    consultation_fee,
    status,
  } = req.body;

  if (user_id !== undefined) {
    return errorResponse(res, 'user_id cannot be updated directly');
  }

  if (experience_years !== undefined && !isNonNegativeInteger(experience_years)) {
    return errorResponse(res, 'experience_years must be a non-negative integer');
  }

  if (consultation_fee !== undefined && !isNonNegativeNumber(consultation_fee)) {
    return errorResponse(res, 'consultation_fee must be a non-negative number');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateChangeDoctorStatus = (req, res, next) => {
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

const validateGetDoctors = (req, res, next) => {
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
  validateCreateDoctor,
  validateUpdateDoctor,
  validateChangeDoctorStatus,
  validateGetDoctors,
  validateIdParam,
};
