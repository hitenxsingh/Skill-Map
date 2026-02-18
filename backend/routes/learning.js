const express = require('express');
const router = express.Router();
const { generatePlan, getMyPlan } = require('../controllers/learningController');
const { protect } = require('../middleware/auth');

router.post('/generate', protect, generatePlan);
router.get('/me', protect, getMyPlan);

module.exports = router;
