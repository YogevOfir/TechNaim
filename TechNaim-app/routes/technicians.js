const express = require('express');
const router = express.Router();
const Technician = require('../models/technicianModel'); // Technician model
const authenticate = require('../middlewares/authMiddleware.js'); 
const Appointment = require('../models/appointmentModel'); // Appointment model
const User = require('../models/userModel'); // User model
const { recalcScheduleForTechnician } = require('./schedule');

// let technicianLocations = {};

// Get all technicians
router.get('/', authenticate, async (req, res) => {
    const { companyId } = req.query;

    if (!companyId) {
        return res.status(400).json({ message: 'Company ID is required' });
    }

    try {
        const technicians = await Technician.find( { companyId } ).populate('userId', 'name');

        console.log('Technicians:', technicians);
        
        res.status(200).json(technicians);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get a single technician by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const technician = await Technician.findById(req.params.id);
        if (!technician) return res.status(404).json({ message: 'Technician not found' });

        res.status(200).json(technician);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Create a technician
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, email, companyId } = req.body;

        if (!name || !email || !companyId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newTechnician = new Technician({ name, email, companyId });
        await newTechnician.save();

        res.status(201).json({ message: 'Technician created successfully', technician: newTechnician });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Delete a technician
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await Technician.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Technician deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});


// Technician updates their location only if conditions are met
router.post('/update-location', authenticate, async (req, res) => {
    const { technicianId, lat, lng } = req.body;
    if (!technicianId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    
    const now = new Date();
    if (now.getHours() < 8) {
      return res.status(400).json({ error: 'Location tracking starts at 8AM and end at 11:59PM' });
    }
    
    // Check for an appointment today for this technician
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    
    const appointmentToday = await Appointment.findOne({
      technicianId,
      status: 'in-progress',
      scheduledTime: { $gte: startOfToday, $lt: endOfToday }
    });
    
    if (!appointmentToday) {
        lat = null;
        lng = null;
    }
    
    // Save the location update in the technicianLocations object
    const technician = await Technician.findById(technicianId);
    if (!technician) {
      return res.status(404).json({ error: 'Technician not found' });
    }
    await Technician.findByIdAndUpdate(technicianId, { location: { lat, lng } });

    const currentLocation = { lat, lng };
    recalcScheduleForTechnician(technicianId, scheduledTime, currentLocation)
      .then(scheduleResult => {
        console.log("Schedule recalculated:", scheduleResult);
      })
      .catch(err => {
        console.error("Error recalculating schedule:", err);
      });

    res.json({ message: 'Location updated' });
});


module.exports = router;
