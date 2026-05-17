const { sequelize } = require('../models');
const appointmentRepository = require('../repositories/appointment.repository');

const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
const EDITABLE_STATUSES = ['PENDING', 'CONFIRMED'];
const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalizedValue = String(value).trim();
  return normalizedValue || null;
};

const validateStatus = (status) => {
  if (status !== undefined && status !== null && !VALID_STATUSES.includes(status)) {
    throw createError('Invalid appointment status', 400);
  }
};

const assertRole = (user, roles, message) => {
  if (!user || !roles.includes(user.role)) {
    throw createError(message, 403);
  }
};

const getCurrentUserId = (user) => (user && user.id ? user.id : null);

const toNumber = (value) => Number(value || 0);

const parseDateRange = (date) => {
  if (date === undefined || date === null || String(date).trim() === '') return null;

  const [year, month, day] = String(date).split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  return { start, end };
};

const ensurePatientExists = async (patientId, options = {}) => {
  const patient = await appointmentRepository.findPatientById(patientId, options);
  if (!patient) {
    throw createError('Patient not found', 404);
  }

  return patient;
};

const ensureDoctorExists = async (doctorId, options = {}) => {
  const doctor = await appointmentRepository.findDoctorById(doctorId, options);
  if (!doctor) {
    throw createError('Doctor not found', 404);
  }

  return doctor;
};

const ensureSlotExistsForUpdate = async (slotId, options = {}) => {
  const slot = await appointmentRepository.findSlotByIdForUpdate(slotId, options);
  if (!slot) {
    throw createError('Appointment slot not found', 404);
  }

  return slot;
};

const ensureSlotCanBeBooked = (slot) => {
  if (slot.status !== 'AVAILABLE') {
    throw createError('Appointment slot is not available', 400);
  }

  if (toNumber(slot.booked_count) >= toNumber(slot.max_patients)) {
    throw createError('Appointment slot is full', 409);
  }
};

const ensureDoctorMatchesSlotAssignment = (slot, doctorId) => {
  if (!slot.doctor_assignment) {
    throw createError('Appointment slot does not have a doctor assignment', 400);
  }

  if (String(slot.doctor_assignment.doctor_id) !== String(doctorId)) {
    throw createError('doctor_id does not match the doctor assignment of this slot', 400);
  }
};

const ensurePatientHasNoActiveAppointmentInSlot = async (patientId, slotId, options = {}) => {
  const existingAppointment = await appointmentRepository.findActiveByPatientAndSlot(
    patientId,
    slotId,
    options
  );

  if (existingAppointment) {
    throw createError('Patient already has an active appointment in this slot', 409);
  }
};

const createAppointment = async (data, currentUser) => sequelize.transaction(async (transaction) => {
  await ensurePatientExists(data.patient_id, { transaction });
  await ensureDoctorExists(data.doctor_id, { transaction });

  const slot = await ensureSlotExistsForUpdate(data.slot_id, { transaction });
  ensureSlotCanBeBooked(slot);
  ensureDoctorMatchesSlotAssignment(slot, data.doctor_id);

  await ensurePatientHasNoActiveAppointmentInSlot(data.patient_id, data.slot_id, { transaction });

  const appointment = await appointmentRepository.create(
    {
      patient_id: data.patient_id,
      doctor_id: data.doctor_id,
      slot_id: data.slot_id,
      reason: normalizeText(data.reason),
      status: 'PENDING',
      created_by: getCurrentUserId(currentUser),
    },
    { transaction }
  );

  const nextBookedCount = toNumber(slot.booked_count) + 1;
  await appointmentRepository.updateSlotByInstance(
    slot,
    {
      booked_count: nextBookedCount,
      status: nextBookedCount >= toNumber(slot.max_patients) ? 'FULL' : 'AVAILABLE',
    },
    { transaction }
  );

  return appointmentRepository.findById(appointment.id, { transaction });
});

const getAppointments = async ({
  page = 1,
  limit = 10,
  patient_id,
  doctor_id,
  slot_id,
  status,
  date,
}) => {
  validateStatus(status);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await appointmentRepository.findAll({
    offset,
    limit: safeLimit,
    patient_id,
    doctor_id,
    slot_id,
    status,
    dateRange: parseDateRange(date),
  });

  return {
    appointments: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getAppointmentById = async (id) => {
  const appointment = await appointmentRepository.findById(id);
  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  return appointment;
};

const updateAppointmentReason = async (id, data, currentUser) => sequelize.transaction(async (transaction) => {
  const appointment = await appointmentRepository.findByIdForUpdate(id, { transaction });
  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  if (!EDITABLE_STATUSES.includes(appointment.status)) {
    throw createError('Appointment reason can only be updated when status is PENDING or CONFIRMED', 400);
  }

  return appointmentRepository.updateByInstance(appointment, {
    reason: normalizeText(data.reason),
    updated_by: getCurrentUserId(currentUser),
  }, { transaction });
});

const confirmAppointment = async (id, currentUser) => sequelize.transaction(async (transaction) => {
  assertRole(currentUser, ['ADMIN', 'DOCTOR'], 'Only ADMIN or DOCTOR can confirm appointments');

  const appointment = await appointmentRepository.findByIdForUpdate(id, { transaction });
  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  if (appointment.status !== 'PENDING') {
    throw createError('Only PENDING appointments can be confirmed', 400);
  }

  return appointmentRepository.updateByInstance(appointment, {
    status: 'CONFIRMED',
    updated_by: getCurrentUserId(currentUser),
  }, { transaction });
});

const completeAppointment = async (id, currentUser) => sequelize.transaction(async (transaction) => {
  assertRole(currentUser, ['ADMIN', 'DOCTOR'], 'Only ADMIN or DOCTOR can complete appointments');

  const appointment = await appointmentRepository.findByIdForUpdate(id, { transaction });
  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  if (appointment.status !== 'CONFIRMED') {
    throw createError('Only CONFIRMED appointments can be completed', 400);
  }

  return appointmentRepository.updateByInstance(appointment, {
    status: 'COMPLETED',
    updated_by: getCurrentUserId(currentUser),
  }, { transaction });
});

const cancelAppointment = async (id, data, currentUser) => sequelize.transaction(async (transaction) => {
  const appointment = await appointmentRepository.findByIdForUpdate(id, { transaction });
  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
    throw createError('Appointment can only be cancelled when status is PENDING or CONFIRMED', 400);
  }

  const slot = await ensureSlotExistsForUpdate(appointment.slot_id, { transaction });
  const nextBookedCount = Math.max(toNumber(slot.booked_count) - 1, 0);
  const nextSlotStatus = slot.status !== 'CANCELLED' && nextBookedCount < toNumber(slot.max_patients)
    ? 'AVAILABLE'
    : slot.status;

  await appointment.update(
    {
      status: 'CANCELLED',
      cancel_reason: normalizeText(data.cancel_reason),
      updated_by: getCurrentUserId(currentUser),
    },
    { transaction }
  );

  await appointmentRepository.updateSlotByInstance(
    slot,
    {
      booked_count: nextBookedCount,
      status: nextSlotStatus,
    },
    { transaction }
  );

  return appointmentRepository.findById(id, { transaction });
});

const softDeleteAppointment = async (id, currentUser) => {
  const deleted = await appointmentRepository.softDeleteById(id, {
    deleted_by: getCurrentUserId(currentUser),
  });

  if (!deleted) {
    throw createError('Appointment not found', 404);
  }

  return true;
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointmentReason,
  confirmAppointment,
  completeAppointment,
  cancelAppointment,
  softDeleteAppointment,
};
