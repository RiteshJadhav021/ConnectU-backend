const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  name: String,
  passout: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'alumni' },
  skills: [String],
  company: String,
  description: String,
  img: String,
});

module.exports = mongoose.model('Alumni', alumniSchema);
