const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Alumni = require('../models/Alumni');
const auth = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Multer setup for file upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Create a post (alumni only)
router.post('/', auth, upload.single('image'), async (req, res) => {
  console.log('POST /api/alumni/posts called');
  try {
    const user = req.user;
    console.log('Authenticated user:', user);
    const alumni = await Alumni.findById(user.id);
    if (!alumni) {
      console.log('Alumni not found');
      return res.status(403).json({ error: 'Only alumni can post' });
    }

    let imageUrl = '';
    if (req.file) {
      console.log('Image file received');
      imageUrl = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'alumni_posts' },
          (error, result) => {
            if (error) {
              console.log('Cloudinary upload error:', error);
              return reject(error);
            }
            console.log('Cloudinary upload result:', result);
            resolve(result.secure_url);
          }
        );
        stream.end(req.file.buffer);
      });
    } else {
      console.log('No image file uploaded');
    }

    console.log('Post content:', req.body.content);
    const post = new Post({
      author: alumni._id,
      authorModel: 'Alumni',
      content: req.body.content,
      image: imageUrl
    });
    await post.save();
    console.log('Post saved:', post);
    res.status(201).json(post);
  } catch (err) {
    console.error('Error in /api/alumni/posts:', err);
    res.status(500).json({ error: 'Failed to create post', details: err.message });
  }
});

// Get all posts (for dashboard feed)
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().populate('author', 'name img').sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Delete a post (alumni only, must be author)
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = req.user;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own posts' });
    }
    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Add a like to a post (one like per user)
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const userId = req.body.userId;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    if (post.likedBy && post.likedBy.includes(userId)) {
      return res.status(400).json({ error: 'User already liked this post' });
    }
    post.likes = (post.likes || 0) + 1;
    post.likedBy = post.likedBy || [];
    post.likedBy.push(userId);
    await post.save();
    res.json({ likes: post.likes, likedBy: post.likedBy });
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Add a comment to a post
router.post('/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const { user, text } = req.body;
    if (!user || !text) return res.status(400).json({ error: 'User and text are required' });
    post.comments.push({ user, text });
    await post.save();
    res.json({ comments: post.comments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
