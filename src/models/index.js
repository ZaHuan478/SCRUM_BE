const sequelize = require('../config/database');
const User = require('./user.model');
const Patient = require('./patient.model');
const Doctor = require('./doctor.model');
const Department = require('./department.model');
const DoctorAssignment = require('./doctorAssignment.model');
const AppointmentSlot = require('./appointmentSlot.model');
const Appointment = require('./appointment.model');
const Symptom = require('./symptom.model');
const DepartmentSymptomRule = require('./departmentSymptomRule.model');
const AppointmentSymptom = require('./appointmentSymptom.model');

User.hasOne(Patient, { foreignKey: 'user_id', as: 'patient' });
Patient.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasOne(Doctor, { foreignKey: 'user_id', as: 'doctor' });
Doctor.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Doctor.hasMany(DoctorAssignment, { foreignKey: 'doctor_id', as: 'assignments' });
DoctorAssignment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

Department.hasMany(DoctorAssignment, { foreignKey: 'department_id', as: 'doctor_assignments' });
DoctorAssignment.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

DoctorAssignment.hasMany(AppointmentSlot, {
  foreignKey: 'doctor_assignment_id',
  as: 'appointment_slots',
});
AppointmentSlot.belongsTo(DoctorAssignment, {
  foreignKey: 'doctor_assignment_id',
  as: 'doctor_assignment',
});

User.hasMany(AppointmentSlot, {
  foreignKey: 'created_by',
  as: 'created_appointment_slots',
});
AppointmentSlot.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'created_by_user',
});

User.hasMany(AppointmentSlot, {
  foreignKey: 'updated_by',
  as: 'updated_appointment_slots',
});
AppointmentSlot.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updated_by_user',
});

User.hasMany(AppointmentSlot, {
  foreignKey: 'deleted_by',
  as: 'deleted_appointment_slots',
});
AppointmentSlot.belongsTo(User, {
  foreignKey: 'deleted_by',
  as: 'deleted_by_user',
});

Patient.hasMany(Appointment, { foreignKey: 'patient_id', as: 'appointments' });
Appointment.belongsTo(Patient, { foreignKey: 'patient_id', as: 'patient' });

Doctor.hasMany(Appointment, { foreignKey: 'doctor_id', as: 'appointments' });
Appointment.belongsTo(Doctor, { foreignKey: 'doctor_id', as: 'doctor' });

AppointmentSlot.hasMany(Appointment, { foreignKey: 'slot_id', as: 'appointments' });
Appointment.belongsTo(AppointmentSlot, { foreignKey: 'slot_id', as: 'slot' });

Appointment.hasMany(AppointmentSymptom, {
  foreignKey: 'appointment_id',
  as: 'appointment_symptoms',
});
AppointmentSymptom.belongsTo(Appointment, {
  foreignKey: 'appointment_id',
  as: 'appointment',
});

User.hasMany(Symptom, { foreignKey: 'created_by', as: 'created_symptoms' });
Symptom.belongsTo(User, { foreignKey: 'created_by', as: 'created_by_user' });

User.hasMany(Symptom, { foreignKey: 'updated_by', as: 'updated_symptoms' });
Symptom.belongsTo(User, { foreignKey: 'updated_by', as: 'updated_by_user' });

User.hasMany(Symptom, { foreignKey: 'deleted_by', as: 'deleted_symptoms' });
Symptom.belongsTo(User, { foreignKey: 'deleted_by', as: 'deleted_by_user' });

Symptom.hasMany(DepartmentSymptomRule, {
  foreignKey: 'symptom_id',
  as: 'department_rules',
});
DepartmentSymptomRule.belongsTo(Symptom, {
  foreignKey: 'symptom_id',
  as: 'symptom',
});

Symptom.hasMany(AppointmentSymptom, {
  foreignKey: 'symptom_id',
  as: 'appointment_symptoms',
});
AppointmentSymptom.belongsTo(Symptom, {
  foreignKey: 'symptom_id',
  as: 'symptom',
});

Department.hasMany(DepartmentSymptomRule, {
  foreignKey: 'department_id',
  as: 'symptom_rules',
});
DepartmentSymptomRule.belongsTo(Department, {
  foreignKey: 'department_id',
  as: 'department',
});

User.hasMany(DepartmentSymptomRule, {
  foreignKey: 'created_by',
  as: 'created_department_symptom_rules',
});
DepartmentSymptomRule.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'created_by_user',
});

User.hasMany(DepartmentSymptomRule, {
  foreignKey: 'updated_by',
  as: 'updated_department_symptom_rules',
});
DepartmentSymptomRule.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updated_by_user',
});

User.hasMany(DepartmentSymptomRule, {
  foreignKey: 'deleted_by',
  as: 'deleted_department_symptom_rules',
});
DepartmentSymptomRule.belongsTo(User, {
  foreignKey: 'deleted_by',
  as: 'deleted_by_user',
});

User.hasMany(AppointmentSymptom, {
  foreignKey: 'created_by',
  as: 'created_appointment_symptoms',
});
AppointmentSymptom.belongsTo(User, {
  foreignKey: 'created_by',
  as: 'created_by_user',
});

User.hasMany(AppointmentSymptom, {
  foreignKey: 'updated_by',
  as: 'updated_appointment_symptoms',
});
AppointmentSymptom.belongsTo(User, {
  foreignKey: 'updated_by',
  as: 'updated_by_user',
});

User.hasMany(AppointmentSymptom, {
  foreignKey: 'deleted_by',
  as: 'deleted_appointment_symptoms',
});
AppointmentSymptom.belongsTo(User, {
  foreignKey: 'deleted_by',
  as: 'deleted_by_user',
});

module.exports = {
  sequelize,
  User,
  Patient,
  Doctor,
  Department,
  DoctorAssignment,
  AppointmentSlot,
  Appointment,
  Symptom,
  DepartmentSymptomRule,
  AppointmentSymptom,
};
