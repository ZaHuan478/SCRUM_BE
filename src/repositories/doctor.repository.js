const { Doctor, User } = require('../models');

const userAttributes = {
  exclude: ['password'],
};

const includeUser = {
  model: User,
  as: 'user',
  attributes: userAttributes,
};

const create = (data) => Doctor.create(data);

const findAll = ({ offset, limit, status }) => {
  const where = {};
  if (status) where.status = status;

  return Doctor.findAndCountAll({
    where,
    include: [includeUser],
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });
};

const findById = (id) => Doctor.findByPk(id, {
  include: [includeUser],
});

const findByUserId = (userId) => Doctor.findOne({
  where: { user_id: userId },
  include: [includeUser],
});

const findByLicenseNumber = (licenseNumber) => Doctor.findOne({
  where: { license_number: licenseNumber },
});

const findByCccd = (cccd) => Doctor.findOne({
  where: { cccd },
});

const updateById = async (id, data) => {
  const doctor = await Doctor.findByPk(id);
  if (!doctor) return null;

  await doctor.update(data);
  return findById(id);
};

const softDeleteById = async (id) => {
  const doctor = await Doctor.findByPk(id);
  if (!doctor) return null;

  await doctor.destroy();
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  findByUserId,
  findByLicenseNumber,
  findByCccd,
  updateById,
  softDeleteById,
};
