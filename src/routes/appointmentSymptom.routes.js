const express = require('express');
const appointmentSymptomController = require('../controllers/appointmentSymptom.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  validateBulkCreateAppointmentSymptoms,
  validateCreateAppointmentSymptom,
  validateIdParam,
  validateUpdateAppointmentSymptom,
} = require('../validations/appointmentSymptom.validation');

const router = express.Router();

router.use(authenticate);

router.post(
  '/bulk',
  validateBulkCreateAppointmentSymptoms,
  appointmentSymptomController.bulkCreateAppointmentSymptoms
);
router.post(
  '/',
  validateCreateAppointmentSymptom,
  appointmentSymptomController.createAppointmentSymptom
);
router.get(
  '/appointment/:appointment_id',
  validateIdParam('appointment_id'),
  appointmentSymptomController.getSymptomsByAppointment
);
router.get(
  '/symptom/:symptom_id',
  validateIdParam('symptom_id'),
  appointmentSymptomController.getAppointmentsBySymptom
);
router.put(
  '/:id',
  validateIdParam('id'),
  validateUpdateAppointmentSymptom,
  appointmentSymptomController.updateAppointmentSymptom
);
router.delete(
  '/:id',
  validateIdParam('id'),
  appointmentSymptomController.softDeleteAppointmentSymptom
);

module.exports = router;
