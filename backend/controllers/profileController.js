const User = require('../models/User');

// @desc    Update user profile
// @route   PUT /api/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { currentRole, yearsOfExperience, techStack, desiredRole, department, bio } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        profile: {
          currentRole: currentRole || '',
          yearsOfExperience: yearsOfExperience || 0,
          techStack: techStack || [],
          desiredRole: desiredRole || '',
          department: department || '',
          bio: bio || ''
        }
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/profile/:userId
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile: user.profile,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees (admin)
// @route   GET /api/profile/employees
exports.getAllEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json({
      success: true,
      count: employees.length,
      employees
    });
  } catch (error) {
    next(error);
  }
};
