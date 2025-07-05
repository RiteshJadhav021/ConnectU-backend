const express = require('express');
const router = express.Router();
const Alumni = require('../models/Alumni');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Cloudinary config (ensure your credentials are set in environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dlbyu8g36',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = multer();

// ...existing code...

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

// ...existing code...

module.exports = router;
