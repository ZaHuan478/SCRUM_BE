const express = require('express');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const patientRoutes = require('./routes/patient.routes');
const doctorRoutes = require('./routes/doctor.routes');
const departmentRoutes = require('./routes/department.routes');
const doctorAssignmentRoutes = require('./routes/doctorAssignment.routes');
const appointmentSlotRoutes = require('./routes/appointmentSlot.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const symptomRoutes = require('./routes/symptom.routes');
const departmentSymptomRuleRoutes = require('./routes/departmentSymptomRule.routes');
const appointmentSymptomRoutes = require('./routes/appointmentSymptom.routes');

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/', (req, res) => {
  res.json({ message: 'Backend API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/doctor-assignments', doctorAssignmentRoutes);
app.use('/api/appointment-slots', appointmentSlotRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/symptoms', symptomRoutes);
app.use('/api/department-symptom-rules', departmentSymptomRuleRoutes);
app.use('/api/appointment-symptoms', appointmentSymptomRoutes);

module.exports = app;
