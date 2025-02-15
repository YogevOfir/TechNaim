const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

module.exports = async (req, res, next) => {
  try {
    const token = req.header('Authorization');

    console.log("Received Tokennn:", token); // Debugging

    if (!token) return res.status(401).json({ message: 'Access denied, no token provided' });

    const tokenParts = token.split(" "); 
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const extractedToken = tokenParts[1];
    console.log("Extracted Token:", extractedToken); // Debugging
    
    // 🔹 Debugging: Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.log("JWT_SECRET is not set in environment variables!");
      return res.status(500).json({ message: "Server error: JWT_SECRET missing" });
    }

    console.log("Verifying Token...");
    
    const decoded = jwt.verify(extractedToken, process.env.JWT_SECRET);
    
    console.log("Decoded Token:", decoded); // Debugging

    req.user = await User.findById(decoded.id).select('-password'); 

    if (!req.user) return res.status(401).json({ message: 'User not found' });

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    res.status(401).json({ message: 'Invalid token' });
  }
};
