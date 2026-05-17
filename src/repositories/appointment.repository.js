const { Op } = require('sequelize');
const {
  Appointment,
  AppointmentSlot,
  Department,
  Doctor,
  DoctorAssignment,
  Patient,
  User,
} = require('../models');

const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED'];

const userAttributes = {
  exclude: ['password'],
};

const includeUser = {
  model: User,
  as: 'user',
  attributes: userAttributes,
};

const includePatient = {
  model: Patient,
  as: 'patient',
  include: [includeUser],
};

const includeDoctor = {
  model: Doctor,
  as: 'doctor',
  include: [includeUser],
};

const includeDoctorAssignment = {
  model: DoctorAssignment,
  as: 'doctor_assignment',
  include: [
    {
      model: Department,
      as: 'department',
    },
  ],
};

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

const buildSlotInclude = ({ dateRange } = {}) => {
  const where = {};
  const andConditions = buildDateFilter(dateRange);

  if (andConditions.length) where[Op.and] = andConditions;

  return {
    model: AppointmentSlot,
    as: 'slot',
    include: [includeDoctorAssignment],
    ...(Object.keys(where).length ? { where, required: true } : {}),
  };
};

const buildIncludes = (filters = {}) => [
  includePatient,
  includeDoctor,
  buildSlotInclude(filters),
];

const create = (data, options = {}) => Appointment.create(data, options);

const findAll = ({
  offset,
  limit,
  patient_id,
  doctor_id,
  slot_id,
  status,
  dateRange,
}) => {
  const where = {};

  if (patient_id) where.patient_id = patient_id;
  if (doctor_id) where.doctor_id = doctor_id;
  if (slot_id) where.slot_id = slot_id;
  if (status) where.status = status;

  return Appointment.findAndCountAll({
    where,
    include: buildIncludes({ dateRange }),
    offset,
    limit,
    distinct: true,
    order: [['created_at', 'DESC']],
  });
};

const findById = (id, options = {}) => Appointment.findByPk(id, {
  include: buildIncludes(),
  ...options,
});

const findByIdForUpdate = (id, { transaction } = {}) => Appointment.findByPk(id, {
  transaction,
  lock: transaction ? true : undefined,
});

const findActiveByPatientAndSlot = (patientId, slotId, options = {}) => Appointment.findOne({
  where: {
    patient_id: patientId,
    slot_id: slotId,
    status: {
      [Op.in]: ACTIVE_APPOINTMENT_STATUSES,
    },
  },
  ...options,
});

const findPatientById = (patientId, options = {}) => Patient.findByPk(patientId, {
  include: [includeUser],
  ...options,
});

const findDoctorById = (doctorId, options = {}) => Doctor.findByPk(doctorId, {
  include: [includeUser],
  ...options,
});

const findSlotByIdForUpdate = (slotId, { transaction } = {}) => AppointmentSlot.findByPk(slotId, {
  include: [includeDoctorAssignment],
  transaction,
  lock: transaction ? true : undefined,
});

const updateByInstance = async (instance, data, options = {}) => {
  await instance.update(data, options);
  return findById(instance.id, options);
};

const updateSlotByInstance = (slot, data, options = {}) => slot.update(data, options);

const softDeleteById = async (id, { deleted_by, transaction } = {}) => {
  const appointment = await Appointment.findByPk(id, { transaction });
  if (!appointment) return null;

  await appointment.update({ deleted_by }, { transaction });
  await appointment.destroy({ transaction });

  return true;
};

module.exports = {
  ACTIVE_APPOINTMENT_STATUSES,
  create,
  findAll,
  findById,
  findByIdForUpdate,
  findActiveByPatientAndSlot,
  findPatientById,
  findDoctorById,
  findSlotByIdForUpdate,
  updateByInstance,
  updateSlotByInstance,
  softDeleteById,
};
