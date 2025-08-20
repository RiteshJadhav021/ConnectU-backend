const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
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
const mongoose = require('mongoose');
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

module.exports = router;
