const express = require('express');
const router = express.Router();
const { updateProfile, getProfile, getAllEmployees } = require('../controllers/profileController');
const { protect, authorize } = require('../middleware/auth');

router.put('/', protect, updateProfile);
router.get('/employees', protect, authorize('admin'), getAllEmployees);
router.get('/:userId', protect, getProfile);

module.exports = router;
