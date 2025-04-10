const schedule = require('node-schedule');
const Appointment = require('../models/appointmentModel'); // Import the appointment model

// Function to update pending appointments to in-progress.
async function updatePendingToInProgress() {
  try {
    const now = new Date();
    // Define the end of today (optional, if you wish to restrict to appointments later today)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    // Find appointments that are pending and scheduled for later today.
    const appointments = await Appointment.find({ 
      scheduledTime: { $gte: now, $lt: endOfDay }, 
      status: 'pending' 
    });
    for (const appointment of appointments) {
      appointment.status = 'in-progress';
      await appointment.save();
      console.log(`Appointment ${appointment._id} status updated to in-progress`);
    }
  } catch (error) {
    console.error('Error updating appointment status:', error);
  }
}

// Schedule the job to run every morning at 8:00.
schedule.scheduleJob('0 8 * * *', updatePendingToInProgress);

// Export the function for manual triggering at startup.
module.exports = { updatePendingToInProgress };