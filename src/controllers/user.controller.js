const userService = require('../services/user.service');

const successResponse = (res, message, data = {}, statusCode = 200) => res.status(statusCode).json({
  success: true,
  message,
  data,
});

const sendError = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const register = async (req, res) => {
  try {
    const user = await userService.register(req.body);
    return successResponse(res, 'Register successfully', user, 201);
  } catch (error) {
    return sendError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const data = await userService.login(req.body);
    return successResponse(res, 'Login successfully', data);
  } catch (error) {
    return sendError(res, error);
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return successResponse(res, 'Users retrieved successfully', users);
  } catch (error) {
    return sendError(res, error);
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return successResponse(res, 'User retrieved successfully', user);
  } catch (error) {
    return sendError(res, error);
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body, req.user);
    return successResponse(res, 'Update successfully', user);
  } catch (error) {
    return sendError(res, error);
  }
};

const softDeleteUser = async (req, res) => {
  try {
    await userService.softDeleteUser(req.params.id);
    return successResponse(res, 'Delete successfully');
  } catch (error) {
    return sendError(res, error);
  }
};

const changeUserStatus = async (req, res) => {
  try {
    const user = await userService.changeUserStatus(req.params.id, req.body.status);
    return successResponse(res, 'Change status successfully', user);
  } catch (error) {
    return sendError(res, error);
  }
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
