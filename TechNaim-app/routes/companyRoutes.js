// const express = require('express');
// const Company = require('../models/companyModel'); // Ensure this model exists
// const User = require('../models/userModel'); // Ensure this model exists
// const authMiddleware = require('../middlewares/authMiddleware'); // Ensure this middleware exists

// const router = express.Router();


// // Create and Assign a Technician to a Company (Admin Only)
// router.post('/create-and-assign-technician', authMiddleware, async (req, res) => {
//     try {
//         const { name, country_id, email, password } = req.body;
    
//         // Ensure only admins can assign technicians
//         if (req.user.role !== 'admin') {
//             return res.status(403).json({ message: 'Unauthorized: Only admins can assign technicians' });
//         }
    
//         // Find company
//         const company = await Company.findById(req.user.companyId);
//         if (!company) return res.status(404).json({ message: 'Company not found' });
        
//         // Ensure email is unique
//         let user = await User.findOne({ email });
//         if (user) return res.status(400).json({ message: 'User already exists' });

//         // Hash password before saving
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create user
//         user = new User({ 
//             name,
//             country_id,
//             email, 
//             password: hashedPassword, 
//             role: 'technician', 
//             companyId: req.user.companyId
//         });

//         await user.save();

//         // Create technician 
//         const technician = new Technician({ 
//             userId: user._id,
//             companyId: req.user.companyId,
//             skills: [],
//             location: null
//          });

//         await technician.save();

    
//         // Assign the technician to the company
//         company.technicians.push(technician._id);
//         await company.save();
    
//         // Update technician's companyId
//         technician.companyId = company._id;
//         await technician.save();
    
//         res.status(200).json({ message: 'Technician assigned successfully', 
//         } catch (error) {
//         res.status(500).json({ message: 'Server error', error: error.message });
//         }
//   });
  
//   module.exports = router;
