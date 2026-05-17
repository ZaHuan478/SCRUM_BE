const symptomService = require('../services/symptom.service');

const successResponse = (res, message, data = {}, statusCode = 200) => res.status(statusCode).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createSymptom = async (req, res) => {
  try {
    const symptom = await symptomService.createSymptom(req.body, req.user);
    return successResponse(res, 'Symptom created successfully', symptom, 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getSymptoms = async (req, res) => {
  try {
    const data = await symptomService.getSymptoms(req.query);
    return successResponse(res, 'Symptoms retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getSymptomById = async (req, res) => {
  try {
    const symptom = await symptomService.getSymptomById(req.params.id);
    return successResponse(res, 'Symptom retrieved successfully', symptom);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateSymptom = async (req, res) => {
  try {
    const symptom = await symptomService.updateSymptom(req.params.id, req.body, req.user);
    return successResponse(res, 'Symptom updated successfully', symptom);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteSymptom = async (req, res) => {
  try {
    await symptomService.softDeleteSymptom(req.params.id, req.user);
    return successResponse(res, 'Symptom deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const changeSymptomStatus = async (req, res) => {
  try {
    const symptom = await symptomService.changeSymptomStatus(
      req.params.id,
      req.body.status,
      req.user
    );
    return successResponse(res, 'Symptom status changed successfully', symptom);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createSymptom,
  getSymptoms,
  getSymptomById,
  updateSymptom,
  softDeleteSymptom,
  changeSymptomStatus,
};
