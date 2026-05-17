const VALID_STATUSES = ['AVAILABLE', 'FULL', 'CANCELLED'];
const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const errorResponse = (res, message) => res.status(400).json({
  success: false,
  message,
});

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isValidDateTime = (value) => {
  const match = String(value || '').trim().match(DATE_TIME_PATTERN);
  if (!match) return false;

  const [, year, month, day, hour, minute, second = '0'] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  return (
    date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day)
    && date.getHours() === Number(hour)
    && date.getMinutes() === Number(minute)
    && date.getSeconds() === Number(second)
  );
};

const isValidDateOnly = (value) => {
  if (!DATE_PATTERN.test(String(value || '').trim())) return false;

  const [year, month, day] = String(value).split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
  );
};

const validateIdParam = (paramName = 'id') => (req, res, next) => {
  if (!isPositiveInteger(req.params[paramName])) {
    return errorResponse(res, `${paramName} must be a positive integer`);
  }

  return next();
};

const validateStatusValue = (status) => {
  if (status && !VALID_STATUSES.includes(status)) {
    return 'status must be AVAILABLE, FULL or CANCELLED';
  }

  return null;
};

const validateCreateAppointmentSlot = (req, res, next) => {
  const {
    doctor_assignment_id,
    start_time,
    end_time,
    max_patients,
    status,
  } = req.body;

  if (!doctor_assignment_id) {
    return errorResponse(res, 'doctor_assignment_id is required');
  }

  if (!isPositiveInteger(doctor_assignment_id)) {
    return errorResponse(res, 'doctor_assignment_id must be a positive integer');
  }

  if (!start_time) {
    return errorResponse(res, 'start_time is required');
  }

  if (!isValidDateTime(start_time)) {
    return errorResponse(res, 'start_time must be a valid datetime');
  }

  if (!end_time) {
    return errorResponse(res, 'end_time is required');
  }

  if (!isValidDateTime(end_time)) {
    return errorResponse(res, 'end_time must be a valid datetime');
  }

  if (max_patients !== undefined && !isPositiveInteger(max_patients)) {
    return errorResponse(res, 'max_patients must be greater than 0');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateGetAppointmentSlots = (req, res, next) => {
  const {
    doctor_assignment_id,
    doctor_id,
    department_id,
    date,
    page,
    limit,
    status,
  } = req.query;

  if (doctor_assignment_id !== undefined && !isPositiveInteger(doctor_assignment_id)) {
    return errorResponse(res, 'doctor_assignment_id must be a positive integer');
  }

  if (doctor_id !== undefined && !isPositiveInteger(doctor_id)) {
    return errorResponse(res, 'doctor_id must be a positive integer');
  }

  if (department_id !== undefined && !isPositiveInteger(department_id)) {
    return errorResponse(res, 'department_id must be a positive integer');
  }

  if (date !== undefined && !isValidDateOnly(date)) {
    return errorResponse(res, 'date must be a valid date in YYYY-MM-DD format');
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

const validateUpdateAppointmentSlot = (req, res, next) => {
  const allowedFields = ['start_time', 'end_time', 'max_patients', 'status'];
  const invalidFields = Object.keys(req.body).filter((field) => !allowedFields.includes(field));
  const {
    start_time,
    end_time,
    max_patients,
    status,
  } = req.body;

  if (invalidFields.length) {
    return errorResponse(res, `${invalidFields.join(', ')} cannot be updated directly`);
  }

  if (start_time !== undefined && !isValidDateTime(start_time)) {
    return errorResponse(res, 'start_time must be a valid datetime');
  }

  if (end_time !== undefined && !isValidDateTime(end_time)) {
    return errorResponse(res, 'end_time must be a valid datetime');
  }

  if (max_patients !== undefined && !isPositiveInteger(max_patients)) {
    return errorResponse(res, 'max_patients must be greater than 0');
  }

  const statusError = validateStatusValue(status);
  if (statusError) {
    return errorResponse(res, statusError);
  }

  return next();
};

const validateChangeAppointmentSlotStatus = (req, res, next) => {
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
  validateCreateAppointmentSlot,
  validateGetAppointmentSlots,
  validateUpdateAppointmentSlot,
  validateChangeAppointmentSlotStatus,
  validateIdParam,
};
