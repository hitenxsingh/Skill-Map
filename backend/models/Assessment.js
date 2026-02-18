const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  source: {
    type: String,
    enum: ['skill_lab', 'voice_ai', 'manual'],
    default: 'manual'
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    trim: true
  },
  scores: [{
    skill: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    maxScore: { type: Number, default: 100 }
  }],
  overallScore: {
    type: Number,
    default: 0
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate overall score before save
assessmentSchema.pre('save', function (next) {
  if (this.scores && this.scores.length > 0) {
    const totalScore = this.scores.reduce((acc, s) => acc + s.score, 0);
    this.overallScore = Math.round(totalScore / this.scores.length);
  }
  next();
});

module.exports = mongoose.model('Assessment', assessmentSchema);
