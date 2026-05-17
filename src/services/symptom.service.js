const symptomRepository = require('../repositories/symptom.repository');

const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateStatus = (status) => {
  if (status !== undefined && status !== null && !VALID_STATUSES.includes(status)) {
    throw createError('Invalid status', 400);
  }
};

const normalizeText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalizedValue = String(value).trim();
  return normalizedValue || null;
};

const ensureNameIsUnique = async (name, currentSymptomId) => {
  if (!name) return;

  const existingSymptom = await symptomRepository.findByName(name);
  if (existingSymptom && String(existingSymptom.id) !== String(currentSymptomId)) {
    throw createError('Symptom name already exists', 409);
  }
};

const createSymptom = async (data, currentUser) => {
  validateStatus(data.status);

  const name = normalizeText(data.name);
  const bodyPart = normalizeText(data.body_part);
  const description = normalizeText(data.description);

  await ensureNameIsUnique(name);

  const symptom = await symptomRepository.create({
    name,
    body_part: bodyPart,
    description,
    status: data.status || 'ACTIVE',
    created_by: currentUser?.id || null,
  });

  return symptomRepository.findById(symptom.id);
};

const getSymptoms = async ({
  page = 1,
  limit = 10,
  keyword,
  body_part,
  status,
}) => {
  validateStatus(status);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await symptomRepository.findAll({
    offset,
    limit: safeLimit,
    keyword: normalizeText(keyword),
    body_part: normalizeText(body_part),
    status,
  });

  return {
    symptoms: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getSymptomById = async (id) => {
  const symptom = await symptomRepository.findById(id);
  if (!symptom) {
    throw createError('Symptom not found', 404);
  }

  return symptom;
};

const updateSymptom = async (id, data, currentUser) => {
  const currentSymptom = await symptomRepository.findById(id);
  if (!currentSymptom) {
    throw createError('Symptom not found', 404);
  }

  const allowedFields = ['name', 'body_part', 'description', 'status'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  if (updateData.name !== undefined) {
    updateData.name = normalizeText(updateData.name);
    await ensureNameIsUnique(updateData.name, id);
  }

  if (updateData.body_part !== undefined) {
    updateData.body_part = normalizeText(updateData.body_part);
  }

  if (updateData.description !== undefined) {
    updateData.description = normalizeText(updateData.description);
  }

  validateStatus(updateData.status);
  updateData.updated_by = currentUser?.id || null;

  const symptom = await symptomRepository.updateById(id, updateData);
  if (!symptom) {
    throw createError('Symptom not found', 404);
  }

  return symptom;
};

const softDeleteSymptom = async (id, currentUser) => {
  const deleted = await symptomRepository.softDeleteById(id, currentUser?.id || null);
  if (!deleted) {
    throw createError('Symptom not found', 404);
  }

  return true;
};

const changeSymptomStatus = async (id, status, currentUser) => {
  validateStatus(status);

  const symptom = await symptomRepository.updateById(id, {
    status,
    updated_by: currentUser?.id || null,
  });

  if (!symptom) {
    throw createError('Symptom not found', 404);
  }

  return symptom;
};

module.exports = {
  createSymptom,
  getSymptoms,
  getSymptomById,
  updateSymptom,
  softDeleteSymptom,
  changeSymptomStatus,
};
