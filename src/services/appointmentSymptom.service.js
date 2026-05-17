const { sequelize } = require('../models');
const appointmentSymptomRepository = require('../repositories/appointmentSymptom.repository');

const MIN_SEVERITY = 1;
const MAX_SEVERITY = 5;

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getCurrentUserId = (user) => (user && user.id ? user.id : null);

const normalizeText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalizedValue = String(value).trim();
  return normalizedValue || null;
};

const normalizeSeverity = (severity) => Number(severity);

const validateSeverity = (severity) => {
  const normalizedSeverity = normalizeSeverity(severity);

  if (
    !Number.isInteger(normalizedSeverity)
    || normalizedSeverity < MIN_SEVERITY
    || normalizedSeverity > MAX_SEVERITY
  ) {
    throw createError('severity must be an integer from 1 to 5', 400);
  }

  return normalizedSeverity;
};

const ensureAppointmentExists = async (appointmentId, options = {}) => {
  const appointment = await appointmentSymptomRepository.findAppointmentById(
    appointmentId,
    options
  );

  if (!appointment) {
    throw createError('Appointment not found', 404);
  }

  return appointment;
};

const ensureSymptomExists = async (symptomId, options = {}) => {
  const symptom = await appointmentSymptomRepository.findSymptomById(symptomId, options);

  if (!symptom) {
    throw createError('Symptom not found', 404);
  }

  return symptom;
};

const ensureSymptomsExist = async (symptomIds, options = {}) => {
  const symptoms = await appointmentSymptomRepository.findSymptomsByIds(symptomIds, options);
  const existingIds = new Set(symptoms.map((symptom) => String(symptom.id)));
  const missingIds = symptomIds.filter((symptomId) => !existingIds.has(String(symptomId)));

  if (missingIds.length) {
    throw createError(`Symptoms not found: ${missingIds.join(', ')}`, 404);
  }

  return symptoms;
};

const ensureAppointmentSymptomIsUnique = async (
  appointmentId,
  symptomId,
  options = {}
) => {
  const existingAppointmentSymptom = await appointmentSymptomRepository
    .findByAppointmentAndSymptom(appointmentId, symptomId, options);

  if (existingAppointmentSymptom) {
    throw createError('Appointment already has this symptom', 409);
  }
};

const ensureRequestHasUniqueSymptoms = (symptomIds) => {
  const seenSymptomIds = new Set();
  const duplicateSymptomIds = new Set();

  symptomIds.forEach((symptomId) => {
    const key = String(symptomId);
    if (seenSymptomIds.has(key)) duplicateSymptomIds.add(symptomId);
    seenSymptomIds.add(key);
  });

  if (duplicateSymptomIds.size) {
    throw createError(
      `Duplicate symptom_id in request: ${[...duplicateSymptomIds].join(', ')}`,
      400
    );
  }
};

const mapUniqueConstraintError = (error) => {
  if (error.name === 'SequelizeUniqueConstraintError') {
    throw createError('Appointment already has this symptom', 409);
  }

  throw error;
};

const toPlain = (record) => (
  record && typeof record.get === 'function'
    ? record.get({ plain: true })
    : record
);

const createAppointmentSymptom = async (data, currentUser) => {
  try {
    return await sequelize.transaction(async (transaction) => {
      const severity = validateSeverity(data.severity);

      await ensureAppointmentExists(data.appointment_id, { transaction });
      await ensureSymptomExists(data.symptom_id, { transaction });
      await ensureAppointmentSymptomIsUnique(
        data.appointment_id,
        data.symptom_id,
        { transaction }
      );

      const appointmentSymptom = await appointmentSymptomRepository.create(
        {
          appointment_id: data.appointment_id,
          symptom_id: data.symptom_id,
          severity,
          note: normalizeText(data.note),
          created_by: getCurrentUserId(currentUser),
        },
        { transaction }
      );

      return appointmentSymptomRepository.findById(appointmentSymptom.id, { transaction });
    });
  } catch (error) {
    return mapUniqueConstraintError(error);
  }
};

const bulkCreateAppointmentSymptoms = async (data, currentUser) => {
  try {
    return await sequelize.transaction(async (transaction) => {
      const symptomPayloads = data.symptoms.map((symptom) => ({
        symptom_id: symptom.symptom_id,
        severity: validateSeverity(symptom.severity),
        note: normalizeText(symptom.note),
      }));
      const symptomIds = symptomPayloads.map((symptom) => symptom.symptom_id);

      ensureRequestHasUniqueSymptoms(symptomIds);
      await ensureAppointmentExists(data.appointment_id, { transaction });
      await ensureSymptomsExist(symptomIds, { transaction });

      const existingAppointmentSymptoms = await appointmentSymptomRepository
        .findByAppointmentAndSymptomIds(data.appointment_id, symptomIds, { transaction });

      if (existingAppointmentSymptoms.length) {
        const existingSymptomIds = existingAppointmentSymptoms
          .map((appointmentSymptom) => appointmentSymptom.symptom_id);

        throw createError(
          `Appointment already has symptom_id: ${existingSymptomIds.join(', ')}`,
          409
        );
      }

      const records = symptomPayloads.map((symptom) => ({
        appointment_id: data.appointment_id,
        symptom_id: symptom.symptom_id,
        severity: symptom.severity,
        note: symptom.note,
        created_by: getCurrentUserId(currentUser),
      }));

      await appointmentSymptomRepository.bulkCreate(records, { transaction });

      return appointmentSymptomRepository.findByAppointmentAndSymptomIds(
        data.appointment_id,
        symptomIds,
        { transaction }
      );
    });
  } catch (error) {
    return mapUniqueConstraintError(error);
  }
};

const getSymptomsByAppointment = async (appointmentId) => {
  const appointment = await ensureAppointmentExists(appointmentId);
  const appointmentSymptoms = await appointmentSymptomRepository
    .findByAppointmentId(appointmentId);

  return {
    appointment,
    symptoms: appointmentSymptoms.map((appointmentSymptom) => {
      const data = toPlain(appointmentSymptom);

      return {
        appointment_symptom_id: data.id,
        symptom: data.symptom,
        severity: data.severity,
        note: data.note,
      };
    }),
  };
};

const getAppointmentsBySymptom = async (symptomId) => {
  const symptom = await ensureSymptomExists(symptomId);
  const appointmentSymptoms = await appointmentSymptomRepository
    .findBySymptomId(symptomId);

  return {
    symptom,
    appointments: appointmentSymptoms.map((appointmentSymptom) => {
      const data = toPlain(appointmentSymptom);

      return {
        appointment_symptom_id: data.id,
        appointment: data.appointment,
        severity: data.severity,
        note: data.note,
      };
    }),
  };
};

const updateAppointmentSymptom = async (id, data, currentUser) => sequelize.transaction(
  async (transaction) => {
    if (data.appointment_id !== undefined || data.symptom_id !== undefined) {
      throw createError('appointment_id and symptom_id cannot be updated directly', 400);
    }

    const appointmentSymptom = await appointmentSymptomRepository
      .findByIdForUpdate(id, { transaction });

    if (!appointmentSymptom) {
      throw createError('Appointment symptom not found', 404);
    }

    const updateData = {
      updated_by: getCurrentUserId(currentUser),
    };

    if (data.severity !== undefined) {
      updateData.severity = validateSeverity(data.severity);
    }

    if (data.note !== undefined) {
      updateData.note = normalizeText(data.note);
    }

    return appointmentSymptomRepository.updateByInstance(
      appointmentSymptom,
      updateData,
      { transaction }
    );
  }
);

const softDeleteAppointmentSymptom = async (id, currentUser) => sequelize.transaction(async (transaction) => {
  const deleted = await appointmentSymptomRepository.softDeleteById(id, {
    deleted_by: getCurrentUserId(currentUser),
    transaction,
  });

  if (!deleted) {
    throw createError('Appointment symptom not found', 404);
  }

  return true;
});

module.exports = {
  createAppointmentSymptom,
  bulkCreateAppointmentSymptoms,
  getSymptomsByAppointment,
  getAppointmentsBySymptom,
  updateAppointmentSymptom,
  softDeleteAppointmentSymptom,
};
