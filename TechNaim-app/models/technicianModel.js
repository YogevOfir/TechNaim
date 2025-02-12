const mongoose = require('mongoose');

const technicianSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  skills: [String], default: [], // Array of skills
  location: {
    lat: { type: Number, default: null }, // Latitude - geolocation 
    lng: { type: Number, default: null } // Longitude - geolocation
  },
  availability: { type: Boolean, default: true }, // If the technician is active, maybe i will change to array of dates
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Technician', technicianSchema);
