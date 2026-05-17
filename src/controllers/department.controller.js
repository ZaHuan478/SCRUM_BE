const departmentService = require('../services/department.service');

const successResponse = (res, message, data = {}) => res.status(200).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createDepartment = async (req, res) => {
  try {
    const department = await departmentService.createDepartment(req.body);
    return res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department,
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDepartments = async (req, res) => {
  try {
    const data = await departmentService.getDepartments(req.query);
    return successResponse(res, 'Departments retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    return successResponse(res, 'Department retrieved successfully', department);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateDepartment = async (req, res) => {
  try {
    const department = await departmentService.updateDepartment(req.params.id, req.body);
    return successResponse(res, 'Department updated successfully', department);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteDepartment = async (req, res) => {
  try {
    await departmentService.softDeleteDepartment(req.params.id);
    return successResponse(res, 'Department deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const changeDepartmentStatus = async (req, res) => {
  try {
    const department = await departmentService.changeDepartmentStatus(req.params.id, req.body.status);
    return successResponse(res, 'Department status changed successfully', department);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  softDeleteDepartment,
  changeDepartmentStatus,
};
