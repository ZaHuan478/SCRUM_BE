const { Op } = require('sequelize');
const { Department } = require('../models');

const create = (data) => Department.create(data);

const findAll = ({
  offset,
  limit,
  keyword,
  status,
}) => {
  const where = {};

  if (status) where.status = status;
  if (keyword) {
    where.name = {
      [Op.like]: `%${keyword}%`,
    };
  }

  return Department.findAndCountAll({
    where,
    offset,
    limit,
    distinct: true,
    order: [['created_at', 'DESC']],
  });
};

const findById = (id) => Department.findByPk(id);

const findByName = (name) => Department.findOne({
  where: { name },
});

const updateById = async (id, data) => {
  const department = await Department.findByPk(id);
  if (!department) return null;

  await department.update(data);
  return findById(id);
};

const softDeleteById = async (id) => {
  const department = await Department.findByPk(id);
  if (!department) return null;

  await department.destroy();
  return true;
};

module.exports = {
  create,
  findAll,
  findById,
  findByName,
  updateById,
  softDeleteById,
};
