const express = require('express');
const router = express.Router();
const {
  ingestResult,
  getMyAssessments,
  getAllAssessments,
  getSkillDistribution,
  getAllSkills,
  addSkill,
  getSkillGaps
} = require('../controllers/assessmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, ingestResult);
router.get('/me', protect, getMyAssessments);
router.get('/skills', protect, getAllSkills);
router.post('/skills', protect, addSkill);
router.get('/gaps', protect, authorize('admin'), getSkillGaps);
router.get('/distribution', protect, authorize('admin'), getSkillDistribution);
router.get('/', protect, authorize('admin'), getAllAssessments);

module.exports = router;
