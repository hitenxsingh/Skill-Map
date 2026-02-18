const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['frontend', 'backend', 'devops', 'cloud', 'data', 'ml', 'security', 'mobile', 'design', 'leadership', 'database', 'testing', 'other'],
    default: 'other'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster lookups
SkillSchema.index({ name: 1 });
SkillSchema.index({ category: 1 });

module.exports = mongoose.model('Skill', SkillSchema);
