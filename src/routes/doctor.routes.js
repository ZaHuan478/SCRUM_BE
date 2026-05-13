const express = require('express');
const doctorController = require('../controllers/doctor.controller');
const {
  validateCreateDoctor,
  validateUpdateDoctor,
  validateChangeDoctorStatus,
  validateGetDoctors,
  validateIdParam,
} = require('../validations/doctor.validation');

const router = express.Router();

router.post('/', validateCreateDoctor, doctorController.createDoctor);
router.get('/', validateGetDoctors, doctorController.getDoctors);
router.get('/user/:user_id', validateIdParam('user_id'), doctorController.getDoctorByUserId);
router.get('/:id', validateIdParam('id'), doctorController.getDoctorById);
router.put('/:id', validateIdParam('id'), validateUpdateDoctor, doctorController.updateDoctor);
router.delete('/:id', validateIdParam('id'), doctorController.softDeleteDoctor);
router.patch(
  '/:id/status',
  validateIdParam('id'),
  validateChangeDoctorStatus,
  doctorController.changeDoctorStatus
);

module.exports = router;
