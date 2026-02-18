const Assessment = require('../models/Assessment');
const User = require('../models/User');

// @desc    Match candidates by skill requirements
// @route   POST /api/mobility/match
exports.matchCandidates = async (req, res, next) => {
  try {
    const { skills, minScores, limit = 10 } = req.body;
    // skills: ['JavaScript', 'React'], minScores: { 'JavaScript': 70, 'React': 60 }

    if (!skills || skills.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide skills to match' });
    }

    // Aggregation: find users with those skills and rank them
    const pipeline = [
      { $unwind: '$scores' },
      { $match: { 'scores.skill': { $in: skills } } },
      {
        $group: {
          _id: { userId: '$userId', skill: '$scores.skill' },
          bestScore: { $max: '$scores.score' },
          latestDate: { $max: '$completedAt' }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          skills: {
            $push: {
              skill: '$_id.skill',
              score: '$bestScore',
              latestDate: '$latestDate'
            }
          },
          avgScore: { $avg: '$bestScore' },
          matchedSkillCount: { $sum: 1 }
        }
      },
      { $match: { matchedSkillCount: { $gte: Math.max(1, Math.floor(skills.length * 0.5)) } } },
      { $sort: { matchedSkillCount: -1, avgScore: -1 } },
      { $limit: parseInt(limit) }
    ];

    const results = await Assessment.aggregate(pipeline);

    // Populate user info
    const userIds = results.map(r => r._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email profile');
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const candidates = results.map(r => ({
      user: userMap[r._id.toString()],
      skills: r.skills,
      avgScore: Math.round(r.avgScore * 10) / 10,
      matchedSkillCount: r.matchedSkillCount,
      totalRequired: skills.length,
      matchPercentage: Math.round((r.matchedSkillCount / skills.length) * 100)
    })).filter(c => c.user);

    res.json({ success: true, count: candidates.length, candidates });
  } catch (error) {
    next(error);
  }
};

// @desc    AI Super Agent query - natural language skill search
// @route   POST /api/mobility/query
exports.superAgentQuery = async (req, res, next) => {
  try {
    const { query, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Please provide a query' });
    }

    // Parse skills from the query using keyword matching
    const allSkills = [
      'JavaScript', 'React', 'TypeScript', 'Node.js', 'Python',
      'Machine Learning', 'Deep Learning', 'DevOps', 'Docker', 'Kubernetes',
      'AWS', 'Cloud', 'SQL', 'Databases', 'MongoDB', 'API Design',
      'System Design', 'CSS', 'Testing', 'Security', 'CI/CD',
      'Data Processing', 'Data Visualization', 'Leadership', 'AI',
      'Go', 'Rust', 'Java', 'C++', 'Ruby', 'PHP', 'Swift',
      'Flutter', 'React Native', 'Angular', 'Vue'
    ];

    const queryLower = query.toLowerCase();
    const matchedSkills = allSkills.filter(skill =>
      queryLower.includes(skill.toLowerCase())
    );

    // If "AI" is in query, add ML-related skills
    if (queryLower.includes('ai') && !matchedSkills.includes('Machine Learning')) {
      matchedSkills.push('Machine Learning', 'Deep Learning', 'Python');
    }

    // If no specific skills found, try to infer from role keywords
    if (matchedSkills.length === 0) {
      if (queryLower.includes('frontend') || queryLower.includes('front-end')) {
        matchedSkills.push('JavaScript', 'React', 'CSS');
      } else if (queryLower.includes('backend') || queryLower.includes('back-end')) {
        matchedSkills.push('Node.js', 'Databases', 'API Design');
      } else if (queryLower.includes('fullstack') || queryLower.includes('full-stack') || queryLower.includes('full stack')) {
        matchedSkills.push('JavaScript', 'React', 'Node.js');
      } else if (queryLower.includes('devops') || queryLower.includes('infrastructure')) {
        matchedSkills.push('DevOps', 'Docker', 'CI/CD');
      } else if (queryLower.includes('data')) {
        matchedSkills.push('SQL', 'Python', 'Data Processing');
      } else {
        // Default broad search
        matchedSkills.push('JavaScript', 'Python', 'System Design');
      }
    }

    // Run match with parsed skills
    const pipeline = [
      { $unwind: '$scores' },
      { $match: { 'scores.skill': { $in: matchedSkills } } },
      {
        $group: {
          _id: { userId: '$userId', skill: '$scores.skill' },
          bestScore: { $max: '$scores.score' }
        }
      },
      {
        $group: {
          _id: '$_id.userId',
          skills: {
            $push: { skill: '$_id.skill', score: '$bestScore' }
          },
          avgScore: { $avg: '$bestScore' },
          matchedCount: { $sum: 1 }
        }
      },
      { $sort: { avgScore: -1 } },
      { $limit: parseInt(limit) }
    ];

    const results = await Assessment.aggregate(pipeline);

    const userIds = results.map(r => r._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email profile');
    const userMap = {};
    users.forEach(u => { userMap[u._id.toString()] = u; });

    const candidates = results.map((r, index) => ({
      rank: index + 1,
      user: userMap[r._id.toString()],
      skills: r.skills.sort((a, b) => b.score - a.score),
      avgScore: Math.round(r.avgScore * 10) / 10,
      matchedSkills: r.matchedCount
    })).filter(c => c.user);

    res.json({
      success: true,
      query,
      parsedSkills: matchedSkills,
      count: candidates.length,
      candidates
    });
  } catch (error) {
    next(error);
  }
};
