const { sequelize } = require('../models');
const appointmentSlotRepository = require('../repositories/appointmentSlot.repository');

const VALID_STATUSES = ['AVAILABLE', 'FULL', 'CANCELLED'];
const DATE_TIME_PATTERN = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const validateStatus = (status) => {
  if (status !== undefined && status !== null && !VALID_STATUSES.includes(status)) {
    throw createError('Invalid status', 400);
  }
};

const parseDateTime = (value, fieldName) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  const normalizedValue = String(value || '').trim();
  const match = normalizedValue.match(DATE_TIME_PATTERN);

  if (!match) {
    throw createError(`${fieldName} must be a valid datetime`, 400);
  }

  const [, year, month, day, hour, minute, second = '0'] = match;
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second)
  );

  if (
    date.getFullYear() !== Number(year)
    || date.getMonth() !== Number(month) - 1
    || date.getDate() !== Number(day)
    || date.getHours() !== Number(hour)
    || date.getMinutes() !== Number(minute)
    || date.getSeconds() !== Number(second)
  ) {
    throw createError(`${fieldName} must be a valid datetime`, 400);
  }

  return date;
};

const parseDateRange = (date) => {
  if (date === undefined || date === null || String(date).trim() === '') return null;

  const [year, month, day] = String(date).split('-').map(Number);
  const start = new Date(year, month - 1, day, 0, 0, 0, 0);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, 0);

  return { start, end };
};

const normalizePositiveInteger = (value, fieldName, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue <= 0) {
    throw createError(`${fieldName} must be greater than 0`, 400);
  }

  return numericValue;
};

const normalizeNonNegativeInteger = (value, fieldName, defaultValue) => {
  if (value === undefined || value === null || value === '') return defaultValue;

  const numericValue = Number(value);
  if (!Number.isInteger(numericValue) || numericValue < 0) {
    throw createError(`${fieldName} must be a non-negative integer`, 400);
  }

  return numericValue;
};

const validateTimeRange = (startTime, endTime) => {
  if (startTime.getTime() >= endTime.getTime()) {
    throw createError('start_time must be less than end_time', 400);
  }
};

const resolveStatus = ({ requestedStatus, bookedCount, maxPatients }) => {
  if (requestedStatus === 'CANCELLED') return 'CANCELLED';
  if (bookedCount >= maxPatients) return 'FULL';
  return requestedStatus || 'AVAILABLE';
};

const ensureDoctorAssignmentIsActive = async (doctorAssignmentId) => {
  const assignment = await appointmentSlotRepository.findDoctorAssignmentById(doctorAssignmentId);

  if (!assignment) {
    throw createError('Doctor assignment not found', 404);
  }

  if (assignment.status !== 'ACTIVE') {
    throw createError('Doctor assignment is not ACTIVE', 400);
  }

  return assignment;
};

const ensureSlotDoesNotOverlap = async ({
  doctorAssignmentId,
  startTime,
  endTime,
  currentSlotId,
  transaction,
}) => {
  const overlappingSlot = await appointmentSlotRepository.findOverlappingSlot({
    doctor_assignment_id: doctorAssignmentId,
    start_time: startTime,
    end_time: endTime,
    currentSlotId,
    transaction,
  });

  if (overlappingSlot) {
    throw createError('Appointment slot overlaps with an existing slot', 409);
  }
};

const getSlotOrThrow = async (id) => {
  const slot = await appointmentSlotRepository.findById(id);
  if (!slot) {
    throw createError('Appointment slot not found', 404);
  }

  return slot;
};

const createAppointmentSlot = async (data, currentUser) => {
  validateStatus(data.status);

  const startTime = parseDateTime(data.start_time, 'start_time');
  const endTime = parseDateTime(data.end_time, 'end_time');
  const maxPatients = normalizePositiveInteger(data.max_patients, 'max_patients', 1);
  const bookedCount = 0;
  const status = resolveStatus({
    requestedStatus: data.status || 'AVAILABLE',
    bookedCount,
    maxPatients,
  });

  validateTimeRange(startTime, endTime);
  await ensureDoctorAssignmentIsActive(data.doctor_assignment_id);
  await ensureSlotDoesNotOverlap({
    doctorAssignmentId: data.doctor_assignment_id,
    startTime,
    endTime,
  });

  const slot = await appointmentSlotRepository.create({
    doctor_assignment_id: data.doctor_assignment_id,
    start_time: startTime,
    end_time: endTime,
    max_patients: maxPatients,
    booked_count: bookedCount,
    status,
    created_by: currentUser?.id || null,
  });

  return appointmentSlotRepository.findById(slot.id);
};

const getAppointmentSlots = async ({
  page = 1,
  limit = 10,
  doctor_assignment_id,
  doctor_id,
  department_id,
  date,
  status,
}) => {
  validateStatus(status);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await appointmentSlotRepository.findAll({
    offset,
    limit: safeLimit,
    doctor_assignment_id,
    doctor_id,
    department_id,
    dateRange: parseDateRange(date),
    status,
  });

  return {
    appointment_slots: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getAppointmentSlotById = (id) => getSlotOrThrow(id);

const updateAppointmentSlot = async (id, data, currentUser) => {
  if (data.doctor_assignment_id !== undefined) {
    throw createError('doctor_assignment_id cannot be updated directly', 400);
  }

  if (data.booked_count !== undefined) {
    throw createError('booked_count cannot be updated directly', 400);
  }

  validateStatus(data.status);

  const currentSlot = await appointmentSlotRepository.findRawById(id);
  if (!currentSlot) {
    throw createError('Appointment slot not found', 404);
  }

  const startTime = data.start_time !== undefined
    ? parseDateTime(data.start_time, 'start_time')
    : currentSlot.start_time;
  const endTime = data.end_time !== undefined
    ? parseDateTime(data.end_time, 'end_time')
    : currentSlot.end_time;
  const maxPatients = data.max_patients !== undefined
    ? normalizePositiveInteger(data.max_patients, 'max_patients')
    : currentSlot.max_patients;
  const bookedCount = normalizeNonNegativeInteger(
    currentSlot.booked_count,
    'booked_count',
    0
  );

  validateTimeRange(startTime, endTime);

  if (bookedCount > maxPatients) {
    throw createError('max_patients cannot be less than booked_count', 400);
  }

  if (data.start_time !== undefined || data.end_time !== undefined) {
    await ensureSlotDoesNotOverlap({
      doctorAssignmentId: currentSlot.doctor_assignment_id,
      startTime,
      endTime,
      currentSlotId: id,
    });
  }

  const requestedStatus = data.status !== undefined ? data.status : currentSlot.status;
  const updateData = {
    start_time: startTime,
    end_time: endTime,
    max_patients: maxPatients,
    status: resolveStatus({
      requestedStatus,
      bookedCount,
      maxPatients,
    }),
    updated_by: currentUser?.id || null,
  };

  return appointmentSlotRepository.updateById(id, updateData);
};

const softDeleteAppointmentSlot = async (id, currentUser) => {
  const slot = await appointmentSlotRepository.findRawById(id);
  if (!slot) {
    throw createError('Appointment slot not found', 404);
  }

  if (Number(slot.booked_count) !== 0) {
    throw createError('Only appointment slots with booked_count = 0 can be deleted', 400);
  }

  await appointmentSlotRepository.softDeleteById(id, currentUser?.id || null);
  return true;
};

const cancelAppointmentSlot = async (id, currentUser) => {
  const slot = await appointmentSlotRepository.updateById(id, {
    status: 'CANCELLED',
    updated_by: currentUser?.id || null,
  });

  if (!slot) {
    throw createError('Appointment slot not found', 404);
  }

  return slot;
};

const changeAppointmentSlotStatus = async (id, status, currentUser) => {
  validateStatus(status);

  const currentSlot = await appointmentSlotRepository.findRawById(id);
  if (!currentSlot) {
    throw createError('Appointment slot not found', 404);
  }

  const resolvedStatus = resolveStatus({
    requestedStatus: status,
    bookedCount: Number(currentSlot.booked_count),
    maxPatients: Number(currentSlot.max_patients),
  });

  return appointmentSlotRepository.updateById(id, {
    status: resolvedStatus,
    updated_by: currentUser?.id || null,
  });
};

const bookAppointmentSlot = async (id, currentUser) => {
  const transaction = await sequelize.transaction();

  try {
    const slot = await appointmentSlotRepository.findByIdForUpdate(id, transaction);
    if (!slot) {
      throw createError('Appointment slot not found', 404);
    }

    if (slot.status !== 'AVAILABLE') {
      throw createError('Appointment slot is not AVAILABLE', 400);
    }

    const bookedCount = Number(slot.booked_count);
    const maxPatients = Number(slot.max_patients);

    if (bookedCount >= maxPatients) {
      await appointmentSlotRepository.updateInstance(
        slot,
        {
          status: 'FULL',
          updated_by: currentUser?.id || null,
        },
        transaction
      );
      throw createError('Appointment slot is FULL', 400);
    }

    const nextBookedCount = bookedCount + 1;
    const nextStatus = nextBookedCount >= maxPatients ? 'FULL' : 'AVAILABLE';

    await appointmentSlotRepository.updateInstance(
      slot,
      {
        booked_count: nextBookedCount,
        status: nextStatus,
        updated_by: currentUser?.id || null,
      },
      transaction
    );

    await transaction.commit();
    return appointmentSlotRepository.findById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

const releaseAppointmentSlot = async (id, currentUser) => {
  const transaction = await sequelize.transaction();

  try {
    const slot = await appointmentSlotRepository.findByIdForUpdate(id, transaction);
    if (!slot) {
      throw createError('Appointment slot not found', 404);
    }

    const bookedCount = Number(slot.booked_count);
    const maxPatients = Number(slot.max_patients);

    if (bookedCount <= 0) {
      throw createError('booked_count is already 0', 400);
    }

    const nextBookedCount = bookedCount - 1;
    const nextStatus = slot.status === 'CANCELLED'
      ? 'CANCELLED'
      : resolveStatus({
        requestedStatus: 'AVAILABLE',
        bookedCount: nextBookedCount,
        maxPatients,
      });

    await appointmentSlotRepository.updateInstance(
      slot,
      {
        booked_count: nextBookedCount,
        status: nextStatus,
        updated_by: currentUser?.id || null,
      },
      transaction
    );

    await transaction.commit();
    return appointmentSlotRepository.findById(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

module.exports = {
  createAppointmentSlot,
  getAppointmentSlots,
  getAppointmentSlotById,
  updateAppointmentSlot,
  softDeleteAppointmentSlot,
  cancelAppointmentSlot,
  changeAppointmentSlotStatus,
  bookAppointmentSlot,
  releaseAppointmentSlot,
};
