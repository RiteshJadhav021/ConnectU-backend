const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Student = require('../models/Student');
const Post = require('../models/Post');
const auth = require('../middleware/auth'); // You need to have an auth middleware that sets req.user
const cloudinary = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Get current student profile
router.get('/me', auth, async (req, res) => {
  try {
    // req.user.id should be set by your auth middleware after verifying JWT
    // Only allow students to access this endpoint
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Include img field in response
    const student = await Student.findById(req.user.id).select('name prn email role img');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({
      _id: student._id, // Always include _id for frontend
      name: student.name,
      prn: student.prn,
      email: student.email,
      role: student.role,
      img: student.img || ''
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload profile photo
router.post('/me/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    // Only allow students
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile_photos',
      public_id: req.user.id,
      overwrite: true,
    });
    // Save photo URL to student
    await Student.findByIdAndUpdate(req.user.id, { img: result.secure_url });
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Update student profile (role change validation)
router.put('/me', auth, async (req, res) => {
  try {
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    // If changing role to alumni
    if (req.body.role === 'alumni' && student.role !== 'alumni') {
      const passout = req.body.passout;
      if (!passout) {
        return res.status(400).json({ error: 'Passout year required to become alumni.' });
      }
      const currentYear = new Date().getFullYear();
      if (parseInt(passout) > currentYear) {
        return res.status(400).json({ error: 'Passout year cannot be in the future.' });
      }
      // Optionally: check if already alumni in Alumni collection
      // If you want admin approval, set a flag here instead of changing role directly
      student.role = 'alumni';
      student.passout = passout;
    }

    // Update other fields (name, email, etc.)
    if (req.body.name) student.name = req.body.name;
    if (req.body.email) student.email = req.body.email;
    // ...add more fields as needed

    await student.save();
    res.json({ message: 'Profile updated', student });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Change password route
router.post('/me/password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required.' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match.' });
    }
    const student = await Student.findById(req.user.id);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(oldPassword, student.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Old password is incorrect.' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    student.password = hashed;
    await student.save();
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed.' });
  }
});

// Public: Get student details by ID (for alumni messaging)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Convert to ObjectId if possible
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }
    const student = await Student.findById(objectId).select('name img _id');
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ _id: student._id, name: student.name, img: student.img || '' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Like a post
router.post('/posts/:postId/like', auth, async (req, res) => {
  try {
    // Only allow students
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Only students can like posts.' });
    }

    const { postId } = req.params;
    
    // Validate postId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const userId = req.user.id;
    
    // Check if already liked
    if (post.likedBy.includes(userId)) {
      // Unlike: remove from likedBy array and decrement likes
      post.likedBy = post.likedBy.filter(id => id !== userId);
      post.likes = Math.max(0, post.likes - 1);
      await post.save();
      return res.json({ message: 'Post unliked', likes: post.likes, likedBy: post.likedBy });
    } else {
      // Like: add to likedBy array and increment likes
      post.likedBy.push(userId);
      post.likes += 1;
      await post.save();
      return res.json({ message: 'Post liked', likes: post.likes, likedBy: post.likedBy });
    }
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Add comment to a post
router.post('/posts/:postId/comment', auth, async (req, res) => {
  try {
    // Only allow students
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied. Only students can comment.' });
    }

    const { postId } = req.params;
    const { text } = req.body;

    // Validate postId
    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Validate comment text
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    if (text.trim().length > 500) {
      return res.status(400).json({ error: 'Comment must be 500 characters or less' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get student details
    const student = await Student.findById(req.user.id).select('name img');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Add comment with student info
    const newComment = {
      user: student.name,
      userId: req.user.id,
      userImg: student.img || '',
      text: text.trim(),
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    res.json({ 
      message: 'Comment added', 
      comment: newComment,
      totalComments: post.comments.length 
    });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete a comment (only own comments)
router.delete('/posts/:postId/comment/:commentId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { postId, commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentIndex = post.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Check if comment belongs to this user
    if (post.comments[commentIndex].userId !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.json({ message: 'Comment deleted', totalComments: post.comments.length });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

module.exports = router;
