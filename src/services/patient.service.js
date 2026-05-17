const { User } = require('../models');
const patientRepository = require('../repositories/patient.repository');

const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateGender = (gender) => {
  if (gender !== undefined && gender !== null && !VALID_GENDERS.includes(gender)) {
    throw createError('Invalid gender', 400);
  }
};

const toPlain = (record) => (typeof record?.toJSON === 'function' ? record.toJSON() : record);

const mapPatientUser = (userRecord) => {
  const user = toPlain(userRecord);
  const patientProfile = user.patient || {};
  const { patient, ...safeUser } = user;

  return {
    id: patientProfile.id || `user-${user.id}`,
    user_id: user.id,
    date_of_birth: patientProfile.date_of_birth || user.date_of_birth || null,
    gender: patientProfile.gender || null,
    address: patientProfile.address || null,
    insurance_number: patientProfile.insurance_number || null,
    user: safeUser,
  };
};

const createPatient = async (data) => {
  const user = await User.findByPk(data.user_id);
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.role !== 'PATIENT') {
    throw createError('User role must be PATIENT', 400);
  }

  const existingPatient = await patientRepository.findByUserId(data.user_id);
  if (existingPatient) {
    throw createError('Patient profile already exists for this user', 409);
  }

  validateGender(data.gender);

  const patient = await patientRepository.create({
    user_id: data.user_id,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    address: data.address,
    insurance_number: data.insurance_number,
  });

  return patientRepository.findById(patient.id);
};

const getPatients = async ({ page = 1, limit = 10 }) => {
  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await patientRepository.findAllPatientUsers({ offset, limit: safeLimit });

  return {
    patients: result.rows.map(mapPatientUser),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getPatientById = async (id) => {
  const patient = await patientRepository.findById(id);
  if (!patient) {
    throw createError('Patient not found', 404);
  }

  return patient;
};

const getPatientByUserId = async (userId) => {
  const patient = await patientRepository.findByUserId(userId);
  if (!patient) {
    throw createError('Patient not found', 404);
  }

  return patient;
};

const updatePatient = async (id, data) => {
  const allowedFields = ['date_of_birth', 'gender', 'address', 'insurance_number'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  validateGender(updateData.gender);

  const patient = await patientRepository.updateById(id, updateData);
  if (!patient) {
    throw createError('Patient not found', 404);
  }

  return patient;
};

const softDeletePatient = async (id) => {
  const deleted = await patientRepository.softDeleteById(id);
  if (!deleted) {
    throw createError('Patient not found', 404);
  }

  return true;
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  getPatientByUserId,
  updatePatient,
  softDeletePatient,
};
