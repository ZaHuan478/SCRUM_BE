const { Op } = require('sequelize');
const {
  AppointmentSlot,
  Department,
  Doctor,
  DoctorAssignment,
  User,
} = require('../models');

const userAttributes = {
  exclude: ['password'],
};

const includeDoctorUser = {
  model: User,
  as: 'user',
  attributes: userAttributes,
};

const includeDoctor = {
  model: Doctor,
  as: 'doctor',
  include: [includeDoctorUser],
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

const buildDoctorAssignmentInclude = (filters = {}) => {
  const assignmentWhere = {};

  if (filters.doctor_id) assignmentWhere.doctor_id = filters.doctor_id;
  if (filters.department_id) assignmentWhere.department_id = filters.department_id;

  const hasAssignmentFilter = Object.keys(assignmentWhere).length > 0;

  return {
    model: DoctorAssignment,
    as: 'doctor_assignment',
    include: [
      includeDoctor,
      {
        model: Department,
        as: 'department',
      },
    ],
    ...(Object.keys(assignmentWhere).length ? { where: assignmentWhere } : {}),
    ...(hasAssignmentFilter ? { required: true } : {}),
  };
};

const buildDefaultInclude = (filters = {}) => [
  buildDoctorAssignmentInclude(filters),
  ...includeAuditUsers,
];

const create = (data, options = {}) => AppointmentSlot.create(data, options);

const buildDateFilter = (dateRange) => {
  if (!dateRange) return [];

  return [
    {
      start_time: {
        [Op.lt]: dateRange.end,
      },
    },
    {
      end_time: {
        [Op.gt]: dateRange.start,
      },
    },
  ];
};

const findAll = ({
  offset,
  limit,
  doctor_assignment_id,
  doctor_id,
  department_id,
  dateRange,
  status,
}) => {
  const where = {};
  const andConditions = buildDateFilter(dateRange);

  if (doctor_assignment_id) where.doctor_assignment_id = doctor_assignment_id;
  if (status) where.status = status;
  if (andConditions.length) where[Op.and] = andConditions;

  return AppointmentSlot.findAndCountAll({
    where,
    include: buildDefaultInclude({ doctor_id, department_id }),
    offset,
    limit,
    distinct: true,
    order: [
      ['start_time', 'ASC'],
      ['id', 'ASC'],
    ],
  });
};

const findById = (id) => AppointmentSlot.findByPk(id, {
  include: buildDefaultInclude(),
});

const findRawById = (id, options = {}) => AppointmentSlot.findByPk(id, options);

const findByIdForUpdate = (id, transaction) => AppointmentSlot.findByPk(id, {
  transaction,
  lock: true,
});

const findDoctorAssignmentById = (id) => DoctorAssignment.findByPk(id, {
  include: [
    includeDoctor,
    {
      model: Department,
      as: 'department',
    },
  ],
});

const findOverlappingSlot = ({
  doctor_assignment_id,
  start_time,
  end_time,
  currentSlotId,
  transaction,
}) => {
  const where = {
    doctor_assignment_id,
    [Op.and]: [
      {
        start_time: {
          [Op.lt]: end_time,
        },
      },
      {
        end_time: {
          [Op.gt]: start_time,
        },
      },
    ],
  };

  if (currentSlotId) {
    where.id = {
      [Op.ne]: currentSlotId,
    };
  }

  return AppointmentSlot.findOne({
    where,
    transaction,
  });
};

const updateById = async (id, data, options = {}) => {
  const slot = await AppointmentSlot.findByPk(id, options);
  if (!slot) return null;

  await slot.update(data, options);
  return findById(id);
};

const updateInstance = (slot, data, transaction) => slot.update(data, { transaction });

const softDeleteById = async (id, deletedBy) => {
  const slot = await AppointmentSlot.findByPk(id);
  if (!slot) return null;

  await slot.update({ deleted_by: deletedBy });
  await slot.destroy();
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  findRawById,
  findByIdForUpdate,
  findDoctorAssignmentById,
  findOverlappingSlot,
  updateById,
  updateInstance,
  softDeleteById,
};
