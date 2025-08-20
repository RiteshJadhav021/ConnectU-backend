const mongoose = require('mongoose');

const ConnectionRequestSchema = new mongoose.Schema({
  fromStudent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  toAlumni: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alumni',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  notified: {
    type: Boolean,
    default: false
  },
  notifiedStudent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('ConnectionRequest', ConnectionRequestSchema);
