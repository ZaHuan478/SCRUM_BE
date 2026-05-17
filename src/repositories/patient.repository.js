const { Patient, User } = require('../models');

const userAttributes = {
  exclude: ['password'],
};

const includeUser = {
  model: User,
  as: 'user',
  attributes: userAttributes,
};

const includePatientProfile = {
  model: Patient,
  as: 'patient',
  required: false,
};

const create = (data) => Patient.create(data);

const findAll = ({ offset, limit }) => Patient.findAndCountAll({
  include: [includeUser],
  offset,
  limit,
  order: [['created_at', 'DESC']],
});

const findAllPatientUsers = ({ offset, limit }) => User.findAndCountAll({
  where: { role: 'PATIENT' },
  attributes: userAttributes,
  include: [includePatientProfile],
  distinct: true,
  offset,
  limit,
  order: [['created_at', 'DESC']],
});

const findById = (id) => Patient.findByPk(id, {
  include: [includeUser],
});

const findByUserId = (userId) => Patient.findOne({
  where: { user_id: userId },
  include: [includeUser],
});

const updateById = async (id, data) => {
  const patient = await Patient.findByPk(id);
  if (!patient) return null;

  await patient.update(data);
  return findById(id);
};

const softDeleteById = async (id) => {
  const patient = await Patient.findByPk(id);
  if (!patient) return null;

  await patient.destroy();
  return true;
};

module.exports = {
  create,
  findAll,
  findAllPatientUsers,
  findById,
  findByUserId,
  updateById,
  softDeleteById,
};
