const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true 
  },
  otp: { 
    type: String, 
    required: true 
  },
  userData: {
    name: String,
    prn: String,
    passout: String,
    email: String,
    password: String,
    role: String
  },
  expiresAt: { 
    type: Date, 
    default: Date.now, 
    expires: 300 // 5 minutes
  }
});

module.exports = mongoose.model('OTP', otpSchema);