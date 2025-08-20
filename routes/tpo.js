const express = require('express');
const router = express.Router();
const TPO = require('../models/TPO');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const cloudinary = require('../config/cloudinary');
const auth = require('../middleware/auth');

// Delete TPO post
router.delete('/posts/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'tpo') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const Post = require('../models/Post');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    // Only allow author to delete
    if (String(post.author) !== String(req.user.id) || post.authorModel !== 'TPO') {
      return res.status(403).json({ error: 'You can only delete your own posts.' });
    }
    await post.deleteOne();
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});
// ...existing code...

// Get current TPO profile
router.get('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'tpo') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const tpo = await TPO.findById(req.user.id).select('name email role img company description skills');
    if (!tpo) return res.status(404).json({ error: 'TPO not found' });
    res.json({
      _id: tpo._id,
      name: tpo.name,
      email: tpo.email,
      role: tpo.role,
      img: tpo.img || '',
      company: tpo.company || '',
      description: tpo.description || '',
      skills: tpo.skills || []
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update TPO profile
router.put('/me', auth, async (req, res) => {
  try {
    if (req.user.role !== 'tpo') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const tpo = await TPO.findById(req.user.id);
    if (!tpo) return res.status(404).json({ error: 'TPO not found' });
    if (req.body.name) tpo.name = req.body.name;
    if (req.body.company) tpo.company = req.body.company;
    if (req.body.description) tpo.description = req.body.description;
    if (req.body.skills) tpo.skills = req.body.skills;
    if (req.body.img) tpo.img = req.body.img;
    await tpo.save();
    res.json({ message: 'Profile updated', tpo });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Upload profile photo
router.post('/me/photo', auth, upload.single('photo'), async (req, res) => {
  try {
    if (req.user.role !== 'tpo') {
      return res.status(403).json({ error: 'Access denied' });
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile_photos',
      public_id: req.user.id,
      overwrite: true,
    });
    await TPO.findByIdAndUpdate(req.user.id, { img: result.secure_url });
    res.json({ url: result.secure_url });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Create post
router.post('/posts', auth, upload.single('image'), async (req, res) => {
  try {
    if (req.user.role !== 'tpo') {
      return res.status(403).json({ error: 'Access denied' });
    }
    let imageUrl = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'tpo_posts',
        overwrite: true,
      });
      imageUrl = result.secure_url;
    }
    const Post = require('../models/Post');
    const post = new Post({
      content: req.body.content,
      image: imageUrl,
      author: req.user.id,
      authorModel: 'TPO',
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
      comments: []
    });
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get all posts
router.get('/posts', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    // Return all posts from both Alumni and TPO
    const posts = await Post.find({}).populate('author', 'name img');
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Like a post
router.post('/posts/:id/like', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const userId = req.body.userId;
    if (!post.likedBy.includes(userId)) {
      post.likes += 1;
      post.likedBy.push(userId);
      await post.save();
    }
    res.json({ likes: post.likes, likedBy: post.likedBy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Comment on a post
router.post('/posts/:id/comment', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    post.comments.push({ user: req.body.user, text: req.body.text, id: Date.now() });
    await post.save();
    res.json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
