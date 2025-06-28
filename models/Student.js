const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  prn: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'student' },
  img: { type: String, default: '' }, // profile photo url
  passout: { type: String, default: '' }, // graduation year for alumni
});

module.exports = mongoose.model('Student', studentSchema);
