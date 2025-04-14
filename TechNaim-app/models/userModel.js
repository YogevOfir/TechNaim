const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  country_id: { type: Number, required: true },
  email: { type: String, required: true, unique: true , lowercase: true},
  phone: { type: String, required: true },
  address: { type: String, lowercase: true, required: true},
  addressCoordinates: { 
    lat: { type: Number}, 
    lng: { type: Number} 
  },
  password: { type: String, required: true },
  role: { type: String, enum: ['customer', 'technician', 'admin', 'superAdmin'], required: true, default: 'customer' },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null }, // Only for technicians/admins
  createdAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('User', userSchema);
