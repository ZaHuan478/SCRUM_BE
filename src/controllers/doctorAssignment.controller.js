const doctorAssignmentService = require('../services/doctorAssignment.service');

const successResponse = (res, message, data = {}) => res.status(200).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createDoctorAssignment = async (req, res) => {
  try {
    const assignment = await doctorAssignmentService.createDoctorAssignment(req.body);
    return res.status(201).json({
      success: true,
      message: 'Doctor assignment created successfully',
      data: assignment,
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDoctorAssignments = async (req, res) => {
  try {
    const data = await doctorAssignmentService.getDoctorAssignments(req.query);
    return successResponse(res, 'Doctor assignments retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDoctorAssignmentById = async (req, res) => {
  try {
    const assignment = await doctorAssignmentService.getDoctorAssignmentById(req.params.id);
    return successResponse(res, 'Doctor assignment retrieved successfully', assignment);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDoctorsByDepartmentId = async (req, res) => {
  try {
    const data = await doctorAssignmentService.getDoctorsByDepartmentId(req.params.department_id);
    return successResponse(res, 'Doctors retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDoctorDepartments = async (req, res) => {
  try {
    const data = await doctorAssignmentService.getDoctorDepartments(req.params.doctor_id);
    return successResponse(res, 'Doctor departments retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateDoctorAssignment = async (req, res) => {
  try {
    const assignment = await doctorAssignmentService.updateDoctorAssignment(req.params.id, req.body);
    return successResponse(res, 'Doctor assignment updated successfully', assignment);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteDoctorAssignment = async (req, res) => {
  try {
    await doctorAssignmentService.softDeleteDoctorAssignment(req.params.id);
    return successResponse(res, 'Doctor assignment deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const changeDoctorAssignmentStatus = async (req, res) => {
  try {
    const assignment = await doctorAssignmentService.changeDoctorAssignmentStatus(
      req.params.id,
      req.body.status
    );
    return successResponse(res, 'Doctor assignment status changed successfully', assignment);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createDoctorAssignment,
  getDoctorAssignments,
  getDoctorAssignmentById,
  getDoctorsByDepartmentId,
  getDoctorDepartments,
  updateDoctorAssignment,
  softDeleteDoctorAssignment,
  changeDoctorAssignmentStatus,
};
