const express = require('express');
const departmentController = require('../controllers/department.controller');
const {
  validateCreateDepartment,
  validateUpdateDepartment,
  validateChangeDepartmentStatus,
  validateGetDepartments,
  validateIdParam,
} = require('../validations/department.validation');

const router = express.Router();

router.post('/', validateCreateDepartment, departmentController.createDepartment);
router.get('/', validateGetDepartments, departmentController.getDepartments);
router.get('/:id', validateIdParam('id'), departmentController.getDepartmentById);
router.put('/:id', validateIdParam('id'), validateUpdateDepartment, departmentController.updateDepartment);
router.delete('/:id', validateIdParam('id'), departmentController.softDeleteDepartment);
router.patch(
  '/:id/status',
  validateIdParam('id'),
  validateChangeDepartmentStatus,
  departmentController.changeDepartmentStatus
);

module.exports = router;
