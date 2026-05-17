const { Op } = require('sequelize');
const {
  Appointment,
  AppointmentSymptom,
  Symptom,
  User,
} = require('../models');

const userAttributes = {
  exclude: ['password'],
};

const includeAppointment = {
  model: Appointment,
  as: 'appointment',
};

const includeSymptom = {
  model: Symptom,
  as: 'symptom',
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
  includeAppointment,
  includeSymptom,
  ...includeAuditUsers,
];

const create = (data, options = {}) => AppointmentSymptom.create(data, options);

const bulkCreate = (data, options = {}) => AppointmentSymptom.bulkCreate(data, options);

const findById = (id, options = {}) => AppointmentSymptom.findByPk(id, {
  include: defaultInclude,
  ...options,
});

const findByIdForUpdate = (id, { transaction } = {}) => AppointmentSymptom.findByPk(id, {
  transaction,
  lock: transaction ? true : undefined,
});

const findByAppointmentAndSymptom = (
  appointmentId,
  symptomId,
  options = {}
) => AppointmentSymptom.findOne({
  where: {
    appointment_id: appointmentId,
    symptom_id: symptomId,
  },
  ...options,
});

const findByAppointmentAndSymptomIds = (
  appointmentId,
  symptomIds,
  options = {}
) => AppointmentSymptom.findAll({
  where: {
    appointment_id: appointmentId,
    symptom_id: {
      [Op.in]: symptomIds,
    },
  },
  include: defaultInclude,
  order: [['created_at', 'DESC']],
  ...options,
});

const findByAppointmentId = (appointmentId, options = {}) => AppointmentSymptom.findAll({
  where: {
    appointment_id: appointmentId,
  },
  include: [includeSymptom],
  order: [['created_at', 'DESC']],
  ...options,
});

const findBySymptomId = (symptomId, options = {}) => AppointmentSymptom.findAll({
  where: {
    symptom_id: symptomId,
  },
  include: [includeAppointment],
  order: [['created_at', 'DESC']],
  ...options,
});

const findAppointmentById = (appointmentId, options = {}) => Appointment.findByPk(
  appointmentId,
  options
);

const findSymptomById = (symptomId, options = {}) => Symptom.findByPk(symptomId, options);

const findSymptomsByIds = (symptomIds, options = {}) => Symptom.findAll({
  where: {
    id: {
      [Op.in]: symptomIds,
    },
  },
  ...options,
});

const updateByInstance = async (appointmentSymptom, data, options = {}) => {
  await appointmentSymptom.update(data, options);
  return findById(appointmentSymptom.id, options);
};

const softDeleteById = async (id, { deleted_by, transaction } = {}) => {
  const appointmentSymptom = await AppointmentSymptom.findByPk(id, { transaction });
  if (!appointmentSymptom) return null;

  await appointmentSymptom.update({ deleted_by }, { transaction });
  await appointmentSymptom.destroy({ transaction });

  return true;
};

module.exports = {
  create,
  bulkCreate,
  findById,
  findByIdForUpdate,
  findByAppointmentAndSymptom,
  findByAppointmentAndSymptomIds,
  findByAppointmentId,
  findBySymptomId,
  findAppointmentById,
  findSymptomById,
  findSymptomsByIds,
  updateByInstance,
  softDeleteById,
};
