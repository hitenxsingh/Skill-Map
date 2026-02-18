const express = require('express');
const router = express.Router();
const {
  ingestResult,
  getMyAssessments,
  getAllAssessments,
  getSkillDistribution
} = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, ingestResult);
router.get('/me', protect, getMyAssessments);
router.get('/distribution', protect, authorize('admin'), getSkillDistribution);
router.get('/', protect, authorize('admin'), getAllAssessments);

module.exports = router;
