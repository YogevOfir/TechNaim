const express = require('express');
const router = express.Router();
const Appointment = require('../models/appointmentModel'); // Assuming you have this model
const authenticate = require('../middlewares/authMiddleware');
const Technician = require('../models/technicianModel')
const schedule = require('node-schedule'); // For scheduling tasks
const { recalcScheduleForTechnician } = require('./schedule');

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

        const isToday = new Date(scheduledTime).toDateString() === new Date().toDateString();
        // Create the appointment
        const newAppointment = new Appointment({
            customerId,
            technicianId,
            companyId,
            scheduledTime,
            notes,
            status: isToday ? 'in-progress' : 'pending', // Set status based on whether it's today or not
        });

        await newAppointment.save();

        // get technician address coordinates
        const technician = await Technician.findById(technicianId);
        if (!technician) {
            return res.status(404).json({ message: 'Technician not found' });
        }
        //  location = {lat, lng}
        const currentLocation = technician.location || null;


        recalcScheduleForTechnician(technicianId, scheduledTime, currentLocation)
            .then(scheduleResult => {
                console.log("Schedule recalculated:", scheduleResult);
            })
            .catch(err => {
                console.error("Error recalculating schedule:", err);
            });

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

        // // if appointment scheduled time is in the past, change status to completed
        // appointments.forEach(app => {
        //     if (new Date(app.scheduledTime).getDate < new Date().getDate() && app.status === 'pending' || app.status === 'in-progress') {
        //         app.status = 'completed';
        //         app.save();
        //     }
        // });

        const filteredAppointments = appointments.filter(app => app.status !== 'canceled' && app.status !== 'completed' && new Date(app.scheduledTime) > new Date());
        const sortedAppointments = filteredAppointments.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

        res.status(200).json({ appointments: sortedAppointments });
    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({ message: 'Server error' });
    }

});


// Get all appointments for a technician
router.get('/technician', authenticate, async (req, res) => {
    try {
        const technician = await Technician.findOne({ userId: req.user._id });
        console.log('Technician Id: ', technician._id);
        if (!technician) {
            return res.status(404).json({ message: 'Technician not found' });
        }

        const appointments = await Appointment.find({ technicianId: technician._id }).populate({
            path: 'customerId',
            select: 'name address phone addressCoordinates' // Populate customerId with name
        });

        // // if appointment scheduled time is in the past, change status to completed
        // appointments.forEach(app => {
        //     if (new Date(app.scheduledTime).getDate < new Date().getDate() && app.status === 'pending' || app.status === 'in-progress') {
        //         app.status = 'completed';
        //         app.save();
        //     }
        // });

        const filteredAppointments = appointments.filter(app => app.status !== 'canceled' && app.status !== 'completed' && new Date(app.scheduledTime) > new Date());
        const sortedAppointments = filteredAppointments.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

        const todaysAppointments = sortedAppointments.filter(app => {
            const appointmentDate = new Date(app.scheduledTime);
            return appointmentDate.toDateString() === new Date().toDateString(); // Filter for today's appointments
        });


        res.status(200).json({ appointments: sortedAppointments, todaysAppointments });
    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});


// Get all appointments for a user
router.get('/admin', authenticate, async (req, res) => {
    try {
        console.log('Authentication middleware invoked');
        const appointments = await Appointment.find({ companyId: req.user.companyId })
            .populate({
                path: 'customerId',
                select: 'name phone address country_id',
            })
            .populate({
                path: 'technicianId',
                populate: {
                    path: 'userId',
                    select: 'name phone country_id'
                }
            });
        console.log('Populated Appointments:', JSON.stringify(appointments, null, 2));

        // // if appointment scheduled time is in the past, change status to completed
        // appointments.forEach(app => {
        //     if (new Date(app.scheduledTime).getDate < new Date().getDate() && app.status === 'pending' || app.status === 'in-progress') {
        //         app.status = 'completed';
        //         app.save();
        //     }
        // });

        const filteredAppointments = appointments.filter(app => app.status !== 'canceled' && app.status !== 'completed' && new Date(app.scheduledTime) > new Date());
        const sortedAppointments = filteredAppointments.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

        res.status(200).json({ appointments: sortedAppointments });
    } catch (error) {
        console.error('Error getting appointments:', error);
        res.status(500).json({ message: 'Server error' });
    }

});



// Finish an appointment
router.put('/finish-task/:id', authenticate, async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.status = 'completed';
        await appointment.save();

        res.status(200).json({ message: 'Appointment finished successfully', appointment });
    } catch (error) {
        console.error('Error finishing appointment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;
