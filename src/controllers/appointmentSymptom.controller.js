const appointmentSymptomService = require('../services/appointmentSymptom.service');

const successResponse = (res, message, data = {}, statusCode = 200) => res.status(statusCode).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createAppointmentSymptom = async (req, res) => {
  try {
    const appointmentSymptom = await appointmentSymptomService.createAppointmentSymptom(
      req.body,
      req.user
    );

    return successResponse(
      res,
      'Appointment symptom created successfully',
      appointmentSymptom,
      201
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

const bulkCreateAppointmentSymptoms = async (req, res) => {
  try {
    const appointmentSymptoms = await appointmentSymptomService.bulkCreateAppointmentSymptoms(
      req.body,
      req.user
    );

    return successResponse(
      res,
      'Appointment symptoms created successfully',
      appointmentSymptoms,
      201
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getSymptomsByAppointment = async (req, res) => {
  try {
    const data = await appointmentSymptomService.getSymptomsByAppointment(
      req.params.appointment_id
    );

    return successResponse(res, 'Appointment symptoms retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getAppointmentsBySymptom = async (req, res) => {
  try {
    const data = await appointmentSymptomService.getAppointmentsBySymptom(
      req.params.symptom_id
    );

    return successResponse(res, 'Symptom appointments retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateAppointmentSymptom = async (req, res) => {
  try {
    const appointmentSymptom = await appointmentSymptomService.updateAppointmentSymptom(
      req.params.id,
      req.body,
      req.user
    );

    return successResponse(
      res,
      'Appointment symptom updated successfully',
      appointmentSymptom
    );
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteAppointmentSymptom = async (req, res) => {
  try {
    await appointmentSymptomService.softDeleteAppointmentSymptom(req.params.id, req.user);
    return successResponse(res, 'Appointment symptom deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createAppointmentSymptom,
  bulkCreateAppointmentSymptoms,
  getSymptomsByAppointment,
  getAppointmentsBySymptom,
  updateAppointmentSymptom,
  softDeleteAppointmentSymptom,
};
