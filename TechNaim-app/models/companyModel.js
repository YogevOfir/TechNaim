const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: { type: String, required: true },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Admin who manages the company
  technicians: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Technician' }], // Technicians working for the company
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema);