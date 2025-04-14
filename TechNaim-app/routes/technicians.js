const express = require('express');
const router = express.Router();
const Technician = require('../models/technicianModel'); // Technician model
const authenticate = require('../middlewares/authMiddleware.js');
const Appointment = require('../models/appointmentModel'); // Appointment model
const User = require('../models/userModel'); // User model

// let technicianLocations = {};

// Get all technicians
router.get('/', authenticate, async (req, res) => {
  const { companyId } = req.query;

  if (!companyId) {
    return res.status(400).json({ message: 'Company ID is required' });
  }

  try {
    const technicians = await Technician.find({ companyId }).populate('userId', 'name');

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


router.put('/update-location', authenticate, async (req, res) => {
  console.log('Entered update-location route');
  console.log("Request body:", req.body);
  console.log("Authenticated user:", req.user);
  try {
    // Get technicianId from authenticated user or token payload
    const technicianId = req.body.technicianId || req.user.technicianId;
    console.log('Technician ID obtained:', technicianId);
    if (!technicianId) {
      console.error('Technician ID is missing in req.user');
      return res.status(400).json({ error: 'Invalid data: Technician ID missing.' });
    }

    // Get coordinates from the request body
    let { lat, lng } = req.body;
    console.log('Request body coordinates:', { lat, lng });
    if (lat == null || lng == null) {
      console.error('Coordinates missing in request body');
      return res.status(400).json({ error: 'Invalid data: Coordinates missing.' });
    }

    // Define the time window for "today" (from 8:00 AM to 11:59:59 PM)
    const now = new Date();
    console.log('Current time:', now.toISOString());
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 8, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    console.log('Start of today:', startOfToday.toISOString());
    console.log('End of today:', endOfToday.toISOString());

    // Look for an in-progress appointment today for the technician
    const appointmentToday = await Appointment.findOne({
      technicianId,
      status: 'in-progress',
      scheduledTime: { $gte: startOfToday, $lt: endOfToday }
    });
    console.log('Appointment found for today:', appointmentToday);

    // Determine the new location.
    const newLocation = (appointmentToday && lat != null && lng != null)
      ? { lat, lng }
      : { lat: null, lng: null };
    console.log('Determined new location:', newLocation);

    // Update the technician's location using their ID
    const technician = await Technician.findByIdAndUpdate(
      technicianId,
      { location: newLocation },
      { new: true }
    );
    if (!technician) {
      console.error('No technician found with ID:', technicianId);
      return res.status(404).json({ error: 'Technician not found.' });
    }
    console.log('Technician after update:', technician);

    return res.status(200).json({ message: 'Location updated.', location: technician.location });
  } catch (error) {
    console.error('Error updating technician location:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});



module.exports = router;
