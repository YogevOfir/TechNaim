const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointmentModel'); // Assuming you have this model
const authenticate  = require('../middlewares/authMiddleware'); 
const Technician = require('../models/technicianModel')
const schedule = require('node-schedule'); // For scheduling tasks

// Create an appointment
router.post('/', authenticate, async (req, res) => {
    try {
        const { customerId, technicianId, companyId, scheduledTime, notes } = req.body;

        // Basic validation
        if (!customerId || !technicianId || !companyId || !scheduledTime) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        if (scheduledTime < new Date()) {
            return res.status(400).json({ message: 'Scheduled time must be in the future' });
        }

        // Create the appointment
        const newAppointment = new Appointment({
            customerId,
            technicianId,
            companyId,
            scheduledTime,
            notes,
            status: 'pending',
        });

        await newAppointment.save();

        res.status(201).json({ message: 'Appointment created successfully', appointment: newAppointment });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all appointments for a user
router.get('/customer', authenticate, async (req, res) => {
    try {
        const appointments = await Appointment.find({ customerId: req.user._id }).populate({
            path: 'technicianId',
            populate: [
                { path: 'userId', select: 'name phone' },
                { path: 'companyId', select: 'name' }
            ]
        });

        res.status(200).json({ appointments });
    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({ message: 'Server error' });
    }

});


// Get all appointments for a technician
router.get('/technician', authenticate, async (req, res) => {
    try {
        const technician = await Technician.findOne({ userId: req.user._id});
        console.log('Technician Id: ', technician._id);
        if(!technician){
            return res.status(404).json({ message: 'Technician not found'});
        }

        const appointments = await Appointment.find({ technicianId: technician._id }).populate({
            path: 'customerId',
            select: 'name address phone addressCoordinates' // Populate customerId with name
        });

        console.log('Retrieved Appointments: ', appointments);

        res.status(200).json({ appointments });
    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Update appointment schedule
router.put('/updateSchedule', authenticate, async (req, res) => {
    try {
        const { appointments: updatedAppointments } = req.body;
        if (!updatedAppointments || !Array.isArray(updatedAppointments)) {
            return res.status(400).json({ message: 'Invalid appointments data' });
        }
        
        // Build bulk update operations
        const bulkOps = updatedAppointments.map(app => ({
            updateOne: {
                filter: { _id: app._id },
                update: { $set: { scheduledTime: app.scheduledTime } },
            }
        }));

        const result = await Appointment.bulkWrite(bulkOps);
        console.log('Bulk update result:', result);
        res.status(200).json({ message: 'Appointments schedule updated successfully', result });
    } catch (error) {
        console.error('Error updating appointments schedule:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;
