const { User } = require('../models');
const cloudinaryService = require('./cloudinary.service');
const doctorRepository = require('../repositories/doctor.repository');

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

const validateNumberFields = ({ experience_years, consultation_fee }) => {
  if (experience_years !== undefined && experience_years !== null && Number(experience_years) < 0) {
    throw createError('experience_years must be greater than or equal to 0', 400);
  }

  if (consultation_fee !== undefined && consultation_fee !== null && Number(consultation_fee) < 0) {
    throw createError('consultation_fee must be greater than or equal to 0', 400);
  }
};

const normalizeText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalizedValue = String(value).trim();
  return normalizedValue || null;
};

const validateUniqueCccd = async (cccd, doctorId) => {
  if (!cccd) return;

  const existingCccd = await doctorRepository.findByCccd(cccd);
  if (existingCccd && String(existingCccd.id) !== String(doctorId || '')) {
    throw createError('CCCD already exists', 409);
  }
};

const createDoctor = async (data) => {
  const user = await User.findByPk(data.user_id);
  if (!user) {
    throw createError('User not found', 404);
  }

  if (user.role !== 'DOCTOR') {
    throw createError('User role must be DOCTOR', 400);
  }

  const existingDoctor = await doctorRepository.findByUserId(data.user_id);
  if (existingDoctor) {
    throw createError('Doctor profile already exists for this user', 409);
  }

  const existingLicense = await doctorRepository.findByLicenseNumber(data.license_number);
  if (existingLicense) {
    throw createError('License number already exists', 409);
  }

  validateStatus(data.status);
  validateNumberFields(data);
  const normalizedCccd = normalizeText(data.cccd);
  await validateUniqueCccd(normalizedCccd);

  const doctor = await doctorRepository.create({
    user_id: data.user_id,
    license_number: data.license_number,
    cccd: normalizedCccd,
    experience_years: data.experience_years,
    description: data.description,
    image_url: normalizeText(data.image_url),
    consultation_fee: data.consultation_fee,
    status: data.status || 'ACTIVE',
  });

  return doctorRepository.findById(doctor.id);
};

const getDoctors = async ({ page = 1, limit = 10, status }) => {
  validateStatus(status);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await doctorRepository.findAll({ offset, limit: safeLimit, status });

  return {
    doctors: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getDoctorById = async (id) => {
  const doctor = await doctorRepository.findById(id);
  if (!doctor) {
    throw createError('Doctor not found', 404);
  }

  return doctor;
};

const getDoctorByUserId = async (userId) => {
  const doctor = await doctorRepository.findByUserId(userId);
  if (!doctor) {
    throw createError('Doctor not found', 404);
  }

  return doctor;
};

const updateDoctor = async (id, data) => {
  const allowedFields = [
    'license_number',
    'cccd',
    'experience_years',
    'description',
    'image_url',
    'consultation_fee',
    'status',
  ];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  validateStatus(updateData.status);
  validateNumberFields(updateData);

  if (updateData.cccd !== undefined) {
    updateData.cccd = normalizeText(updateData.cccd);
    await validateUniqueCccd(updateData.cccd, id);
  }

  if (updateData.image_url !== undefined) {
    updateData.image_url = normalizeText(updateData.image_url);
  }

  if (updateData.license_number) {
    const existingLicense = await doctorRepository.findByLicenseNumber(updateData.license_number);
    if (existingLicense && String(existingLicense.id) !== String(id)) {
      throw createError('License number already exists', 409);
    }
  }

  const doctor = await doctorRepository.updateById(id, updateData);
  if (!doctor) {
    throw createError('Doctor not found', 404);
  }

  return doctor;
};

const updateDoctorImage = async (id, imageData) => {
  await getDoctorById(id);

  const imageUrl = await cloudinaryService.uploadImage(imageData, 'doctors');
  return doctorRepository.updateById(id, { image_url: imageUrl });
};

const softDeleteDoctor = async (id) => {
  const deleted = await doctorRepository.softDeleteById(id);
  if (!deleted) {
    throw createError('Doctor not found', 404);
  }

  return true;
};

const changeDoctorStatus = async (id, status) => {
  validateStatus(status);

  const doctor = await doctorRepository.updateById(id, { status });
  if (!doctor) {
    throw createError('Doctor not found', 404);
  }

  return doctor;
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  getDoctorByUserId,
  updateDoctor,
  updateDoctorImage,
  softDeleteDoctor,
  changeDoctorStatus,
};
