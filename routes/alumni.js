const express = require('express');
const router = express.Router();
const Alumni = require('../models/Alumni');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const upload = multer();

// Get all alumni profiles (for students to view)
router.get('/', async (req, res) => {
  try {
    // Only return public fields
    const alumni = await Alumni.find({}, 'name email img skills company description');
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get logged-in alumni profile (with all fields)
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'alumni') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const alumni = await Alumni.findById(req.user.id);
    if (!alumni) return res.status(404).json({ error: 'Profile not found' });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update alumni profile (for logged-in alumni)
router.put('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'alumni') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const { skills, company, description, img } = req.body;
    const alumni = await Alumni.findByIdAndUpdate(
      req.user.id,
      { skills, company, description, img },
      { new: true }
    );
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload alumni profile photo
router.post('/me/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.role !== 'alumni') {
      return res.status(403).json({ error: 'Access denied' });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Upload to Cloudinary using a stream
    const streamUpload = (buffer) => {
      return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'alumni_profiles' },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });
    };
    const result = await streamUpload(req.file.buffer);
    // Update alumni img field
    const alumni = await Alumni.findByIdAndUpdate(
      req.user.id,
      { img: result.secure_url },
      { new: true }
    );
    res.json({ url: result.secure_url, alumni });
  } catch (err) {
    res.status(500).json({ error: 'Image upload failed' });
  }
});

module.exports = router;
