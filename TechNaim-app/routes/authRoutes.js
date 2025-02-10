const express = require('express');
const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Public Login: All Users Can Sign In
router.post('/login', async (req, res) => {
  try {
      const { email, password } = req.body;

      // Check if user exists
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Invalid email' });

      // Check if password is correct
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Invalid password' });

      // Verify user role
      if (!['customer', 'technician', 'admin'].includes(user.role)) {
          return res.status(403).json({ message: 'Unauthorized: Invalid user role' });
      }

      // Generate JWT token, jwt token is used for authorization
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Send user details & token
      res.status(200).json({ token, user: { id: user._id, name: user.name, country_id: user.country_id, email: user.email, role: user.role } });
  } catch (err) {
      console.error("Error during login", err);
      res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// Public Signup: Only Customers Can Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, country_id, email, password, role, companyId } = req.body;
    console.log('Recieved signup request', req.body);

    // Check if email already exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'This email already has an account' });

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    user = new User({ 
      name, 
      country_id,
      email, 
      password: hashedPassword, 
      role, 
      companyId: role !== 'customer' ? companyId : null // if role is customer, companyId is null
    });

    await user.save();

    // Generate JWT token, jwt token is used for authorization
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name, country_id, email, role } });
  } catch (err) {
    console.error("Error during signup", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// Admin Only: Create Technicians
router.post('/admin/create-technician', authMiddleware, async (req, res) => {
  try {
    const { name, country_id, email, password, companyId } = req.body;

    // Only admins can create technicians
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized: Only admins can create technicians' });
    }

    // Ensure email is unique
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create technician under the admin's company
    // Create technician under the admin's company
    user = new User({ 
      name,
      country_id,
      email, 
      password: hashedPassword, 
      role: 'technician', 
      companyId: req.user.companyId 
    });

    await user.save();

    res.status(201).json({ message: 'Technician created successfully', user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;
