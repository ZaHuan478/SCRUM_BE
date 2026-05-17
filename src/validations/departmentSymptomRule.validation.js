const errorResponse = (res, message) => res.status(400).json({
  success: false,
  message,
});

const isPositiveInteger = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

const isScore = (value) => /^\d+$/.test(String(value)) && Number(value) >= 1 && Number(value) <= 10;

const validateIdParam = (paramName = 'id') => (req, res, next) => {
  if (!isPositiveInteger(req.params[paramName])) {
    return errorResponse(res, `${paramName} must be a positive integer`);
  }

  return next();
};

const validateOptionalPositiveInteger = (value, fieldName) => {
  if (value !== undefined && !isPositiveInteger(value)) {
    return `${fieldName} must be a positive integer`;
  }

  return null;
};

const validateOptionalScore = (value, fieldName) => {
  if (value !== undefined && !isScore(value)) {
    return `${fieldName} must be an integer from 1 to 10`;
  }

  return null;
};

const validateCreateDepartmentSymptomRule = (req, res, next) => {
  const {
    symptom_id,
    department_id,
    score,
  } = req.body;

  if (!symptom_id) {
    return errorResponse(res, 'symptom_id is required');
  }

  if (!isPositiveInteger(symptom_id)) {
    return errorResponse(res, 'symptom_id must be a positive integer');
  }

  if (!department_id) {
    return errorResponse(res, 'department_id is required');
  }

  if (!isPositiveInteger(department_id)) {
    return errorResponse(res, 'department_id must be a positive integer');
  }

  const scoreError = validateOptionalScore(score, 'score');
  if (scoreError) {
    return errorResponse(res, scoreError);
  }

  return next();
};

const validateGetDepartmentSymptomRules = (req, res, next) => {
  const {
    symptom_id,
    department_id,
    min_score,
    max_score,
    page,
    limit,
  } = req.query;

  const symptomIdError = validateOptionalPositiveInteger(symptom_id, 'symptom_id');
  if (symptomIdError) {
    return errorResponse(res, symptomIdError);
  }

  const departmentIdError = validateOptionalPositiveInteger(department_id, 'department_id');
  if (departmentIdError) {
    return errorResponse(res, departmentIdError);
  }

  const minScoreError = validateOptionalScore(min_score, 'min_score');
  if (minScoreError) {
    return errorResponse(res, minScoreError);
  }

  const maxScoreError = validateOptionalScore(max_score, 'max_score');
  if (maxScoreError) {
    return errorResponse(res, maxScoreError);
  }

  if (min_score !== undefined && max_score !== undefined && Number(min_score) > Number(max_score)) {
    return errorResponse(res, 'min_score must be less than or equal to max_score');
  }

  const pageError = validateOptionalPositiveInteger(page, 'page');
  if (pageError) {
    return errorResponse(res, pageError);
  }

  const limitError = validateOptionalPositiveInteger(limit, 'limit');
  if (limitError) {
    return errorResponse(res, limitError);
  }

  return next();
};

const validateUpdateDepartmentSymptomRule = (req, res, next) => {
  const {
    symptom_id,
    department_id,
    score,
  } = req.body;

  if (symptom_id !== undefined || department_id !== undefined) {
    return errorResponse(res, 'symptom_id and department_id cannot be updated directly');
  }

  if (score === undefined) {
    return errorResponse(res, 'score is required');
  }

  const scoreError = validateOptionalScore(score, 'score');
  if (scoreError) {
    return errorResponse(res, scoreError);
  }

  return next();
};

const validateRecommendDepartments = (req, res, next) => {
  const { symptom_ids } = req.body;

  if (!Array.isArray(symptom_ids) || symptom_ids.length === 0) {
    return errorResponse(res, 'symptom_ids must be a non-empty array');
  }

  const hasInvalidSymptomId = symptom_ids.some((symptomId) => !isPositiveInteger(symptomId));
  if (hasInvalidSymptomId) {
    return errorResponse(res, 'symptom_ids must contain positive integers only');
  }

  return next();
};

module.exports = {
  validateCreateDepartmentSymptomRule,
  validateGetDepartmentSymptomRules,
  validateUpdateDepartmentSymptomRule,
  validateRecommendDepartments,
  validateIdParam,
};
