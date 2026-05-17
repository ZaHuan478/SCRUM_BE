const express = require('express');
const appointmentSlotController = require('../controllers/appointmentSlot.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  validateChangeAppointmentSlotStatus,
  validateCreateAppointmentSlot,
  validateGetAppointmentSlots,
  validateIdParam,
  validateUpdateAppointmentSlot,
} = require('../validations/appointmentSlot.validation');

const router = express.Router();

router.get(
  '/',
  validateGetAppointmentSlots,
  appointmentSlotController.getAppointmentSlots
);
router.get(
  '/:id',
  validateIdParam('id'),
  appointmentSlotController.getAppointmentSlotById
);
router.post(
  '/',
  authenticate,
  validateCreateAppointmentSlot,
  appointmentSlotController.createAppointmentSlot
);
router.put(
  '/:id',
  authenticate,
  validateIdParam('id'),
  validateUpdateAppointmentSlot,
  appointmentSlotController.updateAppointmentSlot
);
router.delete(
  '/:id',
  authenticate,
  validateIdParam('id'),
  appointmentSlotController.softDeleteAppointmentSlot
);
router.patch(
  '/:id/cancel',
  authenticate,
  validateIdParam('id'),
  appointmentSlotController.cancelAppointmentSlot
);
router.patch(
  '/:id/status',
  authenticate,
  validateIdParam('id'),
  validateChangeAppointmentSlotStatus,
  appointmentSlotController.changeAppointmentSlotStatus
);
router.patch(
  '/:id/book',
  authenticate,
  validateIdParam('id'),
  appointmentSlotController.bookAppointmentSlot
);
router.patch(
  '/:id/release',
  authenticate,
  validateIdParam('id'),
  appointmentSlotController.releaseAppointmentSlot
);

module.exports = router;
