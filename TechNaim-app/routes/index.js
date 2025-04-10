const express = require('express');
const authRoutes = require('./authRoutes');
const appointmentRoutes = require('./appointments');
const technicianRoutes = require('./technicians');
const customerRoutes = require('./customers');
const scheduleRoutes = require('./schedule'); 

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/technicians', technicianRoutes);
router.use('/customers', customerRoutes);



module.exports = router;
