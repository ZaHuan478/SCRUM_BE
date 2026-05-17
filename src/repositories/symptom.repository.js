const { Op } = require('sequelize');
const { Symptom, User } = require('../models');

const userAttributes = {
  exclude: ['password'],
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

const create = (data) => Symptom.create(data);

const findAll = ({
  offset,
  limit,
  keyword,
  body_part,
  status,
}) => {
  const where = {};

  if (status) where.status = status;
  if (body_part) where.body_part = body_part;
  if (keyword) {
    where[Op.or] = [
      {
        name: {
          [Op.like]: `%${keyword}%`,
        },
      },
      {
        description: {
          [Op.like]: `%${keyword}%`,
        },
      },
    ];
  }

  return Symptom.findAndCountAll({
    where,
    include: includeAuditUsers,
    offset,
    limit,
    distinct: true,
    order: [['created_at', 'DESC']],
  });
};

const findById = (id) => Symptom.findByPk(id, {
  include: includeAuditUsers,
});

const findByName = (name) => Symptom.findOne({
  where: { name },
});

const updateById = async (id, data) => {
  const symptom = await Symptom.findByPk(id);
  if (!symptom) return null;

  await symptom.update(data);
  return findById(id);
};

const softDeleteById = async (id, deletedBy) => {
  const symptom = await Symptom.findByPk(id);
  if (!symptom) return null;

  await symptom.update({ deleted_by: deletedBy });
  await symptom.destroy();
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
