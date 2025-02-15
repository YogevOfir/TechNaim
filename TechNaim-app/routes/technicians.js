const express = require('express');
const router = express.Router();
const Technician = require('../models/technicianModel'); // Technician model
const authenticate = require('../middlewares/authMiddleware'); 
const User = require('../models/userModel'); // User model

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

module.exports = router;
