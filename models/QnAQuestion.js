const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  answeredById: { type: mongoose.Schema.Types.ObjectId, required: true },
  answeredByName: { type: String, required: true },
  answeredByImg: { type: String, default: '' },
  answeredByModel: { type: String, enum: ['Student', 'Alumni', 'Teacher', 'TPO', 'User'], required: true },
}, { timestamps: true });

const QnAQuestionSchema = new mongoose.Schema({
  questionText: { type: String, required: true, trim: true },
  askedById: { type: mongoose.Schema.Types.ObjectId, required: true },
  askedByName: { type: String, required: true },
  askedByImg: { type: String, default: '' },
  askedByModel: { type: String, enum: ['Student', 'Alumni', 'Teacher', 'TPO', 'User'], required: true },
  answers: { type: [AnswerSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('QnAQuestion', QnAQuestionSchema);
