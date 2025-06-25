const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: String,
  prn: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'student' },
});

module.exports = mongoose.model('Student', studentSchema);
