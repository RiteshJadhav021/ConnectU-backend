const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  user: { type: String, required: true }, // or ObjectId if you want to reference users
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const PostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'authorModel',
    required: true
  },
  authorModel: {
    type: String,
    enum: ['Alumni', 'TPO'],
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  likes: {
    type: Number,
    default: 0
  },
  likedBy: [{ type: String }], // store user IDs or emails
  comments: [CommentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Post', PostSchema);
