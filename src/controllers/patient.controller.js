const patientService = require('../services/patient.service');

const successResponse = (res, message, data = {}) => res.status(200).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createPatient = async (req, res) => {
  try {
    const patient = await patientService.createPatient(req.body);
    return res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      data: patient,
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getPatients = async (req, res) => {
  try {
    const data = await patientService.getPatients(req.query);
    return successResponse(res, 'Patients retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getPatientById = async (req, res) => {
  try {
    const patient = await patientService.getPatientById(req.params.id);
    return successResponse(res, 'Patient retrieved successfully', patient);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getPatientByUserId = async (req, res) => {
  try {
    const patient = await patientService.getPatientByUserId(req.params.user_id);
    return successResponse(res, 'Patient retrieved successfully', patient);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updatePatient = async (req, res) => {
  try {
    const patient = await patientService.updatePatient(req.params.id, req.body);
    return successResponse(res, 'Patient profile updated successfully', patient);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeletePatient = async (req, res) => {
  try {
    await patientService.softDeletePatient(req.params.id);
    return successResponse(res, 'Patient profile deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createPatient,
  getPatients,
  getPatientById,
  getPatientByUserId,
  updatePatient,
  softDeletePatient,
};
