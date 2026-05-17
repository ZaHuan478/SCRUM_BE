const express = require('express');
const appointmentController = require('../controllers/appointment.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  validateCancelAppointment,
  validateCreateAppointment,
  validateGetAppointments,
  validateIdParam,
  validateUpdateAppointmentReason,
} = require('../validations/appointment.validation');

const router = express.Router();

router.use(authenticate);

router.post('/', validateCreateAppointment, appointmentController.createAppointment);
router.get('/', validateGetAppointments, appointmentController.getAppointments);
router.get('/:id', validateIdParam('id'), appointmentController.getAppointmentById);
router.put(
  '/:id',
  validateIdParam('id'),
  validateUpdateAppointmentReason,
  appointmentController.updateAppointmentReason
);
router.patch('/:id/confirm', validateIdParam('id'), appointmentController.confirmAppointment);
router.patch('/:id/complete', validateIdParam('id'), appointmentController.completeAppointment);
router.patch(
  '/:id/cancel',
  validateIdParam('id'),
  validateCancelAppointment,
  appointmentController.cancelAppointment
);
router.delete('/:id', validateIdParam('id'), appointmentController.softDeleteAppointment);

module.exports = router;
