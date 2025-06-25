const mongoose = require('mongoose');

const tpoSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'tpo' },
});

module.exports = mongoose.model('TPO', tpoSchema);
