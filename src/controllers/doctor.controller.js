const doctorService = require('../services/doctor.service');

const successResponse = (res, message, data = {}) => res.status(200).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.createDoctor(req.body);
    return res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: doctor,
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDoctors = async (req, res) => {
  try {
    const data = await doctorService.getDoctors(req.query);
    return successResponse(res, 'Doctors retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDoctorById = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorById(req.params.id);
    return successResponse(res, 'Doctor retrieved successfully', doctor);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDoctorByUserId = async (req, res) => {
  try {
    const doctor = await doctorService.getDoctorByUserId(req.params.user_id);
    return successResponse(res, 'Doctor retrieved successfully', doctor);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateDoctor = async (req, res) => {
  try {
    const doctor = await doctorService.updateDoctor(req.params.id, req.body);
    return successResponse(res, 'Doctor profile updated successfully', doctor);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteDoctor = async (req, res) => {
  try {
    await doctorService.softDeleteDoctor(req.params.id);
    return successResponse(res, 'Doctor profile deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const changeDoctorStatus = async (req, res) => {
  try {
    const doctor = await doctorService.changeDoctorStatus(req.params.id, req.body.status);
    return successResponse(res, 'Doctor status changed successfully', doctor);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createDoctor,
  getDoctors,
  getDoctorById,
  getDoctorByUserId,
  updateDoctor,
  softDeleteDoctor,
  changeDoctorStatus,
};
