const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public Signup: Only Customers Can Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, companyId } = req.body;

    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'This email already has an account' });

    // Create new user
    user = new User({ name, email, password, role, companyId: role !== 'customer' ? companyId : null }); // if role is customer, companyId is null
    await user.save();

    // Generate JWT token, jwt token is used for authorization
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name, email, role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Admin Only: Create Technicians
router.post('/admin/create-technician', authMiddleware, async (req, res) => {
  try {
    const { name, email, password, companyId } = req.body;

    // Only admins can create technicians
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Only admins can create technicians' });
    }

    // Ensure email is unique
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Create technician under the admin's company
    user = new User({ name, email, password, role: 'technician', companyId: req.user.companyId });
    await user.save();

    res.status(201).json({ message: 'Technician created successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;
