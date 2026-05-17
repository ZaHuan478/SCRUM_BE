const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

const errorResponse = (res, message) => res.status(400).json({
  success: false,
  message,
});

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isBlank = (value) => value === undefined || value === null || String(value).trim() === '';

const isValidDate = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const validateIdParam = (paramName = 'id') => (req, res, next) => {
  if (!isPositiveInteger(req.params[paramName])) {
    return errorResponse(res, `${paramName} must be a positive integer`);
  }

  return next();
};

const validateStatusValue = (status) => {
  if (status && !VALID_STATUSES.includes(status)) {
    return 'status must be PENDING, CONFIRMED, COMPLETED, or CANCELLED';
  }

  return null;
};

const validateCreateAppointment = (req, res, next) => {
  const allowedFields = ['patient_id', 'doctor_id', 'slot_id', 'reason'];
  const invalidFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
  const {
    patient_id,
    doctor_id,
    slot_id,
    reason,
  } = req.body;

  if (invalidFields.length) {
    return errorResponse(res, `${invalidFields.join(', ')} cannot be set directly`);
  }

  if (!patient_id) {
    return errorResponse(res, 'patient_id is required');
  }

  if (!isPositiveInteger(patient_id)) {
    return errorResponse(res, 'patient_id must be a positive integer');
  }

  if (!doctor_id) {
    return errorResponse(res, 'doctor_id is required');
  }

  if (!isPositiveInteger(doctor_id)) {
    return errorResponse(res, 'doctor_id must be a positive integer');
  }

  if (!slot_id) {
    return errorResponse(res, 'slot_id is required');
  }

  if (!isPositiveInteger(slot_id)) {
    return errorResponse(res, 'slot_id must be a positive integer');
  }

  if (reason !== undefined && reason !== null && isBlank(reason)) {
    return errorResponse(res, 'reason cannot be empty');
  }

  return next();
};

const validateGetAppointments = (req, res, next) => {
  const {
    patient_id,
    doctor_id,
    slot_id,
    status,
    date,
    page,
    limit,
  } = req.query;

  if (patient_id !== undefined && !isPositiveInteger(patient_id)) {
    return errorResponse(res, 'patient_id must be a positive integer');
  }

  if (doctor_id !== undefined && !isPositiveInteger(doctor_id)) {
    return errorResponse(res, 'doctor_id must be a positive integer');
  }

  if (slot_id !== undefined && !isPositiveInteger(slot_id)) {
    return errorResponse(res, 'slot_id must be a positive integer');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  if (date !== undefined && !isValidDate(date)) {
    return errorResponse(res, 'date must use YYYY-MM-DD format');
  }

  if (page !== undefined && !isPositiveInteger(page)) {
    return errorResponse(res, 'page must be a positive integer');
  }

  if (limit !== undefined && !isPositiveInteger(limit)) {
    return errorResponse(res, 'limit must be a positive integer');
  }

  return next();
};

const validateUpdateAppointmentReason = (req, res, next) => {
  const allowedFields = ['reason'];
  const invalidFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
  const { reason } = req.body;

  if (invalidFields.length) {
    return errorResponse(res, `${invalidFields.join(', ')} cannot be updated directly`);
  }

  if (reason === undefined) {
    return errorResponse(res, 'reason is required');
  }

  if (reason !== null && isBlank(reason)) {
    return errorResponse(res, 'reason cannot be empty');
  }

  return next();
};

const validateCancelAppointment = (req, res, next) => {
  const allowedFields = ['cancel_reason'];
  const invalidFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
  const { cancel_reason } = req.body;

  if (invalidFields.length) {
    return errorResponse(res, `${invalidFields.join(', ')} cannot be updated directly`);
  }

  if (cancel_reason !== undefined && cancel_reason !== null && isBlank(cancel_reason)) {
    return errorResponse(res, 'cancel_reason cannot be empty');
  }

  return next();
};

module.exports = {
  validateCreateAppointment,
  validateGetAppointments,
  validateUpdateAppointmentReason,
  validateCancelAppointment,
  validateIdParam,
};
