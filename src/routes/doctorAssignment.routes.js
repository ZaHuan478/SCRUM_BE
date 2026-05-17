const express = require('express');
const doctorAssignmentController = require('../controllers/doctorAssignment.controller');
const {
  validateChangeDoctorAssignmentStatus,
  validateCreateDoctorAssignment,
  validateGetDoctorAssignments,
  validateIdParam,
  validateUpdateDoctorAssignment,
} = require('../validations/doctorAssignment.validation');

const router = express.Router();

router.post('/', validateCreateDoctorAssignment, doctorAssignmentController.createDoctorAssignment);
router.get('/', validateGetDoctorAssignments, doctorAssignmentController.getDoctorAssignments);
router.get(
  '/department/:department_id',
  validateIdParam('department_id'),
  doctorAssignmentController.getDoctorsByDepartmentId
);
router.get(
  '/doctor/:doctor_id',
  validateIdParam('doctor_id'),
  doctorAssignmentController.getDoctorDepartments
);
router.get('/:id', validateIdParam('id'), doctorAssignmentController.getDoctorAssignmentById);
router.put(
  '/:id',
  validateIdParam('id'),
  validateUpdateDoctorAssignment,
  doctorAssignmentController.updateDoctorAssignment
);
router.delete('/:id', validateIdParam('id'), doctorAssignmentController.softDeleteDoctorAssignment);
router.patch(
  '/:id/status',
  validateIdParam('id'),
  validateChangeDoctorAssignmentStatus,
  doctorAssignmentController.changeDoctorAssignmentStatus
);

module.exports = router;
