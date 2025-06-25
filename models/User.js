const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  prn: String,
  passout: String,
  email: { type: String, unique: true },
  password: String,
  role: String,
});

module.exports = mongoose.model('User', userSchema);
