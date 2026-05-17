const departmentSymptomRuleService = require('../services/departmentSymptomRule.service');

const successResponse = (res, message, data = {}, statusCode = 200) => res.status(statusCode).json({
  success: true,
  message,
  data,
});

const errorResponse = (res, error) => res.status(error.statusCode || 500).json({
  success: false,
  message: error.message || 'Internal server error',
});

const createDepartmentSymptomRule = async (req, res) => {
  try {
    const rule = await departmentSymptomRuleService.createDepartmentSymptomRule(
      req.body,
      req.user
    );
    return successResponse(res, 'Department symptom rule created successfully', rule, 201);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDepartmentSymptomRules = async (req, res) => {
  try {
    const data = await departmentSymptomRuleService.getDepartmentSymptomRules(req.query);
    return successResponse(res, 'Department symptom rules retrieved successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const getDepartmentSymptomRuleById = async (req, res) => {
  try {
    const rule = await departmentSymptomRuleService.getDepartmentSymptomRuleById(req.params.id);
    return successResponse(res, 'Department symptom rule retrieved successfully', rule);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const updateDepartmentSymptomRule = async (req, res) => {
  try {
    const rule = await departmentSymptomRuleService.updateDepartmentSymptomRule(
      req.params.id,
      req.body,
      req.user
    );
    return successResponse(res, 'Department symptom rule updated successfully', rule);
  } catch (error) {
    return errorResponse(res, error);
  }
};

const softDeleteDepartmentSymptomRule = async (req, res) => {
  try {
    await departmentSymptomRuleService.softDeleteDepartmentSymptomRule(req.params.id, req.user);
    return successResponse(res, 'Department symptom rule deleted successfully');
  } catch (error) {
    return errorResponse(res, error);
  }
};

const recommendDepartments = async (req, res) => {
  try {
    const data = await departmentSymptomRuleService.recommendDepartments(req.body.symptom_ids);
    return successResponse(res, 'Recommended departments successfully', data);
  } catch (error) {
    return errorResponse(res, error);
  }
};

module.exports = {
  createDepartmentSymptomRule,
  getDepartmentSymptomRules,
  getDepartmentSymptomRuleById,
  updateDepartmentSymptomRule,
  softDeleteDepartmentSymptomRule,
  recommendDepartments,
};
