const doctorAssignmentRepository = require('../repositories/doctorAssignment.repository');

const VALID_STATUSES = ['ACTIVE', 'INACTIVE'];

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

const normalizeText = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;

  const normalizedValue = String(value).trim();
  return normalizedValue || null;
};

const toPlain = (record) => {
  if (!record) return record;
  if (typeof record.get === 'function') return record.get({ plain: true });
  return record;
};

const getDoctorOrThrow = async (doctorId) => {
  const doctor = await doctorAssignmentRepository.findDoctorById(doctorId);
  if (!doctor) {
    throw createError('Doctor not found', 404);
  }

  return doctor;
};

const getDepartmentOrThrow = async (departmentId) => {
  const department = await doctorAssignmentRepository.findDepartmentById(departmentId);
  if (!department) {
    throw createError('Department not found', 404);
  }

  return department;
};

const ensureDoctorIsActive = async (doctorId) => {
  const doctor = await getDoctorOrThrow(doctorId);
  if (doctor.status !== 'ACTIVE') {
    throw createError('Doctor is not ACTIVE', 400);
  }

  return doctor;
};

const ensureDepartmentIsActive = async (departmentId) => {
  const department = await getDepartmentOrThrow(departmentId);
  if (department.status !== 'ACTIVE') {
    throw createError('Department is not ACTIVE', 400);
  }

  return department;
};

const ensureAssignmentIsUnique = async ({ doctorId, departmentId }) => {
  const existingAssignment = await doctorAssignmentRepository.findByDoctorAndDepartment(
    doctorId,
    departmentId
  );

  if (existingAssignment) {
    throw createError('Doctor assignment already exists', 409);
  }
};

const buildAssignmentInfo = (assignment) => ({
  id: assignment.id,
  doctor_id: assignment.doctor_id,
  department_id: assignment.department_id,
  position: assignment.position,
  status: assignment.status,
  created_at: assignment.created_at,
  updated_at: assignment.updated_at,
});

const createDoctorAssignment = async (data) => {
  validateStatus(data.status);

  await ensureDoctorIsActive(data.doctor_id);
  await ensureDepartmentIsActive(data.department_id);
  await ensureAssignmentIsUnique({
    doctorId: data.doctor_id,
    departmentId: data.department_id,
  });

  const assignment = await doctorAssignmentRepository.create({
    doctor_id: data.doctor_id,
    department_id: data.department_id,
    position: normalizeText(data.position),
    status: data.status || 'ACTIVE',
  });

  return doctorAssignmentRepository.findById(assignment.id);
};

const getDoctorAssignments = async ({
  page = 1,
  limit = 10,
  doctor_id,
  department_id,
  status,
}) => {
  validateStatus(status);

  const safePage = Math.max(Number(page) || 1, 1);
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const offset = (safePage - 1) * safeLimit;

  const result = await doctorAssignmentRepository.findAll({
    offset,
    limit: safeLimit,
    doctor_id,
    department_id,
    status,
  });

  return {
    doctor_assignments: result.rows,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: result.count,
      total_pages: Math.ceil(result.count / safeLimit),
    },
  };
};

const getDoctorAssignmentById = async (id) => {
  const assignment = await doctorAssignmentRepository.findById(id);
  if (!assignment) {
    throw createError('Doctor assignment not found', 404);
  }

  return assignment;
};

const getDoctorsByDepartmentId = async (departmentId) => {
  const department = await getDepartmentOrThrow(departmentId);
  const assignments = await doctorAssignmentRepository.findByDepartmentId(departmentId);

  const doctors = assignments.map((assignmentRecord) => {
    const assignment = toPlain(assignmentRecord);

    return {
      ...assignment.doctor,
      assignment: buildAssignmentInfo(assignment),
    };
  });

  return {
    department,
    doctors,
  };
};

const getDoctorDepartments = async (doctorId) => {
  const doctor = await getDoctorOrThrow(doctorId);
  const assignments = await doctorAssignmentRepository.findByDoctorId(doctorId);

  const departments = assignments.map((assignmentRecord) => {
    const assignment = toPlain(assignmentRecord);

    return {
      ...assignment.department,
      assignment: buildAssignmentInfo(assignment),
    };
  });

  return {
    doctor,
    departments,
  };
};

const updateDoctorAssignment = async (id, data) => {
  const updateData = {};

  if (data.position !== undefined) updateData.position = normalizeText(data.position);
  if (data.status !== undefined) updateData.status = data.status;

  validateStatus(updateData.status);

  const assignment = await doctorAssignmentRepository.updateById(id, updateData);
  if (!assignment) {
    throw createError('Doctor assignment not found', 404);
  }

  return assignment;
};

const softDeleteDoctorAssignment = async (id) => {
  const deleted = await doctorAssignmentRepository.softDeleteById(id);
  if (!deleted) {
    throw createError('Doctor assignment not found', 404);
  }

  return true;
};

const changeDoctorAssignmentStatus = async (id, status) => {
  validateStatus(status);

  const assignment = await doctorAssignmentRepository.updateById(id, { status });
  if (!assignment) {
    throw createError('Doctor assignment not found', 404);
  }

  return assignment;
};

module.exports = {
  createDoctorAssignment,
  getDoctorAssignments,
  getDoctorAssignmentById,
  getDoctorsByDepartmentId,
  getDoctorDepartments,
  updateDoctorAssignment,
  softDeleteDoctorAssignment,
  changeDoctorAssignmentStatus,
};
