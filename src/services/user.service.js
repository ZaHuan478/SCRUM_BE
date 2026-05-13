const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');

const SALT_ROUNDS = 10;
const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];
const VALID_ROLES = ['PATIENT', 'DOCTOR', 'ADMIN'];

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

const register = async ({ full_name, email, password, phone }) => {
  assertRequired({ email, password }, ['email', 'password']);

  const existingUser = await userRepository.findByEmail(email);
  if (existingUser) {
    throw createError('Email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await userRepository.create({
    full_name,
    email,
    password: hashedPassword,
    phone,
  });

  return toSafeUser(user);
};

const login = async ({ email, password }) => {
  assertRequired({ email, password }, ['email', 'password']);

  const user = await userRepository.findByEmail(email);
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
    ? ['full_name', 'email', 'phone', 'role']
    : ['full_name', 'email', 'phone'];
  const updateData = {};

  allowedFields.forEach((field) => {
    if (data[field] !== undefined) updateData[field] = data[field];
  });

  if (updateData.role && !VALID_ROLES.includes(updateData.role)) {
    throw createError('Invalid role', 400);
  }

  if (updateData.email) {
    const existingUser = await userRepository.findByEmail(updateData.email);
    if (existingUser && String(existingUser.id) !== String(id)) {
      throw createError('Email already exists', 409);
    }
  }

  const user = await userRepository.updateById(id, updateData);
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

const changeUserStatus = async (id, status) => {
  if (!VALID_STATUSES.includes(status)) {
    throw createError('Invalid status', 400);
  }

  const user = await userRepository.changeStatus(id, status);
  if (!user) {
    throw createError('User not found', 404);
  }

  return user;
};

module.exports = {
  register,
  login,
  getAllUsers,
  getUserById,
  updateUser,
  softDeleteUser,
  changeUserStatus,
};
