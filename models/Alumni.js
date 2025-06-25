const mongoose = require('mongoose');

const alumniSchema = new mongoose.Schema({
  name: String,
  passout: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'alumni' },
});

module.exports = mongoose.model('Alumni', alumniSchema);
