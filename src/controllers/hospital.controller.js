const hospitalService = require('../services/hospital.service');

const successResponse = (res, message, data = {}) => res.status(200).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createHospital = async (req, res) => {
  try {
    const hospital = await hospitalService.createHospital(req.body);
    return res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: hospital,
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getHospitals = async (req, res) => {
  try {
    const data = await hospitalService.getHospitals(req.query);
    return successResponse(res, 'Hospitals retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getHospitalById = async (req, res) => {
  try {
    const hospital = await hospitalService.getHospitalById(req.params.id);
    return successResponse(res, 'Hospital retrieved successfully', hospital);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateHospital = async (req, res) => {
  try {
    const hospital = await hospitalService.updateHospital(req.params.id, req.body);
    return successResponse(res, 'Hospital updated successfully', hospital);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteHospital = async (req, res) => {
  try {
    await hospitalService.softDeleteHospital(req.params.id);
    return successResponse(res, 'Hospital deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const changeHospitalStatus = async (req, res) => {
  try {
    const hospital = await hospitalService.changeHospitalStatus(req.params.id, req.body.status);
    return successResponse(res, 'Hospital status changed successfully', hospital);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  softDeleteHospital,
  changeHospitalStatus,
};
