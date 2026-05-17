const departmentSymptomRuleRepository = require('../repositories/departmentSymptomRule.repository');

const MIN_SCORE = 1;
const MAX_SCORE = 10;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeScore = (score) => {
  if (score === undefined || score === null || score === '') return 1;

  return Number(score);
};

const validateScore = (score) => {
  if (!Number.isInteger(Number(score)) || Number(score) < MIN_SCORE || Number(score) > MAX_SCORE) {
    throw createError('score must be an integer from 1 to 10', 400);
  }
};

const ensureSymptomExists = async (symptomId) => {
  const symptom = await departmentSymptomRuleRepository.findSymptomById(symptomId);
  if (!symptom) {
    throw createError('Symptom not found', 404);
  }

  return symptom;
};

const ensureDepartmentExists = async (departmentId) => {
  const department = await departmentSymptomRuleRepository.findDepartmentById(departmentId);
  if (!department) {
    throw createError('Department not found', 404);
  }

  return department;
};

const ensureRuleIsUnique = async ({ symptomId, departmentId, currentRuleId }) => {
  const existingRule = await departmentSymptomRuleRepository.findBySymptomAndDepartment(
    symptomId,
    departmentId
  );

  if (existingRule && String(existingRule.id) !== String(currentRuleId)) {
    throw createError('Department symptom rule already exists', 409);
  }
};

const createDepartmentSymptomRule = async (data, currentUser) => {
  const score = normalizeScore(data.score);
  validateScore(score);

  await ensureSymptomExists(data.symptom_id);
  await ensureDepartmentExists(data.department_id);
  await ensureRuleIsUnique({
    symptomId: data.symptom_id,
    departmentId: data.department_id,
  });

  const rule = await departmentSymptomRuleRepository.create({
    symptom_id: data.symptom_id,
    department_id: data.department_id,
    score,
    created_by: currentUser?.id || null,
  });

  return departmentSymptomRuleRepository.findById(rule.id);
};

const getDepartmentSymptomRules = async ({
  page = 1,
  limit = 10,
  symptom_id,
  department_id,
  min_score,
  max_score,
}) => {
  if (min_score !== undefined) validateScore(min_score);
  if (max_score !== undefined) validateScore(max_score);

  if (
    min_score !== undefined
    && max_score !== undefined
    && Number(min_score) > Number(max_score)
  ) {
    throw createError('min_score must be less than or equal to max_score', 400);
  }

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await departmentSymptomRuleRepository.findAll({
    offset,
    limit: safeLimit,
    symptom_id,
    department_id,
    min_score,
    max_score,
  });

  return {
    department_symptom_rules: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getDepartmentSymptomRuleById = async (id) => {
  const rule = await departmentSymptomRuleRepository.findById(id);
  if (!rule) {
    throw createError('Department symptom rule not found', 404);
  }

  return rule;
};

const updateDepartmentSymptomRule = async (id, data, currentUser) => {
  if (data.symptom_id !== undefined || data.department_id !== undefined) {
    throw createError('symptom_id and department_id cannot be updated directly', 400);
  }

  const score = normalizeScore(data.score);
  validateScore(score);

  const rule = await departmentSymptomRuleRepository.updateById(id, {
    score,
    updated_by: currentUser?.id || null,
  });

  if (!rule) {
    throw createError('Department symptom rule not found', 404);
  }

  return rule;
};

const softDeleteDepartmentSymptomRule = async (id, currentUser) => {
  const deleted = await departmentSymptomRuleRepository.softDeleteById(
    id,
    currentUser?.id || null
  );

  if (!deleted) {
    throw createError('Department symptom rule not found', 404);
  }

  return true;
};

const recommendDepartments = async (symptomIds) => {
  const uniqueSymptomIds = [...new Set(symptomIds.map((id) => Number(id)))];
  const rules = await departmentSymptomRuleRepository.findBySymptomIds(uniqueSymptomIds);
  const groupedDepartments = new Map();

  rules.forEach((ruleRecord) => {
    const rule = typeof ruleRecord.get === 'function'
      ? ruleRecord.get({ plain: true })
      : ruleRecord;

    const departmentId = rule.department_id;
    const current = groupedDepartments.get(departmentId) || {
      department_id: departmentId,
      department_name: rule.department?.name || '',
      total_score: 0,
      matched_symptoms: [],
    };

    current.total_score += Number(rule.score || 0);

    const symptomName = rule.symptom?.name;
    if (symptomName && !current.matched_symptoms.includes(symptomName)) {
      current.matched_symptoms.push(symptomName);
    }

    groupedDepartments.set(departmentId, current);
  });

  return [...groupedDepartments.values()].sort((left, right) => {
    if (right.total_score !== left.total_score) {
      return right.total_score - left.total_score;
    }

    return String(left.department_name).localeCompare(String(right.department_name));
  });
};

module.exports = {
  createDepartmentSymptomRule,
  getDepartmentSymptomRules,
  getDepartmentSymptomRuleById,
  updateDepartmentSymptomRule,
  softDeleteDepartmentSymptomRule,
  recommendDepartments,
};
