const { Op } = require('sequelize');
const {
  Department,
  DepartmentSymptomRule,
  Symptom,
  User,
} = require('../models');

const userAttributes = {
  exclude: ['password'],
};

const includeSymptom = {
  model: Symptom,
  as: 'symptom',
};

const includeDepartment = {
  model: Department,
  as: 'department',
};

const includeAuditUsers = [
  {
    model: User,
    as: 'created_by_user',
    attributes: userAttributes,
  },
  {
    model: User,
    as: 'updated_by_user',
    attributes: userAttributes,
  },
  {
    model: User,
    as: 'deleted_by_user',
    attributes: userAttributes,
  },
];

const defaultInclude = [
  includeSymptom,
  includeDepartment,
  ...includeAuditUsers,
];

const create = (data) => DepartmentSymptomRule.create(data);

const buildScoreFilter = ({ min_score, max_score }) => {
  if (min_score !== undefined && max_score !== undefined) {
    return {
      [Op.between]: [Number(min_score), Number(max_score)],
    };
  }

  if (min_score !== undefined) {
    return {
      [Op.gte]: Number(min_score),
    };
  }

  if (max_score !== undefined) {
    return {
      [Op.lte]: Number(max_score),
    };
  }

  return undefined;
};

const findAll = ({
  offset,
  limit,
  symptom_id,
  department_id,
  min_score,
  max_score,
}) => {
  const where = {};
  const scoreFilter = buildScoreFilter({ min_score, max_score });

  if (symptom_id) where.symptom_id = symptom_id;
  if (department_id) where.department_id = department_id;
  if (scoreFilter) where.score = scoreFilter;

  return DepartmentSymptomRule.findAndCountAll({
    where,
    include: defaultInclude,
    offset,
    limit,
    distinct: true,
    order: [['created_at', 'DESC']],
  });
};

const findById = (id) => DepartmentSymptomRule.findByPk(id, {
  include: defaultInclude,
});

const findBySymptomAndDepartment = (symptomId, departmentId) => DepartmentSymptomRule.findOne({
  where: {
    symptom_id: symptomId,
    department_id: departmentId,
  },
});

const findBySymptomIds = (symptomIds) => DepartmentSymptomRule.findAll({
  where: {
    symptom_id: {
      [Op.in]: symptomIds,
    },
  },
  include: [includeSymptom, includeDepartment],
  order: [
    ['department_id', 'ASC'],
    ['score', 'DESC'],
  ],
});

const findSymptomById = (symptomId) => Symptom.findByPk(symptomId);

const findDepartmentById = (departmentId) => Department.findByPk(departmentId);

const updateById = async (id, data) => {
  const rule = await DepartmentSymptomRule.findByPk(id);
  if (!rule) return null;

  await rule.update(data);
  return findById(id);
};

const softDeleteById = async (id, deletedBy) => {
  const rule = await DepartmentSymptomRule.findByPk(id);
  if (!rule) return null;

  await rule.update({ deleted_by: deletedBy });
  await rule.destroy();
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  findBySymptomAndDepartment,
  findBySymptomIds,
  findSymptomById,
  findDepartmentById,
  updateById,
  softDeleteById,
};
