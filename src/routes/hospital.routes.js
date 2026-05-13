const express = require('express');
const hospitalController = require('../controllers/hospital.controller');
const {
  validateCreateHospital,
  validateUpdateHospital,
  validateChangeHospitalStatus,
  validateGetHospitals,
  validateIdParam,
} = require('../validations/hospital.validation');

const router = express.Router();

router.post('/', validateCreateHospital, hospitalController.createHospital);
router.get('/', validateGetHospitals, hospitalController.getHospitals);
router.get('/:id', validateIdParam('id'), hospitalController.getHospitalById);
router.put('/:id', validateIdParam('id'), validateUpdateHospital, hospitalController.updateHospital);
router.delete('/:id', validateIdParam('id'), hospitalController.softDeleteHospital);
router.patch(
  '/:id/status',
  validateIdParam('id'),
  validateChangeHospitalStatus,
  hospitalController.changeHospitalStatus
);

module.exports = router;
