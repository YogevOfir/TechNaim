const express = require('express');
const User = require('../models/userModel');
const Technician = require('../models/technicianModel');
const Company = require('../models/companyModel');
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
      if (!['customer', 'technician', 'admin', 'superAdmin'].includes(user.role)) {
          return res.status(403).json({ message: 'Unauthorized: Invalid user role' });
      }

      // Generate JWT token, jwt token is used for authorization
      const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Send user details & token
      res.status(200).json({ token, user: { id: user._id, name: user.name, country_id: user.country_id, email: user.email, phone: user.phone, address: user.address, role: user.role, companyId: user.companyId || null } });
  } catch (err) {
      console.error("Error during login", err);
      res.status(500).json({ message: 'Server error', error: err.message });
  }
});



// Public Signup: Only Customers Can Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, country_id, email, phone, address, password, role, companyId } = req.body;
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
      phone,
      address,
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


// Create and Assign a Technician to a Company (Admin Only)
router.post('/create-and-assign-technician', authMiddleware, async (req, res) => {
    try {
        const { name, country_id, email, phone, password} = req.body;
    
        // Ensure only admins can assign technicians
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Unauthorized: Only admins can assign technicians' });
        }
    
        // Find company
        const company = await Company.findById(req.user.companyId);
        if (!company) return res.status(404).json({ message: 'Company not found' });
        console.log('Company found:', company);

        // Ensure email is unique
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        user = new User({ 
            name,
            country_id,
            email, 
            phone,
            password: hashedPassword, 
            role: 'technician',
            companyId: req.user.companyId
        });

        await user.save();
        console.log('User created:', user);  

        // Create technician 
        const technician = new Technician({ 
            userId: user._id,
            companyId: req.user.companyId,
         });

        await technician.save();
        console.log('Technician created:', technician);  

    
        // Assign the technician to the company
        company.technicians.push(technician._id);
        await company.save();
    
        res.status(200).json({ message: 'Technician assigned successfully', company });
        } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
        }
  });


// Super Admin Only: Create Admins
router.post('/create-admin', authMiddleware, async (req, res) => {
  try {
    const { name, country_id, email, phone, password, companyName } = req.body;

    // Only super admins can create admins
    if (req.user.role !== 'superAdmin') {
      return res.status(403).json({ message: 'Unauthorized: Only super admins can create admins' });
    }

    // Ensure email is unique
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if company already exists
    let company = await Company.findOne({ name: companyName });
    if (company) return res.status(400).json({ message: 'Company already exists' });

    // Create new admin user
    user = new User({ 
      name, 
      country_id,
      email, 
      phone,
      password: hashedPassword, 
      role: 'admin'
    });

    await user.save();

    // Create new company and link the adminId
    company = new Company({ name: companyName, adminId: user._id });

    await company.save();

    // Update the admin to include the companyId
    user.companyId = company._id;
    await user.save();

    res.status(201).json({ message: 'Admin created successfully', user });
  } catch (err) {
    console.error("Error creating admin:", err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


module.exports = router;
