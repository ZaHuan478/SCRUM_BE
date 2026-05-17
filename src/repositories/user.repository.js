const User = require('../models/user.model');

const defaultAttributes = {
  exclude: ['password'],
};

const create = (data) => User.create(data);

const findByEmail = (email, options = {}) => User.findOne({ where: { email }, ...options });

const findByCccdNumber = (cccdNumber, options = {}) => User.findOne({
  where: { cccd_number: cccdNumber },
  ...options,
});

const findById = (id, options = {}) => User.findByPk(id, {
  attributes: defaultAttributes,
  ...options,
});

const findAll = () => User.findAll({
  attributes: defaultAttributes,
  order: [['created_at', 'DESC']],
});

const updateById = async (id, data) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  await user.update(data);
  return findById(id);
};

const softDeleteById = async (id) => {
  const user = await User.findByPk(id);
  if (!user) return null;

  await user.destroy();
  return true;
};

const changeStatus = async (id, status) => updateById(id, { status });

module.exports = {
  create,
  findByEmail,
  findByCccdNumber,
  findById,
  findAll,
  updateById,
  softDeleteById,
  changeStatus,
};
