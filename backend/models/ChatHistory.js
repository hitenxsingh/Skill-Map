const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  candidates: [{
    name: String,
    email: String,
    role: String,
    department: String,
    experience: Number,
    skills: [{
      skill: String,
      score: Number
    }],
    avgScore: Number
  }],
  meta: {
    model: String,
    tokens: Number,
    toolsUsed: [String]
  }
}, { _id: false, timestamps: true });

const chatHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Chat',
    maxlength: 120
  },
  messages: [messageSchema],
  messageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-generate title from first user message
chatHistorySchema.methods.autoTitle = function () {
  const firstMsg = this.messages.find(m => m.role === 'user');
  if (firstMsg) {
    this.title = firstMsg.content.substring(0, 100) + (firstMsg.content.length > 100 ? '…' : '');
  }
};

// Keep messageCount in sync
chatHistorySchema.pre('save', function (next) {
  this.messageCount = this.messages.length;
  next();
});

module.exports = mongoose.model('ChatHistory', chatHistorySchema);
