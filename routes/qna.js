const express = require('express');
const router = express.Router();
const QnAQuestion = require('../models/QnAQuestion');

// Helper to infer model fallback
function normalizeModel(model) {
  if (['Student','Alumni','Teacher','TPO','User'].includes(model)) return model;
  return 'User';
}

// GET /api/qna/questions  (optional ?limit=20)
router.get('/questions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const questions = await QnAQuestion.find({})
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    res.json(questions);
  } catch (err) {
    console.error('Error fetching QnA questions:', err);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// POST /api/qna/questions  { questionText, userId, userName, userImg, userModel }
router.post('/questions', async (req, res) => {
  try {
    const { questionText, userId, userName, userImg = '', userModel } = req.body;
    if (!questionText || !userId || !userName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const doc = new QnAQuestion({
      questionText,
      askedById: userId,
      askedByName: userName,
      askedByImg: userImg,
      askedByModel: normalizeModel(userModel),
    });
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error('Error creating QnA question:', err);
    res.status(500).json({ error: 'Failed to create question' });
  }
});

// POST /api/qna/questions/:id/answers  { text, userId, userName, userImg, userModel }
router.post('/questions/:id/answers', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, userId, userName, userImg = '', userModel } = req.body;
    if (!text || !userId || !userName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const question = await QnAQuestion.findById(id);
    if (!question) return res.status(404).json({ error: 'Question not found' });
    question.answers.push({
      text,
      answeredById: userId,
      answeredByName: userName,
      answeredByImg: userImg,
      answeredByModel: normalizeModel(userModel),
    });
    await question.save();
    res.json(question);
  } catch (err) {
    console.error('Error adding answer:', err);
    res.status(500).json({ error: 'Failed to add answer' });
  }
});

module.exports = router;
