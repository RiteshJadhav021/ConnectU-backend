const express = require('express');
const router = express.Router();
const Alumni = require('../models/Alumni');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const upload = multer();
const uploadPost = multer();

// Get logged-in alumni profile (with all fields) - place before parameter routes
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
    const updateData = {};
    // Only set provided fields to avoid overwriting existing data with undefined
    if (typeof company !== 'undefined') updateData.company = company;
    if (typeof description !== 'undefined') updateData.description = description;
    if (typeof img !== 'undefined') updateData.img = img;
    if (typeof skills !== 'undefined') {
      // Normalize skills: accept array or comma-separated string
      if (Array.isArray(skills)) {
        updateData.skills = skills.filter((s) => typeof s === 'string').map((s) => s.trim()).filter(Boolean);
      } else if (typeof skills === 'string') {
        updateData.skills = skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    const alumni = await Alumni.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
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

// Return only IDs of all alumni (frontend helper)
router.get('/all-ids', async (_req, res) => {
  try {
    const ids = await Alumni.find({}, '_id');
    res.json(ids.map((d) => d._id));
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create alumni post
router.post('/posts', auth, uploadPost.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'alumni') {
      return res.status(403).json({ error: 'Access denied' });
    }
    let imageUrl = '';
    if (req.file) {
      // Upload image to Cloudinary
      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: 'alumni_posts' },
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });
      };
      const result = await streamUpload(req.file.buffer);
      imageUrl = result.secure_url;
    }
    const post = new Post({
      content: req.body.content,
      image: imageUrl,
      author: req.user.id,
      authorModel: 'Alumni',
      createdAt: new Date(),
    });
    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Alumni post creation error:', err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});
// Get alumni profile by ID (for chat page and other uses)
router.get('/:id', async (req, res) => {
  try {
    const alumni = await Alumni.findById(req.params.id).select('name img email skills company description');
    if (!alumni) return res.status(404).json({ error: 'Alumni not found' });
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
