const { Op } = require('sequelize');
const { Hospital } = require('../models');

const create = (data) => Hospital.create(data);

const findAll = ({ offset, limit, keyword, city, status }) => {
  const where = {};

  if (status) where.status = status;
  if (city) where.city = { [Op.like]: `%${city}%` };
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { city: { [Op.like]: `%${keyword}%` } },
    ];
  }

  return Hospital.findAndCountAll({
    where,
    offset,
    limit,
    order: [['created_at', 'DESC']],
  });
};

const findById = (id) => Hospital.findByPk(id);

const findByEmail = (email) => Hospital.findOne({
  where: { email },
});

const updateById = async (id, data) => {
  const hospital = await Hospital.findByPk(id);
  if (!hospital) return null;

  await hospital.update(data);
  return findById(id);
};

const softDeleteById = async (id) => {
  const hospital = await Hospital.findByPk(id);
  if (!hospital) return null;

  await hospital.destroy();
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  findByEmail,
  updateById,
  softDeleteById,
};
