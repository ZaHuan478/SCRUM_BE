const express = require('express');
const symptomController = require('../controllers/symptom.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const {
  validateCreateSymptom,
  validateUpdateSymptom,
  validateChangeSymptomStatus,
  validateGetSymptoms,
  validateIdParam,
} = require('../validations/symptom.validation');

const router = express.Router();

router.get('/', validateGetSymptoms, symptomController.getSymptoms);
router.get('/:id', validateIdParam('id'), symptomController.getSymptomById);
router.post('/', authenticate, validateCreateSymptom, symptomController.createSymptom);
router.put(
  '/:id',
  authenticate,
  validateIdParam('id'),
  validateUpdateSymptom,
  symptomController.updateSymptom
);
router.delete(
  '/:id',
  authenticate,
  validateIdParam('id'),
  symptomController.softDeleteSymptom
);
router.patch(
  '/:id/status',
  authenticate,
  validateIdParam('id'),
  validateChangeSymptomStatus,
  symptomController.changeSymptomStatus
);

module.exports = router;
