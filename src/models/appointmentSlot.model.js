const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AppointmentSlot = sequelize.define(
  'AppointmentSlot',
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    doctor_assignment_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      references: {
        model: 'doctor_assignments',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    max_patients: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    booked_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('AVAILABLE', 'FULL', 'CANCELLED'),
      allowNull: false,
      defaultValue: 'AVAILABLE',
    },
    created_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    updated_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    deleted_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  },
  {
    tableName: 'appointment_slots',
    timestamps: true,
    paranoid: true,
    underscored: true,
    deletedAt: 'deleted_at',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['doctor_assignment_id'],
      },
      {
        fields: ['start_time'],
      },
      {
        fields: ['end_time'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['doctor_assignment_id', 'start_time', 'end_time'],
      },
    ],
  }
);

module.exports = AppointmentSlot;
