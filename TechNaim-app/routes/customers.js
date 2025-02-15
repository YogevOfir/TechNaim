const express = require('express');
const router = express.Router();
const User = require('../models/userModel'); // Customer model
const authenticate = require('../middlewares/authMiddleware'); 

// Get all customers
router.get('/', authenticate, async (req, res) => {
    try {
        const customers = await User.find({ role: 'customer' });
        res.status(200).json(customers);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Get a single customer by ID
router.get('/:id', authenticate, async (req, res) => {
    try {
        const customer = await User.findById(req.params.id);
        if (!customer || customer.role !== 'customer') return res.status(404).json({ message: 'Customer not found' });

        res.status(200).json(customer);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Create a customer
router.post('/', authenticate, async (req, res) => {
    try {
        const { name, email, companyId } = req.body;

        if (!name || !email || !companyId) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const newCustomer = new User({ name, email, companyId, role: 'customer' });
        await newCustomer.save();

        res.status(201).json({ message: 'Customer created successfully', customer: newCustomer });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Delete a customer
router.delete('/:id', authenticate, async (req, res) => {
    try {
        const customer = await User.findById(req.params.id);
        if (!customer || customer.role !== 'customer') return res.status(404).json({ message: 'Customer not found' });

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Customer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;
