const mongoose = require('mongoose');

const learningPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  targetRole: {
    type: String,
    required: [true, 'Please specify a target role']
  },
  gaps: [{
    skill: { type: String, required: true },
    currentLevel: { type: Number, default: 0 },
    requiredLevel: { type: Number, required: true },
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    }
  }],
  recommendations: [{
    title: { type: String, required: true },
    provider: { type: String },
    url: { type: String },
    skill: { type: String },
    duration: { type: String },
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'] }
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  generatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LearningPlan', learningPlanSchema);
