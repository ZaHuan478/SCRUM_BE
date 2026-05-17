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

const validateCreateDoctorAssignment = (req, res, next) => {
  const {
    doctor_id,
    department_id,
    position,
    status,
  } = req.body;

  if (!doctor_id) {
    return errorResponse(res, 'doctor_id is required');
  }

  if (!isPositiveInteger(doctor_id)) {
    return errorResponse(res, 'doctor_id must be a positive integer');
  }

  if (!department_id) {
    return errorResponse(res, 'department_id is required');
  }

  if (!isPositiveInteger(department_id)) {
    return errorResponse(res, 'department_id must be a positive integer');
  }

  if (position !== undefined && position !== null && isBlank(position)) {
    return errorResponse(res, 'position cannot be empty');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateGetDoctorAssignments = (req, res, next) => {
  const {
    doctor_id,
    department_id,
    page,
    limit,
    status,
  } = req.query;

  if (doctor_id !== undefined && !isPositiveInteger(doctor_id)) {
    return errorResponse(res, 'doctor_id must be a positive integer');
  }

  if (department_id !== undefined && !isPositiveInteger(department_id)) {
    return errorResponse(res, 'department_id must be a positive integer');
  }

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

const validateUpdateDoctorAssignment = (req, res, next) => {
  const allowedFields = ['position', 'status'];
  const invalidFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
  const { position, status } = req.body;

  if (invalidFields.length) {
    return errorResponse(res, `${invalidFields.join(', ')} cannot be updated directly`);
  }

  if (position !== undefined && position !== null && isBlank(position)) {
    return errorResponse(res, 'position cannot be empty');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateChangeDoctorAssignmentStatus = (req, res, next) => {
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

module.exports = {
  validateCreateDoctorAssignment,
  validateGetDoctorAssignments,
  validateUpdateDoctorAssignment,
  validateChangeDoctorAssignmentStatus,
  validateIdParam,
};
