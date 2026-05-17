const appointmentSlotService = require('../services/appointmentSlot.service');

const successResponse = (res, message, data = {}, statusCode = 200) => res.status(statusCode).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createAppointmentSlot = async (req, res) => {
  try {
    const slot = await appointmentSlotService.createAppointmentSlot(req.body, req.user);
    return successResponse(res, 'Appointment slot created successfully', slot, 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getAppointmentSlots = async (req, res) => {
  try {
    const data = await appointmentSlotService.getAppointmentSlots(req.query);
    return successResponse(res, 'Appointment slots retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getAppointmentSlotById = async (req, res) => {
  try {
    const slot = await appointmentSlotService.getAppointmentSlotById(req.params.id);
    return successResponse(res, 'Appointment slot retrieved successfully', slot);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateAppointmentSlot = async (req, res) => {
  try {
    const slot = await appointmentSlotService.updateAppointmentSlot(
      req.params.id,
      req.body,
      req.user
    );
    return successResponse(res, 'Appointment slot updated successfully', slot);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteAppointmentSlot = async (req, res) => {
  try {
    await appointmentSlotService.softDeleteAppointmentSlot(req.params.id, req.user);
    return successResponse(res, 'Appointment slot deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const cancelAppointmentSlot = async (req, res) => {
  try {
    const slot = await appointmentSlotService.cancelAppointmentSlot(req.params.id, req.user);
    return successResponse(res, 'Appointment slot cancelled successfully', slot);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const changeAppointmentSlotStatus = async (req, res) => {
  try {
    const slot = await appointmentSlotService.changeAppointmentSlotStatus(
      req.params.id,
      req.body.status,
      req.user
    );
    return successResponse(res, 'Appointment slot status changed successfully', slot);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const bookAppointmentSlot = async (req, res) => {
  try {
    const slot = await appointmentSlotService.bookAppointmentSlot(req.params.id, req.user);
    return successResponse(res, 'Appointment slot booked successfully', slot);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const releaseAppointmentSlot = async (req, res) => {
  try {
    const slot = await appointmentSlotService.releaseAppointmentSlot(req.params.id, req.user);
    return successResponse(res, 'Appointment slot released successfully', slot);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createAppointmentSlot,
  getAppointmentSlots,
  getAppointmentSlotById,
  updateAppointmentSlot,
  softDeleteAppointmentSlot,
  cancelAppointmentSlot,
  changeAppointmentSlotStatus,
  bookAppointmentSlot,
  releaseAppointmentSlot,
};
