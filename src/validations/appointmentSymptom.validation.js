const errorResponse = (res, message) => res.status(400).json({
  success: false,
  message,
});

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isSeverity = (value) => (
  /^\d+$/.test(String(value))
  && Number(value) >= 1
  && Number(value) <= 5
);

const validateIdParam = (paramName = 'id') => (req, res, next) => {
  if (!isPositiveInteger(req.params[paramName])) {
    return errorResponse(res, `${paramName} must be a positive integer`);
  }

  return next();
};

const rejectInvalidFields = (payload, allowedFields) => Object
  .keys(payload)
  .filter((field) => !allowedFields.includes(field));

const validateRequiredPositiveInteger = (value, fieldName) => {
  if (!value) return `${fieldName} is required`;
  if (!isPositiveInteger(value)) return `${fieldName} must be a positive integer`;

  return null;
};

const validateRequiredSeverity = (value) => {
  if (value === undefined || value === null || value === '') {
    return 'severity is required';
  }

  if (!isSeverity(value)) {
    return 'severity must be an integer from 1 to 5';
  }

  return null;
};

const validateCreateAppointmentSymptom = (req, res, next) => {
  const allowedFields = ['appointment_id', 'symptom_id', 'severity', 'note'];
  const invalidFields = rejectInvalidFields(req.body, allowedFields);
  const {
    appointment_id,
    symptom_id,
    severity,
  } = req.body;

  if (invalidFields.length) {
    return errorResponse(res, `${invalidFields.join(', ')} cannot be set directly`);
  }

  const appointmentIdError = validateRequiredPositiveInteger(appointment_id, 'appointment_id');
  if (appointmentIdError) {
    return errorResponse(res, appointmentIdError);
  }

  const symptomIdError = validateRequiredPositiveInteger(symptom_id, 'symptom_id');
  if (symptomIdError) {
    return errorResponse(res, symptomIdError);
  }

  const severityError = validateRequiredSeverity(severity);
  if (severityError) {
    return errorResponse(res, severityError);
  }

  return next();
};

const validateBulkCreateAppointmentSymptoms = (req, res, next) => {
  const allowedFields = ['appointment_id', 'symptoms'];
  const invalidFields = rejectInvalidFields(req.body, allowedFields);
  const { appointment_id, symptoms } = req.body;

  if (invalidFields.length) {
    return errorResponse(res, `${invalidFields.join(', ')} cannot be set directly`);
  }

  const appointmentIdError = validateRequiredPositiveInteger(appointment_id, 'appointment_id');
  if (appointmentIdError) {
    return errorResponse(res, appointmentIdError);
  }

  if (!Array.isArray(symptoms) || symptoms.length === 0) {
    return errorResponse(res, 'symptoms must be a non-empty array');
  }

  const seenSymptomIds = new Set();

  for (let index = 0; index < symptoms.length; index += 1) {
    const symptom = symptoms[index];
    const symptomPath = `symptoms[${index}]`;

    if (!symptom || typeof symptom !== 'object' || Array.isArray(symptom)) {
      return errorResponse(res, `${symptomPath} must be an object`);
    }

    const symptomInvalidFields = rejectInvalidFields(symptom, ['symptom_id', 'severity', 'note']);
    if (symptomInvalidFields.length) {
      return errorResponse(
        res,
        `${symptomPath}.${symptomInvalidFields.join(`, ${symptomPath}.`)} cannot be set directly`
      );
    }

    const symptomIdError = validateRequiredPositiveInteger(
      symptom.symptom_id,
      `${symptomPath}.symptom_id`
    );
    if (symptomIdError) {
      return errorResponse(res, symptomIdError);
    }

    const severityError = validateRequiredSeverity(symptom.severity);
    if (severityError) {
      return errorResponse(res, `${symptomPath}.${severityError}`);
    }

    if (seenSymptomIds.has(String(symptom.symptom_id))) {
      return errorResponse(res, `Duplicate symptom_id in request: ${symptom.symptom_id}`);
    }

    seenSymptomIds.add(String(symptom.symptom_id));
  }

  return next();
};

const validateUpdateAppointmentSymptom = (req, res, next) => {
  const allowedFields = ['severity', 'note'];
  const invalidFields = rejectInvalidFields(req.body, allowedFields);
  const { severity, note } = req.body;

  if (invalidFields.length) {
    return errorResponse(res, `${invalidFields.join(', ')} cannot be updated directly`);
  }

  if (severity === undefined && note === undefined) {
    return errorResponse(res, 'severity or note is required');
  }

  if (severity !== undefined && !isSeverity(severity)) {
    return errorResponse(res, 'severity must be an integer from 1 to 5');
  }

  return next();
};

module.exports = {
  validateBulkCreateAppointmentSymptoms,
  validateCreateAppointmentSymptom,
  validateIdParam,
  validateUpdateAppointmentSymptom,
};
