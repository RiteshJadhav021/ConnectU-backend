const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Send a message (save to DB)
router.post('/send', async (req, res) => {
  try {
    const { fromUser, toUser, content, timestamp } = req.body;
    const message = new Message({ fromUser, toUser, content, timestamp });
    await message.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get conversation between a student and an alumni (protected)
router.get('/conversation/:studentId/:alumniId', auth, async (req, res) => {
  try {
    const { studentId, alumniId } = req.params;
    const messages = await Message.find({
      $or: [
        { fromUser: studentId, toUser: alumniId },
        { fromUser: alumniId, toUser: studentId }
      ]
    }).sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Get all student conversations for an alumni (latest message per student)
router.get('/conversations/alumni/:alumniId', auth, async (req, res) => {
  const { alumniId } = req.params;
  try {
    // Find all messages where alumni is the receiver
    const messages = await Message.find({ toUser: alumniId })
      .sort({ timestamp: -1 });

    // Group by student (fromUser)
    const conversations = {};
    messages.forEach(msg => {
      if (!conversations[msg.fromUser]) {
        conversations[msg.fromUser] = msg; // Only keep the latest message per student
      }
    });

    // Return as an array
    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// GET all messages for an alumni (student-alumni conversations)
router.get('/alumni/:id', async (req, res) => {
  try {
    const alumniId = req.params.id;
    // Find all messages where alumni is either sender or receiver
    const messages = await Message.find({
      $or: [
        { fromUser: alumniId },
        { toUser: alumniId }
      ]
    }).sort({ timestamp: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

module.exports = router;
