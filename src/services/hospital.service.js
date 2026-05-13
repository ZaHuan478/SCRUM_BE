const hospitalRepository = require('../repositories/hospital.repository');

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

const normalizeEmail = (email) => {
  if (email === undefined) return undefined;

  const normalizedEmail = String(email || '').trim().toLowerCase();
  return normalizedEmail || null;
};

const ensureEmailIsUnique = async (email, currentHospitalId) => {
  if (!email) return;

  const existingHospital = await hospitalRepository.findByEmail(email);
  if (existingHospital && String(existingHospital.id) !== String(currentHospitalId)) {
    throw createError('Hospital email already exists', 409);
  }
};

const createHospital = async (data) => {
  validateStatus(data.status);

  const email = normalizeEmail(data.email);
  await ensureEmailIsUnique(email);

  return hospitalRepository.create({
    name: data.name,
    address: data.address,
    phone: data.phone,
    email,
    city: data.city,
    status: data.status || 'ACTIVE',
  });
};

const getHospitals = async ({
  page = 1,
  limit = 10,
  keyword,
  city,
  status,
}) => {
  validateStatus(status);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await hospitalRepository.findAll({
    offset,
    limit: safeLimit,
    keyword,
    city,
    status,
  });

  return {
    hospitals: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getHospitalById = async (id) => {
  const hospital = await hospitalRepository.findById(id);
  if (!hospital) {
    throw createError('Hospital not found', 404);
  }

  return hospital;
};

const updateHospital = async (id, data) => {
  const allowedFields = ['name', 'address', 'phone', 'email', 'city', 'status'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  validateStatus(updateData.status);

  if (updateData.email !== undefined) {
    updateData.email = normalizeEmail(updateData.email);
    await ensureEmailIsUnique(updateData.email, id);
  }

  const hospital = await hospitalRepository.updateById(id, updateData);
  if (!hospital) {
    throw createError('Hospital not found', 404);
  }

  return hospital;
};

const softDeleteHospital = async (id) => {
  const deleted = await hospitalRepository.softDeleteById(id);
  if (!deleted) {
    throw createError('Hospital not found', 404);
  }

  return true;
};

const changeHospitalStatus = async (id, status) => {
  validateStatus(status);

  const hospital = await hospitalRepository.updateById(id, { status });
  if (!hospital) {
    throw createError('Hospital not found', 404);
  }

  return hospital;
};

module.exports = {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  softDeleteHospital,
  changeHospitalStatus,
};
