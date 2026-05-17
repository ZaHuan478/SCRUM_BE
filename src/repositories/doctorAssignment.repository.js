const {
  Department,
  Doctor,
  DoctorAssignment,
  User,
} = require('../models');

const userAttributes = {
  exclude: ['password'],
};

const includeUser = {
  model: User,
  as: 'user',
  attributes: userAttributes,
};

const includeDoctor = {
  model: Doctor,
  as: 'doctor',
  include: [includeUser],
};

const buildDepartmentInclude = () => {
  return {
    model: Department,
    as: 'department',
  };
};

const buildIncludes = (filters = {}) => [
  includeDoctor,
  buildDepartmentInclude(filters),
];

const create = (data) => DoctorAssignment.create(data);

const findAll = ({
  offset,
  limit,
  doctor_id,
  department_id,
  status,
}) => {
  const where = {};

  if (doctor_id) where.doctor_id = doctor_id;
  if (department_id) where.department_id = department_id;
  if (status) where.status = status;

  return DoctorAssignment.findAndCountAll({
    where,
    include: buildIncludes(),
    offset,
    limit,
    distinct: true,
    order: [['created_at', 'DESC']],
  });
};

const findById = (id) => DoctorAssignment.findByPk(id, {
  include: buildIncludes(),
});

const findByDoctorAndDepartment = (doctorId, departmentId) => (
  DoctorAssignment.findOne({
    where: {
      doctor_id: doctorId,
      department_id: departmentId,
    },
  })
);

const findDoctorById = (doctorId) => Doctor.findByPk(doctorId, {
  include: [includeUser],
});

const findDepartmentById = (departmentId) => Department.findByPk(departmentId);

const findByDepartmentId = (departmentId) => DoctorAssignment.findAll({
  where: {
    department_id: departmentId,
  },
  include: buildIncludes(),
  order: [['created_at', 'DESC']],
});

const findByDoctorId = (doctorId) => DoctorAssignment.findAll({
  where: {
    doctor_id: doctorId,
  },
  include: buildIncludes(),
  order: [['created_at', 'DESC']],
});

const updateById = async (id, data) => {
  const assignment = await DoctorAssignment.findByPk(id);
  if (!assignment) return null;

  await assignment.update(data);
  return findById(id);
};

const softDeleteById = async (id) => {
  const assignment = await DoctorAssignment.findByPk(id);
  if (!assignment) return null;

  await assignment.destroy();
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  findByDoctorAndDepartment,
  findDoctorById,
  findDepartmentById,
  findByDepartmentId,
  findByDoctorId,
  updateById,
  softDeleteById,
};
