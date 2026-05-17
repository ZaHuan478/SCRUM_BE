const departmentRepository = require('../repositories/department.repository');

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

const ensureDepartmentNameIsUnique = async ({
  name,
  currentDepartmentId,
}) => {
  if (!name) return;

  const existingDepartment = await departmentRepository.findByName(name);
  if (existingDepartment && String(existingDepartment.id) !== String(currentDepartmentId)) {
    throw createError('Department name already exists', 409);
  }
};

const createDepartment = async (data) => {
  validateStatus(data.status);

  const name = normalizeText(data.name);
  const description = normalizeText(data.description);

  await ensureDepartmentNameIsUnique({
    name,
  });

  const department = await departmentRepository.create({
    name,
    description,
    status: data.status || 'ACTIVE',
  });

  return departmentRepository.findById(department.id);
};

const getDepartments = async ({
  page = 1,
  limit = 10,
  keyword,
  status,
}) => {
  validateStatus(status);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await departmentRepository.findAll({
    offset,
    limit: safeLimit,
    keyword: normalizeText(keyword),
    status,
  });

  return {
    departments: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getDepartmentById = async (id) => {
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw createError('Department not found', 404);
  }

  return department;
};

const updateDepartment = async (id, data) => {
  const currentDepartment = await departmentRepository.findById(id);
  if (!currentDepartment) {
    throw createError('Department not found', 404);
  }

  const allowedFields = ['name', 'description', 'status'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  if (updateData.name !== undefined) {
    updateData.name = normalizeText(updateData.name);
    await ensureDepartmentNameIsUnique({
      name: updateData.name,
      currentDepartmentId: id,
    });
  }

  if (updateData.description !== undefined) {
    updateData.description = normalizeText(updateData.description);
  }

  validateStatus(updateData.status);

  const department = await departmentRepository.updateById(id, updateData);
  if (!department) {
    throw createError('Department not found', 404);
  }

  return department;
};

const softDeleteDepartment = async (id) => {
  const deleted = await departmentRepository.softDeleteById(id);
  if (!deleted) {
    throw createError('Department not found', 404);
  }

  return true;
};

const changeDepartmentStatus = async (id, status) => {
  validateStatus(status);

  const department = await departmentRepository.updateById(id, { status });
  if (!department) {
    throw createError('Department not found', 404);
  }

  return department;
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  softDeleteDepartment,
  changeDepartmentStatus,
};
