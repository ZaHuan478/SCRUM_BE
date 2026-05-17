const express = require('express');
const patientController = require('../controllers/patient.controller');
const {
  validateCreatePatient,
  validateUpdatePatient,
  validateIdParam,
  validatePagination,
} = require('../validations/patient.validation');

const router = express.Router();

router.post('/', validateCreatePatient, patientController.createPatient);
router.get('/', validatePagination, patientController.getPatients);
router.get('/user/:user_id', validateIdParam('user_id'), patientController.getPatientByUserId);
router.get('/:id', validateIdParam('id'), patientController.getPatientById);
router.put('/:id', validateIdParam('id'), validateUpdatePatient, patientController.updatePatient);
router.delete('/:id', validateIdParam('id'), patientController.softDeletePatient);

module.exports = router;
