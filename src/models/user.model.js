const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    full_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    avatar_url: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    cccd_number: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    cccd_front_image: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    cccd_back_image: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('PATIENT', 'DOCTOR', 'ADMIN'),
      allowNull: false,
      defaultValue: 'PATIENT',
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    deletedAt: 'deleted_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = User;
