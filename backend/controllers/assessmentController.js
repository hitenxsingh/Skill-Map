const Assessment = require('../models/Assessment');
const Skill = require('../models/Skill');
const User = require('../models/User');
const courseDatabase = require('../data/courseDatabase');

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

// @desc    Get all unique skills (from Skill collection + assessments)
// @route   GET /api/assessments/skills
exports.getAllSkills = async (req, res, next) => {
  try {
    // Get skills from the Skill collection
    const savedSkills = await Skill.find().sort({ name: 1 }).lean();
    
    // Also get unique skills from assessments (in case some aren't in Skill collection)
    const assessmentSkills = await Assessment.aggregate([
      { $unwind: '$scores' },
      { $group: { _id: '$scores.skill' } },
      { $sort: { _id: 1 } }
    ]);
    
    // Merge and deduplicate
    const skillSet = new Set(savedSkills.map(s => s.name));
    assessmentSkills.forEach(s => skillSet.add(s._id));
    
    // Build response with category info where available
    const skillMap = Object.fromEntries(savedSkills.map(s => [s.name, s.category]));
    const skills = [...skillSet].sort().map(name => ({
      name,
      category: skillMap[name] || 'other'
    }));
    
    res.json({ success: true, skills, count: skills.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new skill
// @route   POST /api/assessments/skills
exports.addSkill = async (req, res, next) => {
  try {
    const { name, category } = req.body;
    
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Skill name is required (min 2 characters)' });
    }
    
    // Check if skill already exists
    const existing = await Skill.findOne({ name: { $regex: `^${name.trim()}$`, $options: 'i' } });
    if (existing) {
      return res.json({ success: true, skill: existing, message: 'Skill already exists' });
    }
    
    const skill = await Skill.create({
      name: name.trim(),
      category: category || 'other'
    });
    
    res.status(201).json({ success: true, skill });
  } catch (error) {
    next(error);
  }
};

// @desc    Get org skill gaps with course recommendations (admin)
// @route   GET /api/assessments/gaps
exports.getSkillGaps = async (req, res, next) => {
  try {
    // Get skill distribution with detailed stats
    const skillStats = await Assessment.aggregate([
      { $unwind: '$scores' },
      {
        $group: {
          _id: '$scores.skill',
          avgScore: { $avg: '$scores.score' },
          minScore: { $min: '$scores.score' },
          maxScore: { $max: '$scores.score' },
          totalAssessments: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          skill: '$_id',
          avgScore: { $round: ['$avgScore', 1] },
          minScore: 1,
          maxScore: 1,
          totalAssessments: 1,
          employeeCount: { $size: '$uniqueUsers' },
          _id: 0
        }
      },
      { $sort: { avgScore: 1 } } // Sort ascending to get weakest first
    ]);
    
    // Identify gaps (skills with avg score < 60%)
    const gaps = skillStats
      .filter(s => s.avgScore < 60)
      .map(s => {
        // Get course recommendations for this skill
        const courses = courseDatabase[s.skill] || [];
        return {
          ...s,
          severity: s.avgScore < 40 ? 'critical' : s.avgScore < 50 ? 'high' : 'medium',
          courses: courses.slice(0, 2) // Top 2 courses per skill
        };
      });
    
    // Category analysis - find which categories are weakest
    const categoryGaps = {};
    const categoryMapping = {
      'frontend': ['JavaScript', 'React', 'TypeScript', 'Next.js', 'CSS', 'HTML', 'Tailwind CSS', 'Redux', 'Webpack'],
      'backend': ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST APIs', 'GraphQL', 'Python', 'SQL', 'Redis'],
      'devops': ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Ansible', 'Terraform', 'Helm'],
      'cloud': ['AWS', 'Azure', 'GCP', 'Terraform', 'Serverless', 'Cloud Security'],
      'data': ['SQL', 'Python', 'Pandas', 'Data Visualization', 'Statistics', 'Tableau', 'Power BI', 'ETL Pipelines'],
      'ml': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP'],
      'security': ['Security', 'Penetration Testing', 'OWASP', 'Cloud Security', 'Cryptography'],
      'leadership': ['Leadership', 'Communication', 'People Management', 'Project Management', 'Mentoring']
    };
    
    skillStats.forEach(s => {
      for (const [category, skills] of Object.entries(categoryMapping)) {
        if (skills.includes(s.skill)) {
          if (!categoryGaps[category]) {
            categoryGaps[category] = { skills: [], totalScore: 0, count: 0 };
          }
          categoryGaps[category].skills.push(s.skill);
          categoryGaps[category].totalScore += s.avgScore;
          categoryGaps[category].count++;
        }
      }
    });
    
    const categoryAnalysis = Object.entries(categoryGaps)
      .map(([category, data]) => ({
        category,
        avgScore: Math.round(data.totalScore / data.count),
        skillCount: data.count,
        skills: data.skills
      }))
      .sort((a, b) => a.avgScore - b.avgScore);
    
    // Get employees who need training (lowest performers)
    const employeesNeedingTraining = await Assessment.aggregate([
      { $unwind: '$scores' },
      {
        $group: {
          _id: '$userId',
          avgScore: { $avg: '$scores.score' },
          skillCount: { $sum: 1 },
          weakSkills: {
            $push: {
              $cond: [{ $lt: ['$scores.score', 50] }, '$scores.skill', null]
            }
          }
        }
      },
      { $match: { avgScore: { $lt: 50 } } },
      { $sort: { avgScore: 1 } },
      { $limit: 20 }
    ]);
    
    // Get user details
    const userIds = employeesNeedingTraining.map(e => e._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email profile.department profile.currentRole').lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));
    
    const trainingNeeds = employeesNeedingTraining.map(e => {
      const user = userMap[e._id.toString()];
      const weakSkills = e.weakSkills.filter(Boolean);
      return {
        name: user?.name || 'Unknown',
        email: user?.email,
        department: user?.profile?.department || 'N/A',
        role: user?.profile?.currentRole || 'N/A',
        avgScore: Math.round(e.avgScore),
        weakSkillCount: weakSkills.length,
        topWeakSkills: weakSkills.slice(0, 5)
      };
    });
    
    res.json({
      success: true,
      gaps,
      categoryAnalysis,
      trainingNeeds,
      summary: {
        totalGaps: gaps.length,
        criticalGaps: gaps.filter(g => g.severity === 'critical').length,
        weakestCategory: categoryAnalysis[0]?.category || 'N/A',
        employeesNeedingTraining: trainingNeeds.length
      }
    });
  } catch (error) {
    next(error);
  }
};

