const appointmentService = require('../services/appointment.service');

const successResponse = (res, message, data = {}) => res.status(200).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.createAppointment(req.body, req.user);
    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: appointment,
    });
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getAppointments = async (req, res) => {
  try {
    const data = await appointmentService.getAppointments(req.query);
    return successResponse(res, 'Appointments retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await appointmentService.getAppointmentById(req.params.id);
    return successResponse(res, 'Appointment retrieved successfully', appointment);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateAppointmentReason = async (req, res) => {
  try {
    const appointment = await appointmentService.updateAppointmentReason(
      req.params.id,
      req.body,
      req.user
    );
    return successResponse(res, 'Appointment reason updated successfully', appointment);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const confirmAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.confirmAppointment(req.params.id, req.user);
    return successResponse(res, 'Appointment confirmed successfully', appointment);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const completeAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.completeAppointment(req.params.id, req.user);
    return successResponse(res, 'Appointment completed successfully', appointment);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await appointmentService.cancelAppointment(req.params.id, req.body, req.user);
    return successResponse(res, 'Appointment cancelled successfully', appointment);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteAppointment = async (req, res) => {
  try {
    await appointmentService.softDeleteAppointment(req.params.id, req.user);
    return successResponse(res, 'Appointment deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentReason,
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  softDeleteAppointment,
};
