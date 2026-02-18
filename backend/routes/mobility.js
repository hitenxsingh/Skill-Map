const express = require('express');
const router = express.Router();
const { matchCandidates } = require('../controllers/mobilityController');
const {
  chatWithAgent,
  chatWithAgentStream,
  superAgentQuery,
  getChatSessions,
  getChatById,
  deleteChatSession
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

// Matching & query
router.post('/match', protect, authorize('admin'), matchCandidates);
router.post('/query', protect, authorize('admin'), superAgentQuery);

// AI Chat
router.post('/chat', protect, chatWithAgent);
router.post('/chat/stream', protect, chatWithAgentStream);

// Chat history
router.get('/chats', protect, getChatSessions);
router.get('/chats/:id', protect, getChatById);
router.delete('/chats/:id', protect, deleteChatSession);

module.exports = router;
