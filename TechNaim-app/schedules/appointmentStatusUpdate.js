const schedule = require('node-schedule');
const Appointment = require('../models/appointmentModel'); // Import the appointment model

// Update appointment status
schedule.scheduleJob('*/8 * * * *', async () => {
    try {
        const now = new Date();
        const appointments = await Appointment.find({ scheduledTime: { $lt: now }, status: 'pending' });

        for (const appointment of appointments) {
            appointment.status = 'in-progress';
            await appointment.save();
            console.log(`Appointment ${appointment._id} status updated to in-progress`);
        }
    } catch (error) {
        console.error('Error updating appointment status:', error);
    }
});