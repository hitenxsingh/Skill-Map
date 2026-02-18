const Assessment = require('../models/Assessment');

// @desc    Ingest assessment result
// @route   POST /api/assessments
exports.ingestResult = async (req, res, next) => {
  try {
    const { userId, source, category, scores } = req.body;

    const assessment = await Assessment.create({
      userId: userId || req.user.id,
      source,
      category,
      scores
    });

    res.status(201).json({ success: true, assessment });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user's assessments
// @route   GET /api/assessments/me
exports.getMyAssessments = async (req, res, next) => {
  try {
    const assessments = await Assessment.find({ userId: req.user.id })
      .sort({ completedAt: -1 });

    // Compute aggregated skill map
    const skillMap = {};
    assessments.forEach(a => {
      a.scores.forEach(s => {
        if (!skillMap[s.skill] || skillMap[s.skill].date < a.completedAt) {
          skillMap[s.skill] = { score: s.score, maxScore: s.maxScore, date: a.completedAt };
        }
      });
    });

    const latestSkills = Object.entries(skillMap).map(([skill, data]) => ({
      skill,
      score: data.score,
      maxScore: data.maxScore
    }));

    res.json({
      success: true,
      count: assessments.length,
      assessments,
      latestSkills
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all assessments (admin)
// @route   GET /api/assessments
exports.getAllAssessments = async (req, res, next) => {
  try {
    const assessments = await Assessment.find()
      .populate('userId', 'name email profile.department profile.currentRole')
      .sort({ completedAt: -1 });

    res.json({ success: true, count: assessments.length, assessments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get org-wide skill distribution (admin)
// @route   GET /api/assessments/distribution
exports.getSkillDistribution = async (req, res, next) => {
  try {
    const distribution = await Assessment.aggregate([
      { $unwind: '$scores' },
      {
        $group: {
          _id: '$scores.skill',
          avgScore: { $avg: '$scores.score' },
          maxScore: { $max: '$scores.score' },
          minScore: { $min: '$scores.score' },
          totalAssessments: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          skill: '$_id',
          avgScore: { $round: ['$avgScore', 1] },
          maxScore: 1,
          minScore: 1,
          totalAssessments: 1,
          employeeCount: { $size: '$uniqueUsers' },
          _id: 0
        }
      },
      { $sort: { avgScore: -1 } }
    ]);

    // Category-wise distribution
    const categoryDist = await Assessment.aggregate([
      {
        $group: {
          _id: '$category',
          avgScore: { $avg: '$overallScore' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: '$_id',
          avgScore: { $round: ['$avgScore', 1] },
          count: 1,
          _id: 0
        }
      }
    ]);

    res.json({ success: true, distribution, categoryDistribution: categoryDist });
  } catch (error) {
    next(error);
  }
};
