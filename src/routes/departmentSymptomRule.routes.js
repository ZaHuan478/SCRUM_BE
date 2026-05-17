const express = require('express');
const departmentSymptomRuleController = require('../controllers/departmentSymptomRule.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  validateCreateDepartmentSymptomRule,
  validateGetDepartmentSymptomRules,
  validateUpdateDepartmentSymptomRule,
  validateRecommendDepartments,
  validateIdParam,
} = require('../validations/departmentSymptomRule.validation');

const router = express.Router();

router.post(
  '/recommend',
  validateRecommendDepartments,
  departmentSymptomRuleController.recommendDepartments
);
router.get(
  '/',
  validateGetDepartmentSymptomRules,
  departmentSymptomRuleController.getDepartmentSymptomRules
);
router.get(
  '/:id',
  validateIdParam('id'),
  departmentSymptomRuleController.getDepartmentSymptomRuleById
);
router.post(
  '/',
  authenticate,
  validateCreateDepartmentSymptomRule,
  departmentSymptomRuleController.createDepartmentSymptomRule
);
router.put(
  '/:id',
  authenticate,
  validateIdParam('id'),
  validateUpdateDepartmentSymptomRule,
  departmentSymptomRuleController.updateDepartmentSymptomRule
);
router.delete(
  '/:id',
  authenticate,
  validateIdParam('id'),
  departmentSymptomRuleController.softDeleteDepartmentSymptomRule
);

module.exports = router;
