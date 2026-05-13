const sequelize = require('../config/database');
const User = require('./user.model');
const Patient = require('./patient.model');
const Doctor = require('./doctor.model');
const Hospital = require('./hospital.model');

User.hasOne(Patient, { foreignKey: 'user_id', as: 'patient' });
Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctor' });
Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Patient,
  Doctor,
  Hospital,
};
