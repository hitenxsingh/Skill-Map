const LearningPlan = require('../models/LearningPlan');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const roleRequirements = require('../data/roleRequirements');
const courseDatabase = require('../data/courseDatabase');

// @desc    Generate learning plan based on gap analysis
// @route   POST /api/learning/generate
exports.generatePlan = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const targetRole = req.body.targetRole || user.profile.desiredRole;

    if (!targetRole) {
      return res.status(400).json({
        success: false,
        message: 'Please specify a target role or set a desired role in your profile'
      });
    }

    // Get role requirements
    const requirements = roleRequirements[targetRole];
    if (!requirements) {
      return res.status(400).json({
        success: false,
        message: `No requirements defined for role: ${targetRole}. Available roles: ${Object.keys(roleRequirements).join(', ')}`
      });
    }

    // Get latest assessment scores
    const assessments = await Assessment.find({ userId: req.user.id }).sort({ completedAt: -1 });

    const skillScores = {};
    assessments.forEach(a => {
      a.scores.forEach(s => {
        if (!skillScores[s.skill]) {
          skillScores[s.skill] = s.score;
        }
      });
    });

    // Gap analysis
    const gaps = requirements.skills.map(req => {
      const current = skillScores[req.skill] || 0;
      const gap = req.requiredLevel - current;
      let priority = 'low';
      if (gap > 40) priority = 'high';
      else if (gap > 20) priority = 'medium';

      return {
        skill: req.skill,
        currentLevel: current,
        requiredLevel: req.requiredLevel,
        priority: gap > 0 ? priority : 'low'
      };
    }).sort((a, b) => (b.requiredLevel - b.currentLevel) - (a.requiredLevel - a.currentLevel));

    // Generate recommendations from course database
    const recommendations = [];
    gaps.forEach(gap => {
      if (gap.currentLevel < gap.requiredLevel) {
        const courses = courseDatabase[gap.skill] || [];
        let level = 'beginner';
        if (gap.currentLevel > 50) level = 'intermediate';
        if (gap.currentLevel > 70) level = 'advanced';

        const matchingCourses = courses.filter(c => c.level === level || courses.length <= 1);
        const selected = matchingCourses.length > 0 ? matchingCourses[0] : courses[0];

        if (selected) {
          recommendations.push({
            ...selected,
            skill: gap.skill
          });
        }
      }
    });

    // Save or update plan
    let plan = await LearningPlan.findOne({ userId: req.user.id });
    if (plan) {
      plan.targetRole = targetRole;
      plan.gaps = gaps;
      plan.recommendations = recommendations;
      plan.generatedAt = Date.now();
      await plan.save();
    } else {
      plan = await LearningPlan.create({
        userId: req.user.id,
        targetRole,
        gaps,
        recommendations
      });
    }

    res.json({ success: true, plan });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's learning plan
// @route   GET /api/learning/me
exports.getMyPlan = async (req, res, next) => {
  try {
    const plan = await LearningPlan.findOne({ userId: req.user.id })
      .sort({ generatedAt: -1 });

    if (!plan) {
      return res.json({
        success: true,
        plan: null,
        availableRoles: Object.keys(roleRequirements)
      });
    }

    res.json({
      success: true,
      plan,
      availableRoles: Object.keys(roleRequirements)
    });
  } catch (error) {
    next(error);
  }
};
