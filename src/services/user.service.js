const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const cloudinaryService = require('./cloudinary.service');

const SALT_ROUNDS = 10;
const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];
const VALID_ROLES = ['PATIENT', 'DOCTOR', 'ADMIN'];
const USER_EDIT_FIELDS = [
  'full_name',
  'email',
  'phone',
  'avatar_url',
  'role',
  'date_of_birth',
  'cccd_number',
  'cccd_front_image',
  'cccd_back_image',
];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw createError('JWT secret is not configured', 500);
  }

  return process.env.JWT_SECRET;
};

const toSafeUser = (user) => {
  if (!user) return null;

  const plainUser = typeof user.toJSON === 'function' ? user.toJSON() : user;
  const { password, ...safeUser } = plainUser;
  return safeUser;
};

const assertRequired = (payload, fields) => {
  const missingFields = fields.filter((field) => !payload[field]);
  if (missingFields.length > 0) {
    throw createError(`Missing required fields: ${missingFields.join(', ')}`, 400);
  }
};

const normalizeText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalizedValue = String(value).trim();
  return normalizedValue || null;
};

const normalizeEmail = (value) => {
  const normalizedValue = normalizeText(value);
  if (normalizedValue === undefined) return undefined;
  if (normalizedValue === null) {
    throw createError('Email is required', 400);
  }

  const email = normalizedValue.toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError('Email is invalid', 400);
  }

  return email;
};

const normalizePhone = (value) => {
  const normalizedValue = normalizeText(value);
  if (normalizedValue === undefined || normalizedValue === null) return normalizedValue;

  const compactPhone = normalizedValue.replace(/[\s.-]/g, '');
  if (!/^\+?\d{9,15}$/.test(compactPhone)) {
    throw createError('Phone must contain 9 to 15 digits', 400);
  }

  return compactPhone;
};

const normalizeCccdNumber = (value) => {
  const normalizedValue = normalizeText(value);
  if (normalizedValue === undefined || normalizedValue === null) return normalizedValue;

  if (!/^\d{12}$/.test(normalizedValue)) {
    throw createError('CCCD number must be exactly 12 digits', 400);
  }

  return normalizedValue;
};

const normalizeDateOnly = (value) => {
  const normalizedValue = normalizeText(value);
  if (normalizedValue === undefined || normalizedValue === null) return normalizedValue;

  const match = normalizedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw createError('date_of_birth must be in YYYY-MM-DD format', 400);
  }

  const [, year, month, day] = match.map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    throw createError('date_of_birth must be a valid date', 400);
  }

  return normalizedValue;
};

const normalizeCccdImage = (value, fieldName) => {
  const normalizedValue = normalizeText(value);
  if (normalizedValue === undefined || normalizedValue === null) return normalizedValue;

  const isDataImage = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/i.test(normalizedValue);
  if (isDataImage) return normalizedValue;

  try {
    const url = new URL(normalizedValue);
    if (url.protocol === 'http:' || url.protocol === 'https:') return normalizedValue;
  } catch {
    // Continue to the explicit error below.
  }

  throw createError(`${fieldName} must be an image data URL or http/https URL`, 400);
};

const normalizeImageUrl = (value, fieldName) => {
  const normalizedValue = normalizeText(value);
  if (normalizedValue === undefined || normalizedValue === null) return normalizedValue;

  try {
    const url = new URL(normalizedValue);
    if (url.protocol === 'http:' || url.protocol === 'https:') return normalizedValue;
  } catch {
    // Continue to the explicit error below.
  }

  throw createError(`${fieldName} must be an http/https URL`, 400);
};

const isValidImageData = (value) => (
  typeof value === 'string'
  && /^data:image\/(png|jpe?g|webp);base64,/i.test(value)
);

const normalizeUserFields = (data) => {
  const normalized = { ...data };

  if (normalized.full_name !== undefined) normalized.full_name = normalizeText(normalized.full_name);
  if (normalized.email !== undefined) normalized.email = normalizeEmail(normalized.email);
  if (normalized.phone !== undefined) normalized.phone = normalizePhone(normalized.phone);
  if (normalized.avatar_url !== undefined) normalized.avatar_url = normalizeImageUrl(normalized.avatar_url, 'avatar_url');
  if (normalized.cccd_number !== undefined) normalized.cccd_number = normalizeCccdNumber(normalized.cccd_number);
  if (normalized.date_of_birth !== undefined) normalized.date_of_birth = normalizeDateOnly(normalized.date_of_birth);
  if (normalized.cccd_front_image !== undefined) {
    normalized.cccd_front_image = normalizeCccdImage(normalized.cccd_front_image, 'cccd_front_image');
  }
  if (normalized.cccd_back_image !== undefined) {
    normalized.cccd_back_image = normalizeCccdImage(normalized.cccd_back_image, 'cccd_back_image');
  }

  return normalized;
};

const ensureRole = (role) => {
  if (role !== undefined && !VALID_ROLES.includes(role)) {
    throw createError('Invalid role', 400);
  }
};

const ensureStatus = (status) => {
  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    throw createError('Invalid status', 400);
  }
};

const ensureEmailIsUnique = async (email, currentUserId) => {
  if (!email) return;

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser && String(existingUser.id) !== String(currentUserId)) {
    throw createError('Email already exists', 409);
  }
};

const ensureCccdNumberIsUnique = async (cccdNumber, currentUserId) => {
  if (!cccdNumber) return;

  const existingUser = await userRepository.findByCccdNumber(cccdNumber);
  if (existingUser && String(existingUser.id) !== String(currentUserId)) {
    throw createError('CCCD number already exists', 409);
  }
};

const register = async ({
  full_name,
  email,
  password,
  phone,
  avatar_url,
  date_of_birth,
  cccd_number,
  cccd_front_image,
  cccd_back_image,
}) => {
  assertRequired({ email, password }, ['email', 'password']);

  const normalizedData = normalizeUserFields({
    full_name,
    email,
    phone,
    avatar_url,
    date_of_birth,
    cccd_number,
    cccd_front_image,
    cccd_back_image,
  });

  await ensureEmailIsUnique(normalizedData.email);
  await ensureCccdNumberIsUnique(normalizedData.cccd_number);

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.create({
    full_name: normalizedData.full_name,
    email: normalizedData.email,
    password: hashedPassword,
    phone: normalizedData.phone,
    avatar_url: normalizedData.avatar_url,
    date_of_birth: normalizedData.date_of_birth,
    cccd_number: normalizedData.cccd_number,
    cccd_front_image: normalizedData.cccd_front_image,
    cccd_back_image: normalizedData.cccd_back_image,
  });

  return toSafeUser(user);
};

const createUser = async (data) => {
  assertRequired(data, ['email', 'password']);

  const normalizedData = normalizeUserFields(data);
  ensureRole(normalizedData.role);
  ensureStatus(normalizedData.status);
  await ensureEmailIsUnique(normalizedData.email);
  await ensureCccdNumberIsUnique(normalizedData.cccd_number);

  const hashedPassword = await bcrypt.hash(normalizedData.password, SALT_ROUNDS);
  const user = await userRepository.create({
    full_name: normalizedData.full_name,
    email: normalizedData.email,
    password: hashedPassword,
    phone: normalizedData.phone,
    avatar_url: normalizedData.avatar_url,
    date_of_birth: normalizedData.date_of_birth,
    cccd_number: normalizedData.cccd_number,
    cccd_front_image: normalizedData.cccd_front_image,
    cccd_back_image: normalizedData.cccd_back_image,
    role: normalizedData.role || 'PATIENT',
    status: normalizedData.status || 'ACTIVE',
  });

  return toSafeUser(user);
};

const login = async ({ email, password }) => {
  assertRequired({ email, password }, ['email', 'password']);

  const normalizedEmail = normalizeEmail(email);
  const user = await userRepository.findByEmail(normalizedEmail);
  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  if (user.status !== 'ACTIVE') {
    throw createError('User is inactive', 403);
  }

  const token = jwt.sign(
    { sub: String(user.id), role: user.role },
    getJwtSecret(),
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  return {
    token,
    user: toSafeUser(user),
  };
};

const getAllUsers = () => userRepository.findAll();

const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) {
    throw createError('User not found', 404);
  }

  return user;
};

const getCurrentUser = async (currentUser) => {
  if (!currentUser) {
    throw createError('Authentication is required', 401);
  }

  return getUserById(currentUser.id);
};

const updateUser = async (id, data, currentUser) => {
  if (!currentUser) {
    throw createError('Authentication is required', 401);
  }

  const isAdmin = currentUser.role === 'ADMIN';
  const isOwner = String(currentUser.id) === String(id);

  if (!isAdmin && !isOwner) {
    throw createError('Permission denied', 403);
  }

  if (data.password !== undefined) {
    throw createError('Password cannot be updated here', 400);
  }

  if (data.status !== undefined) {
    throw createError('Use status endpoint to update user status', 400);
  }

  if (data.role !== undefined && !isAdmin) {
    throw createError('Only admins can update role', 403);
  }

  const allowedFields = isAdmin
    ? USER_EDIT_FIELDS
    : USER_EDIT_FIELDS.filter((field) => field !== 'role');
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  const normalizedUpdateData = normalizeUserFields(updateData);

  ensureRole(normalizedUpdateData.role);
  await ensureEmailIsUnique(normalizedUpdateData.email, id);
  await ensureCccdNumberIsUnique(normalizedUpdateData.cccd_number, id);

  const user = await userRepository.updateById(id, normalizedUpdateData);
  if (!user) {
    throw createError('User not found', 404);
  }

  return user;
};

const updateCurrentUser = (data, currentUser) => {
  if (!currentUser) {
    throw createError('Authentication is required', 401);
  }

  return updateUser(currentUser.id, data, currentUser);
};

const uploadCurrentUserAvatar = async (imageData, currentUser) => {
  if (!currentUser) {
    throw createError('Authentication is required', 401);
  }

  if (!isValidImageData(imageData)) {
    throw createError('image_data must be a valid base64 image', 400);
  }

  const avatarUrl = await cloudinaryService.uploadImage(imageData, 'avatars');
  const user = await userRepository.updateById(currentUser.id, { avatar_url: avatarUrl });
  if (!user) {
    throw createError('User not found', 404);
  }

  return user;
};

const softDeleteUser = async (id) => {
  const deleted = await userRepository.softDeleteById(id);
  if (!deleted) {
    throw createError('User not found', 404);
  }

  return true;
};

const softDeleteCurrentUser = async (currentUser) => {
  if (!currentUser) {
    throw createError('Authentication is required', 401);
  }

  return softDeleteUser(currentUser.id);
};

const changeUserStatus = async (id, status) => {
  ensureStatus(status);

  const user = await userRepository.changeStatus(id, status);
  if (!user) {
    throw createError('User not found', 404);
  }

  return user;
};

module.exports = {
  register,
  createUser,
  login,
  getAllUsers,
  getUserById,
  getCurrentUser,
  updateUser,
  updateCurrentUser,
  uploadCurrentUserAvatar,
  softDeleteUser,
  softDeleteCurrentUser,
  changeUserStatus,
};
