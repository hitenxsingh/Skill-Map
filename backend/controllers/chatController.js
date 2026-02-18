const OpenAI = require('openai');
const mongoose = require('mongoose');
const Assessment = require('../models/Assessment');
const User = require('../models/User');
const LearningPlan = require('../models/LearningPlan');
const ChatHistory = require('../models/ChatHistory');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ═══════════════════════════════════════════════════════════════════
// GUARDRAILS
// ═══════════════════════════════════════════════════════════════════

const MAX_MESSAGE_LENGTH = 2000;
const MAX_CONVERSATION_MESSAGES = 40;
const MAX_TOOL_ROUNDS = 5;

function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  const forbidden = /(\$where|\$gt|\$lt|\$ne|\$regex|\$expr|javascript:|<script|eval\(|Function\(|process\.|require\(|__proto__|constructor\[)/gi;
  let cleaned = text.replace(forbidden, '[blocked]');
  return cleaned.substring(0, MAX_MESSAGE_LENGTH).trim();
}

function sanitizeStringParam(val, maxLen = 200) {
  if (typeof val !== 'string') return '';
  return val.replace(/[^\w\s.@\-/,()&+#]/g, '').substring(0, maxLen).trim();
}

function sanitizeNumber(val, min = 0, max = 100) {
  const n = parseInt(val);
  if (isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// ═══════════════════════════════════════════════════════════════════
// SKILL CATEGORY MAPPING
// When the AI or user says "backend", we expand to all related granular skills
// ═══════════════════════════════════════════════════════════════════

const SKILL_CATEGORIES = {
  'backend': ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST APIs', 'GraphQL', 'Python', 'SQL', 'Redis', 'Microservices', 'gRPC', 'Kafka', 'RabbitMQ'],
  'frontend': ['JavaScript', 'React', 'TypeScript', 'Next.js', 'CSS', 'HTML', 'Tailwind CSS', 'Redux', 'Webpack', 'Web Performance', 'Responsive Design', 'Accessibility'],
  'cloud': ['AWS', 'Azure', 'GCP', 'Terraform', 'Serverless', 'Cloud Security', 'Cost Optimization', 'Infrastructure as Code'],
  'devops': ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Ansible', 'Terraform', 'Helm', 'Istio', 'Prometheus', 'Grafana'],
  'data': ['SQL', 'Python', 'Pandas', 'Data Visualization', 'Statistics', 'Tableau', 'Power BI', 'Excel', 'ETL Pipelines', 'Data Modeling', 'Business Intelligence'],
  'ml': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Computer Vision', 'MLOps', 'Feature Engineering'],
  'ai': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Reinforcement Learning', 'Research'],
  'security': ['Security', 'Penetration Testing', 'OWASP', 'Cloud Security', 'SIEM', 'Cryptography', 'Incident Response', 'Compliance', 'Vulnerability Assessment', 'Threat Modeling'],
  'mobile': ['React Native', 'iOS', 'Android', 'Swift', 'Kotlin', 'Firebase', 'TypeScript'],
  'testing': ['Testing', 'Selenium', 'Cypress', 'Jest', 'Postman', 'Performance Testing', 'Security Testing', 'K6 Load Testing', 'Test Planning'],
  'design': ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping', 'Accessibility', 'User Testing', 'Adobe XD'],
  'leadership': ['Leadership', 'Communication', 'People Management', 'Project Management', 'Stakeholder Management', 'Mentoring', 'Agile', 'OKRs'],
  'infrastructure': ['AWS', 'Networking', 'Linux', 'Terraform', 'Docker', 'Monitoring', 'DNS', 'Load Balancing', 'Bash'],
  'database': ['PostgreSQL', 'MongoDB', 'Redis', 'SQL', 'Data Modeling', 'MySQL', 'Elasticsearch']
};

/**
 * Expand skill terms into granular skills. If the user asks for "backend",
 * we search for Node.js, Express.js, MongoDB, etc.
 */
function expandSkills(skills) {
  const expanded = new Set();
  for (const skill of skills) {
    const key = skill.toLowerCase().trim();
    if (SKILL_CATEGORIES[key]) {
      SKILL_CATEGORIES[key].forEach(s => expanded.add(s));
    } else {
      expanded.add(skill);
    }
  }
  return [...expanded];
}

// ═══════════════════════════════════════════════════════════════════
// SYSTEM PROMPT (full DB schema + capabilities)
// ═══════════════════════════════════════════════════════════════════

async function buildSystemPrompt() {
  const [totalEmployees, totalAssessments, totalPlans] = await Promise.all([
    User.countDocuments({ role: 'employee' }),
    Assessment.countDocuments(),
    LearningPlan.countDocuments()
  ]);

  const skillDistribution = await Assessment.aggregate([
    { $unwind: '$scores' },
    { $group: { _id: '$scores.skill', avg: { $avg: '$scores.score' }, count: { $sum: 1 }, users: { $addToSet: '$userId' } } },
    { $project: { skill: '$_id', avg: { $round: ['$avg', 1] }, employees: { $size: '$users' }, _id: 0 } },
    { $sort: { employees: -1 } },
    { $limit: 40 }
  ]);

  const deptDist = await User.aggregate([
    { $match: { role: 'employee' } },
    { $group: { _id: '$profile.department', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const roleDist = await User.aggregate([
    { $match: { role: 'employee' } },
    { $group: { _id: '$profile.currentRole', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 25 }
  ]);

  const categoryMap = Object.entries(SKILL_CATEGORIES)
    .map(([cat, skills]) => `  ${cat}: ${skills.slice(0, 8).join(', ')}`)
    .join('\n');

  return `You are SkillMap AI — an intelligent talent analytics & team-planning assistant.

TODAY: ${new Date().toISOString().split('T')[0]}

══════ DATABASE SCHEMA ══════

User {
  name: String, email: String, role: "employee"|"admin",
  profile: {
    currentRole: String, yearsOfExperience: Number,
    techStack: [String], desiredRole: String,
    department: String, bio: String
  }
}

Assessment {
  userId: ObjectId→User, source: "skill_lab"|"voice_ai"|"manual",
  category: String,
  scores: [{ skill: String, score: 0-100, maxScore: 100 }],
  overallScore: Number, completedAt: Date
}

LearningPlan {
  userId: ObjectId→User, targetRole: String,
  gaps: [{ skill: String, currentLevel: Number, requiredLevel: Number, priority: "high"|"medium"|"low" }],
  recommendations: [{ title, provider, url, skill, duration, level }],
  progress: 0-100
}

══════ SKILL CATEGORIES ══════
When the user mentions a broad area, map it to specific skills:
${categoryMap}

══════ LIVE ORG STATS ══════
Employees: ${totalEmployees} | Assessments: ${totalAssessments} | Learning Plans: ${totalPlans}
Departments: ${deptDist.map(d => `${d._id || 'Unassigned'} (${d.count})`).join(', ')}
Roles: ${roleDist.map(r => `${r._id || 'Unset'} (${r.count})`).join(', ')}
Skills tracked: ${skillDistribution.map(s => `${s.skill}: avg ${s.avg}%, ${s.employees} people`).join(' | ')}

══════ INSTRUCTIONS ══════
1. Use the provided tools to query live data. NEVER fabricate names, scores, or emails.
2. When user mentions broad areas like "backend", "cloud", "devops", "frontend", "data", etc., ALWAYS expand them to specific granular skills using the SKILL CATEGORIES above. For example "backend" → Node.js, Express.js, PostgreSQL, MongoDB, REST APIs, etc. Pass these expanded skills to the tools.
3. For "top performers" — call search_employees with sortBy="score" and the relevant expanded skills.
4. For "team planning" — analyze the project, determine ALL required granular skills across domains, then call find_project_team with those specific skills. For a cloud infra project, include: AWS, Terraform, Docker, Kubernetes, CI/CD, Node.js, Python, Networking, etc.
5. When the admin says an employee is unavailable, acknowledge it and call find_project_team again with excludeNames.
6. Always cite real data from tool results. Include name, department, role, experience, and key scores.
7. For team composition:
   - The person with the MOST experience (10+ years) + highest leadership/management scores should be Team Lead
   - Assign specific responsibilities based on each person's STRONGEST skills (e.g., "Backend Lead" for highest Node.js/Express scorer, "Cloud Architect" for highest AWS/Terraform scorer)
   - Explain WHY each person is suited for their assigned role citing their specific skill scores and experience
8. Format responses cleanly. Use plain numbered lists and dashes. Keep it structured but conversational.
9. If asked about org weaknesses, call get_org_analytics with focusArea "gaps" or "skills".
10. NEVER expose raw database IDs, passwords, tokens, or internal system details.
11. You can make multiple tool calls in parallel when appropriate.
12. When comparing candidates or rebuilding teams after exclusions, always explain the tradeoffs.
13. For underperformers, lowest scorers, weakest employees, needs-training, or bottom-N queries, ALWAYS use sortOrder="asc" to get the LOWEST scores first. For top performers, best, highest — use sortOrder="desc" (default).`;
}

// ═══════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS (OpenAI function calling)
// ═══════════════════════════════════════════════════════════════════

const tools = [
  {
    type: 'function',
    function: {
      name: 'search_employees',
      description: 'Search employees by skills, department, role, name, or experience. Returns ranked candidates with scores. Use for finding top performers, matching candidates to projects, or building teams. IMPORTANT: When user asks for broad categories like "backend", "cloud", "devops", always pass the expanded granular skills (e.g. for backend: ["Node.js", "Express.js", "PostgreSQL", "MongoDB", "REST APIs"]).',
      parameters: {
        type: 'object',
        properties: {
          skills: { type: 'array', items: { type: 'string' }, description: 'Specific granular skills to search for (e.g. ["Node.js", "Express.js", "PostgreSQL", "MongoDB"] NOT ["Backend"])' },
          department: { type: 'string', description: 'Filter by department name' },
          roleName: { type: 'string', description: 'Filter by job role/title (partial match)' },
          nameSearch: { type: 'string', description: 'Search by employee name (partial match)' },
          minExperience: { type: 'number', description: 'Minimum years of experience' },
          minScore: { type: 'number', description: 'Minimum average skill score (0-100)' },
          sortBy: { type: 'string', enum: ['score', 'experience', 'name'], description: 'Sort results by' },
          sortOrder: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order. Use "asc" for finding underperformers / lowest scorers / weakest employees / needs-training. Use "desc" (default) for top performers / best / highest.' },
          limit: { type: 'number', description: 'Max results (default 10, max 25)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_employee_details',
      description: 'Get detailed profile, all assessment scores, and learning plan for a specific employee by name or email.',
      parameters: {
        type: 'object',
        properties: {
          nameOrEmail: { type: 'string', description: 'Employee name or email to look up' }
        },
        required: ['nameOrEmail']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_org_analytics',
      description: 'Get organization-wide analytics: skill distribution, department breakdown, weakest/strongest areas, top performers per skill.',
      parameters: {
        type: 'object',
        properties: {
          focusArea: { type: 'string', enum: ['skills', 'departments', 'top_performers', 'gaps', 'overview'], description: 'What aspect to analyze' },
          skill: { type: 'string', description: 'Specific skill to focus on (for top_performers or gaps)' },
          department: { type: 'string', description: 'Specific department to focus on' }
        },
        required: ['focusArea']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'find_project_team',
      description: 'Given required skills, find the best team composition with role assignments based on experience and strengths. Returns recommended team members with their specific roles (Team Lead, Backend Lead, Cloud Specialist, etc). Supports excluding specific people.',
      parameters: {
        type: 'object',
        properties: {
          projectDescription: { type: 'string', description: 'Description of the project' },
          requiredSkills: { type: 'array', items: { type: 'string' }, description: 'Granular skills needed (e.g. ["Node.js", "AWS", "Docker", "Kubernetes", "PostgreSQL"] NOT ["Backend", "Cloud"])' },
          teamSize: { type: 'number', description: 'Desired team size (default 5)' },
          needsLead: { type: 'boolean', description: 'Whether to find a team lead (default true)' },
          excludeNames: { type: 'array', items: { type: 'string' }, description: 'Names of employees to exclude (already assigned elsewhere)' }
        },
        required: ['requiredSkills']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'compare_employees',
      description: 'Compare two or more employees side by side on their skills, experience, and assessment scores.',
      parameters: {
        type: 'object',
        properties: {
          names: { type: 'array', items: { type: 'string' }, description: 'Names of employees to compare', minItems: 2 }
        },
        required: ['names']
      }
    }
  }
];

// ═══════════════════════════════════════════════════════════════════
// TOOL IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════

async function executeToolCall(name, args) {
  switch (name) {
    case 'search_employees': return await toolSearchEmployees(args);
    case 'get_employee_details': return await toolGetEmployeeDetails(args);
    case 'get_org_analytics': return await toolGetOrgAnalytics(args);
    case 'find_project_team': return await toolFindProjectTeam(args);
    case 'compare_employees': return await toolCompareEmployees(args);
    default: return { error: 'Unknown tool' };
  }
}

async function toolSearchEmployees({ skills = [], department, roleName, nameSearch, minExperience, minScore, sortBy = 'score', sortOrder = 'desc', limit = 10 }) {
  limit = sanitizeNumber(limit, 1, 25);

  // Expand broad category terms into granular skills
  const expandedSkills = skills.length > 0 ? expandSkills(skills.map(s => sanitizeStringParam(s, 80))) : [];

  const userFilter = { role: 'employee' };
  if (department) userFilter['profile.department'] = { $regex: sanitizeStringParam(department), $options: 'i' };
  if (roleName) userFilter['profile.currentRole'] = { $regex: sanitizeStringParam(roleName), $options: 'i' };
  if (nameSearch) userFilter.name = { $regex: sanitizeStringParam(nameSearch), $options: 'i' };
  if (minExperience) userFilter['profile.yearsOfExperience'] = { $gte: sanitizeNumber(minExperience, 0, 50) };

  if (expandedSkills.length > 0) {
    let candidateUserIds = null;
    if (Object.keys(userFilter).length > 1) {
      const filteredUsers = await User.find(userFilter).select('_id').lean();
      candidateUserIds = filteredUsers.map(u => u._id);
    }

    const matchStage = { 'scores.skill': { $in: expandedSkills } };
    if (candidateUserIds) matchStage.userId = { $in: candidateUserIds };

    const pipeline = [
      { $unwind: '$scores' },
      { $match: matchStage },
      { $group: { _id: { userId: '$userId', skill: '$scores.skill' }, bestScore: { $max: '$scores.score' } } },
      { $group: {
          _id: '$_id.userId',
          skills: { $push: { skill: '$_id.skill', score: '$bestScore' } },
          avgScore: { $avg: '$bestScore' },
          matchedCount: { $sum: 1 }
        }
      },
      { $sort: sortBy === 'score' ? { avgScore: sortOrder === 'asc' ? 1 : -1 } : { matchedCount: sortOrder === 'asc' ? 1 : -1, avgScore: sortOrder === 'asc' ? 1 : -1 } },
      { $limit: limit }
    ];

    if (minScore) pipeline.splice(3, 0, { $match: { avgScore: { $gte: sanitizeNumber(minScore) } } });

    const results = await Assessment.aggregate(pipeline);
    const userIds = results.map(r => r._id);
    const users = await User.find({ _id: { $in: userIds } }).select('name email profile').lean();
    const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

    return results.map((r, i) => {
      const u = userMap[r._id.toString()];
      if (!u) return null;
      return {
        rank: i + 1, name: u.name, email: u.email,
        role: u.profile?.currentRole || 'N/A',
        department: u.profile?.department || 'N/A',
        experience: u.profile?.yearsOfExperience || 0,
        skills: r.skills.sort((a, b) => b.score - a.score),
        avgScore: Math.round(r.avgScore * 10) / 10,
        matchedSkills: r.matchedCount,
        totalRequired: expandedSkills.length
      };
    }).filter(Boolean);
  }

  const dir = sortOrder === 'asc' ? 1 : -1;
  const sort = sortBy === 'experience' ? { 'profile.yearsOfExperience': dir } : sortBy === 'score' ? { name: dir } : { name: dir };
  const users = await User.find(userFilter).select('name email profile').sort(sort).limit(limit).lean();

  const userIds = users.map(u => u._id);
  const scoreAgg = await Assessment.aggregate([
    { $match: { userId: { $in: userIds } } },
    { $unwind: '$scores' },
    { $group: { _id: { userId: '$userId', skill: '$scores.skill' }, best: { $max: '$scores.score' } } },
    { $group: { _id: '$_id.userId', skills: { $push: { skill: '$_id.skill', score: '$best' } }, avg: { $avg: '$best' } } }
  ]);
  const scoreMap = Object.fromEntries(scoreAgg.map(s => [s._id.toString(), s]));

  return users.map((u, i) => {
    const s = scoreMap[u._id.toString()];
    return {
      rank: i + 1, name: u.name, email: u.email,
      role: u.profile?.currentRole || 'N/A',
      department: u.profile?.department || 'N/A',
      experience: u.profile?.yearsOfExperience || 0,
      skills: s?.skills?.sort((a, b) => b.score - a.score)?.slice(0, 10) || [],
      avgScore: s ? Math.round(s.avg * 10) / 10 : 0
    };
  });
}

async function toolGetEmployeeDetails({ nameOrEmail }) {
  const search = sanitizeStringParam(nameOrEmail, 100);
  const query = search.includes('@')
    ? { email: search.toLowerCase() }
    : { name: { $regex: search, $options: 'i' } };

  const user = await User.findOne({ ...query, role: 'employee' }).select('-password').lean();
  if (!user) return { error: `Employee "${search}" not found.` };

  const [assessments, plans] = await Promise.all([
    Assessment.find({ userId: user._id }).sort({ completedAt: -1 }).lean(),
    LearningPlan.find({ userId: user._id }).sort({ createdAt: -1 }).lean()
  ]);

  const skillMap = {};
  assessments.forEach(a => {
    a.scores.forEach(s => {
      if (!skillMap[s.skill] || skillMap[s.skill].date < a.completedAt) {
        skillMap[s.skill] = { score: s.score, date: a.completedAt };
      }
    });
  });

  return {
    name: user.name, email: user.email,
    role: user.profile?.currentRole || 'N/A',
    department: user.profile?.department || 'N/A',
    experience: user.profile?.yearsOfExperience || 0,
    desiredRole: user.profile?.desiredRole || 'N/A',
    techStack: user.profile?.techStack || [],
    bio: user.profile?.bio || '',
    joinedAt: user.createdAt,
    totalAssessments: assessments.length,
    latestSkills: Object.entries(skillMap).map(([skill, d]) => ({ skill, score: d.score })).sort((a, b) => b.score - a.score),
    assessmentHistory: assessments.slice(0, 5).map(a => ({
      category: a.category, source: a.source, overallScore: a.overallScore,
      date: a.completedAt, skills: a.scores
    })),
    learningPlans: plans.map(p => ({
      targetRole: p.targetRole, progress: p.progress,
      gaps: p.gaps, recommendationCount: p.recommendations.length
    }))
  };
}

async function toolGetOrgAnalytics({ focusArea, skill, department }) {
  switch (focusArea) {
    case 'overview': {
      const [empCount, assessCount, planCount] = await Promise.all([
        User.countDocuments({ role: 'employee' }),
        Assessment.countDocuments(),
        LearningPlan.countDocuments()
      ]);
      const depts = await User.aggregate([
        { $match: { role: 'employee' } },
        { $group: { _id: '$profile.department', count: { $sum: 1 }, avgExp: { $avg: '$profile.yearsOfExperience' } } },
        { $sort: { count: -1 } }
      ]);
      return { totalEmployees: empCount, totalAssessments: assessCount, totalLearningPlans: planCount, departments: depts.map(d => ({ name: d._id || 'Unassigned', count: d.count, avgExperience: Math.round(d.avgExp * 10) / 10 })) };
    }
    case 'skills': {
      const dist = await Assessment.aggregate([
        { $unwind: '$scores' },
        { $group: { _id: '$scores.skill', avg: { $avg: '$scores.score' }, min: { $min: '$scores.score' }, max: { $max: '$scores.score' }, users: { $addToSet: '$userId' } } },
        { $project: { skill: '$_id', avg: { $round: ['$avg', 1] }, min: 1, max: 1, employees: { $size: '$users' }, _id: 0 } },
        { $sort: { avg: -1 } }
      ]);
      return { skillDistribution: dist, strongestSkills: dist.slice(0, 5), weakestSkills: dist.slice(-5).reverse() };
    }
    case 'top_performers': {
      const matchStage = {};
      if (skill) {
        // Expand category if needed
        const expanded = expandSkills([sanitizeStringParam(skill, 80)]);
        matchStage['scores.skill'] = expanded.length > 1 ? { $in: expanded } : expanded[0];
      }

      const pipeline = [
        { $unwind: '$scores' },
        ...(Object.keys(matchStage).length ? [{ $match: matchStage }] : []),
        { $group: { _id: { userId: '$userId', skill: '$scores.skill' }, best: { $max: '$scores.score' } } },
        { $group: { _id: '$_id.userId', skills: { $push: { skill: '$_id.skill', score: '$best' } }, avg: { $avg: '$best' }, skillCount: { $sum: 1 } } },
        { $sort: { avg: -1 } },
        { $limit: 15 }
      ];

      const results = await Assessment.aggregate(pipeline);
      const userIds = results.map(r => r._id);
      let userQuery = { _id: { $in: userIds } };
      if (department) userQuery['profile.department'] = { $regex: sanitizeStringParam(department), $options: 'i' };
      const users = await User.find(userQuery).select('name email profile').lean();
      const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

      return results.map((r, i) => {
        const u = userMap[r._id.toString()];
        if (!u) return null;
        return { rank: i + 1, name: u.name, role: u.profile?.currentRole, department: u.profile?.department, experience: u.profile?.yearsOfExperience, avgScore: Math.round(r.avg * 10) / 10, topSkills: r.skills.sort((a, b) => b.score - a.score).slice(0, 8) };
      }).filter(Boolean);
    }
    case 'gaps': {
      const gaps = await LearningPlan.aggregate([
        { $unwind: '$gaps' },
        { $match: { 'gaps.currentLevel': { $lt: 70 } } },
        { $group: { _id: '$gaps.skill', avgCurrent: { $avg: '$gaps.currentLevel' }, avgRequired: { $avg: '$gaps.requiredLevel' }, employeeCount: { $sum: 1 } } },
        { $project: { skill: '$_id', avgCurrent: { $round: ['$avgCurrent', 1] }, avgRequired: { $round: ['$avgRequired', 1] }, gap: { $round: [{ $subtract: ['$avgRequired', '$avgCurrent'] }, 1] }, employees: '$employeeCount', _id: 0 } },
        { $sort: { gap: -1 } }
      ]);
      return { skillGaps: gaps };
    }
    case 'departments': {
      let deptFilter = {};
      if (department) deptFilter['profile.department'] = { $regex: sanitizeStringParam(department), $options: 'i' };

      const depts = await User.aggregate([
        { $match: { role: 'employee', ...deptFilter } },
        { $group: { _id: '$profile.department', count: { $sum: 1 }, avgExp: { $avg: '$profile.yearsOfExperience' }, roles: { $addToSet: '$profile.currentRole' } } },
        { $sort: { count: -1 } }
      ]);

      for (const dept of depts) {
        const deptUsers = await User.find({ role: 'employee', 'profile.department': dept._id }).select('_id').lean();
        const deptUserIds = deptUsers.map(u => u._id);
        const skills = await Assessment.aggregate([
          { $match: { userId: { $in: deptUserIds } } },
          { $unwind: '$scores' },
          { $group: { _id: '$scores.skill', avg: { $avg: '$scores.score' } } },
          { $sort: { avg: -1 } },
          { $limit: 8 }
        ]);
        dept.topSkills = skills.map(s => ({ skill: s._id, avg: Math.round(s.avg * 10) / 10 }));
      }

      return { departments: depts.map(d => ({ name: d._id || 'Unassigned', headcount: d.count, avgExperience: Math.round(d.avgExp * 10) / 10, roles: d.roles.slice(0, 8), topSkills: d.topSkills })) };
    }
    default:
      return { error: 'Invalid focusArea' };
  }
}

async function toolFindProjectTeam({ requiredSkills, teamSize = 5, needsLead = true, excludeNames = [] }) {
  teamSize = sanitizeNumber(teamSize, 2, 15);

  // Expand broad categories into granular skills
  const cleanSkills = expandSkills(requiredSkills.map(s => sanitizeStringParam(s, 80)));
  const cleanExcludes = excludeNames.map(n => sanitizeStringParam(n, 100));

  let excludeIds = [];
  if (cleanExcludes.length > 0) {
    const excluded = await User.find({
      name: { $in: cleanExcludes.map(n => new RegExp(n, 'i')) },
      role: 'employee'
    }).select('_id name').lean();
    excludeIds = excluded.map(u => u._id);
  }

  const matchStage = { 'scores.skill': { $in: cleanSkills } };
  if (excludeIds.length > 0) matchStage.userId = { $nin: excludeIds };

  const pipeline = [
    { $unwind: '$scores' },
    { $match: matchStage },
    { $group: { _id: { userId: '$userId', skill: '$scores.skill' }, best: { $max: '$scores.score' } } },
    { $group: {
        _id: '$_id.userId',
        skills: { $push: { skill: '$_id.skill', score: '$best' } },
        avgScore: { $avg: '$best' },
        matchedCount: { $sum: 1 }
      }
    },
    { $sort: { matchedCount: -1, avgScore: -1 } },
    { $limit: teamSize * 4 }
  ];

  const results = await Assessment.aggregate(pipeline);
  const userIds = results.map(r => r._id);
  const users = await User.find({ _id: { $in: userIds } }).select('name email profile').lean();
  const userMap = Object.fromEntries(users.map(u => [u._id.toString(), u]));

  const candidates = results.map(r => {
    const u = userMap[r._id.toString()];
    if (!u) return null;
    return {
      userId: r._id.toString(), name: u.name, email: u.email,
      role: u.profile?.currentRole || 'N/A',
      department: u.profile?.department || 'N/A',
      experience: u.profile?.yearsOfExperience || 0,
      skills: r.skills.sort((a, b) => b.score - a.score),
      avgScore: Math.round(r.avgScore * 10) / 10,
      matchedCount: r.matchedCount
    };
  }).filter(Boolean);

  const team = [];
  const coveredSkills = new Set();
  const used = new Set();

  // ── Pick Team Lead: highest experience + leadership aptitude ──
  if (needsLead && candidates.length > 0) {
    const leadershipSkills = ['Leadership', 'People Management', 'Project Management', 'Communication', 'Mentoring', 'Stakeholder Management', 'Agile'];
    const leadCandidates = candidates
      .map(c => {
        const leadershipScore = c.skills
          .filter(s => leadershipSkills.includes(s.skill))
          .reduce((sum, s) => sum + s.score, 0);
        // Heavily weight experience for lead selection
        return { ...c, leadScore: leadershipScore * 0.3 + c.experience * 5 + c.avgScore * 0.2 + c.matchedCount * 2 };
      })
      .sort((a, b) => b.leadScore - a.leadScore);

    if (leadCandidates.length > 0) {
      const lead = leadCandidates[0];
      team.push({ ...lead, teamRole: 'Team Lead', roleReason: `${lead.experience} years experience, strong cross-domain skills (${lead.matchedCount} matched)` });
      used.add(lead.userId);
      lead.skills.forEach(s => coveredSkills.add(s.skill));
    }
  }

  // ── Fill remaining spots with skill-coverage greedy algorithm ──
  // Group required skills into domains for role assignment
  const skillDomains = {
    'Backend Lead': ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST APIs', 'GraphQL', 'Microservices', 'Redis', 'SQL', 'gRPC', 'Kafka', 'RabbitMQ', 'Python'],
    'Cloud/DevOps Engineer': ['AWS', 'Azure', 'GCP', 'Terraform', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'GitHub Actions', 'Ansible', 'Helm', 'Infrastructure as Code', 'Serverless'],
    'Frontend Lead': ['JavaScript', 'React', 'TypeScript', 'Next.js', 'CSS', 'HTML', 'Tailwind CSS', 'Redux', 'Web Performance'],
    'Data/ML Engineer': ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Data Processing', 'MLOps', 'Pandas', 'SQL', 'Statistics'],
    'Security Specialist': ['Security', 'OWASP', 'Penetration Testing', 'Cloud Security', 'Compliance', 'Networking', 'Incident Response'],
    'QA/Testing Lead': ['Testing', 'Selenium', 'Cypress', 'Jest', 'Performance Testing', 'Test Planning', 'Security Testing'],
    'Infrastructure Engineer': ['Networking', 'Linux', 'Monitoring', 'Prometheus', 'Grafana', 'DNS', 'Load Balancing', 'Bash'],
    'Mobile Developer': ['React Native', 'iOS', 'Android', 'Swift', 'Kotlin', 'Firebase']
  };

  while (team.length < teamSize && candidates.length > 0) {
    let bestCandidate = null;
    let bestNewSkills = -1;

    for (const c of candidates) {
      if (used.has(c.userId)) continue;
      const newSkills = c.skills.filter(s => !coveredSkills.has(s.skill) && cleanSkills.includes(s.skill)).length;
      if (newSkills > bestNewSkills || (newSkills === bestNewSkills && c.avgScore > (bestCandidate?.avgScore || 0))) {
        bestCandidate = c;
        bestNewSkills = newSkills;
      }
    }

    if (!bestCandidate) {
      const remaining = candidates.filter(c => !used.has(c.userId));
      if (remaining.length === 0) break;
      bestCandidate = remaining[0];
    }

    // Determine the best domain role for this candidate
    let assignedRole = null;
    let bestDomainScore = -1;
    for (const [domain, domainSkills] of Object.entries(skillDomains)) {
      const domainScore = bestCandidate.skills
        .filter(s => domainSkills.includes(s.skill))
        .reduce((sum, s) => sum + s.score, 0);
      if (domainScore > bestDomainScore) {
        bestDomainScore = domainScore;
        assignedRole = domain;
      }
    }

    // Fallback: use strongest skill
    if (!assignedRole || bestDomainScore === 0) {
      assignedRole = `${bestCandidate.skills[0]?.skill || 'General'} Specialist`;
    }

    // Build reason
    const topSkillNames = bestCandidate.skills.slice(0, 3).map(s => `${s.skill}: ${s.score}%`).join(', ');
    const reason = `${bestCandidate.experience}yr exp, top skills: ${topSkillNames}`;

    team.push({ ...bestCandidate, teamRole: assignedRole, roleReason: reason });
    used.add(bestCandidate.userId);
    bestCandidate.skills.forEach(s => coveredSkills.add(s.skill));
  }

  const uncovered = cleanSkills.filter(s => !coveredSkills.has(s));

  return {
    team: team.map(({ userId, leadScore, ...rest }) => rest),
    teamSize: team.length,
    requiredSkillsExpanded: cleanSkills,
    skillsCovered: [...coveredSkills].filter(s => cleanSkills.includes(s)),
    skillsUncovered: uncovered,
    coveragePercent: Math.round(((cleanSkills.length - uncovered.length) / cleanSkills.length) * 100)
  };
}

async function toolCompareEmployees({ names }) {
  const cleanNames = names.map(n => sanitizeStringParam(n, 100));
  const results = [];

  for (const name of cleanNames) {
    const user = await User.findOne({ name: { $regex: name, $options: 'i' }, role: 'employee' }).select('-password').lean();
    if (!user) { results.push({ name, error: 'Not found' }); continue; }

    const assessments = await Assessment.find({ userId: user._id }).sort({ completedAt: -1 }).lean();
    const skillMap = {};
    assessments.forEach(a => {
      a.scores.forEach(s => {
        if (!skillMap[s.skill] || skillMap[s.skill].date < a.completedAt) {
          skillMap[s.skill] = { score: s.score, date: a.completedAt };
        }
      });
    });

    results.push({
      name: user.name,
      role: user.profile?.currentRole || 'N/A',
      department: user.profile?.department || 'N/A',
      experience: user.profile?.yearsOfExperience || 0,
      totalAssessments: assessments.length,
      skills: Object.entries(skillMap).map(([skill, d]) => ({ skill, score: d.score })).sort((a, b) => b.score - a.score),
      avgScore: Object.values(skillMap).length > 0 ? Math.round(Object.values(skillMap).reduce((a, d) => a + d.score, 0) / Object.values(skillMap).length * 10) / 10 : 0
    });
  }

  return { employees: results };
}

// ═══════════════════════════════════════════════════════════════════
// GENERATE CHAT TITLE (using AI)
// ═══════════════════════════════════════════════════════════════════

async function generateChatTitle(userMessage) {
  try {
    const titleCompletion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Generate a concise 3-6 word title for this chat conversation. Return ONLY the title text, no quotes, no punctuation at the end. Examples: "Cloud Infra Team Planning", "Top React Developers", "DevOps Skill Gap Analysis", "Backend Team Comparison".' },
        { role: 'user', content: userMessage }
      ],
      max_tokens: 20,
      temperature: 0.3,
    });
    const title = titleCompletion.choices[0]?.message?.content?.trim();
    return title && title.length > 2 ? title.substring(0, 100) : userMessage.substring(0, 80);
  } catch {
    // Fallback: extract keywords
    return userMessage.substring(0, 80);
  }
}

// ═══════════════════════════════════════════════════════════════════
// MAIN CHAT ENDPOINT
// ═══════════════════════════════════════════════════════════════════

// @desc    AI Chatbot with function-calling, guardrails, and persistent history
// @route   POST /api/mobility/chat
exports.chatWithAgent = async (req, res, next) => {
  try {
    const { message, chatId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    const cleanMessage = sanitizeInput(message);
    if (!cleanMessage) {
      return res.status(400).json({ success: false, message: 'Invalid message content' });
    }

    // Load or create chat history
    let chat;
    if (chatId) {
      chat = await ChatHistory.findOne({ _id: chatId, userId: req.user.id });
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat session not found' });
      }
    } else {
      chat = new ChatHistory({ userId: req.user.id, messages: [] });
    }

    // Enforce max conversation length
    if (chat.messages.length >= MAX_CONVERSATION_MESSAGES) {
      const first = chat.messages.slice(0, 2);
      const recent = chat.messages.slice(-20);
      chat.messages = [...first, ...recent];
    }

    // Add user message
    chat.messages.push({ role: 'user', content: cleanMessage });

    // Build system prompt
    const systemPrompt = await buildSystemPrompt();

    // Build OpenAI messages from history
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...chat.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    // Run with tool calling loop
    let toolsUsed = [];
    let candidatesFromTools = [];
    let completion;
    let rounds = 0;

    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++;
      completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        tools,
        tool_choice: 'auto',
        max_tokens: 2000,
        temperature: 0.4,
      });

      const choice = completion.choices[0];

      if (choice.finish_reason === 'tool_calls' || choice.message.tool_calls?.length > 0) {
        openaiMessages.push(choice.message);

        for (const toolCall of choice.message.tool_calls) {
          const fnName = toolCall.function.name;
          let fnArgs;
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            fnArgs = {};
          }

          toolsUsed.push(fnName);
          const result = await executeToolCall(fnName, fnArgs);

          // Collect candidates
          if (fnName === 'search_employees' || fnName === 'find_project_team') {
            const items = result.team || result;
            if (Array.isArray(items)) {
              candidatesFromTools.push(...items.map(c => ({
                name: c.name, email: c.email,
                role: c.role || c.teamRole,
                department: c.department,
                experience: c.experience,
                skills: (c.skills || []).slice(0, 8),
                avgScore: c.avgScore,
                teamRole: c.teamRole || undefined
              })));
            }
          }

          openaiMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result).substring(0, 10000)
          });
        }
      } else {
        break;
      }
    }

    const aiResponse = completion.choices[0].message.content || 'I processed your request but have no additional text to share.';

    // Deduplicate candidates
    const seen = new Set();
    const uniqueCandidates = candidatesFromTools.filter(c => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    }).slice(0, 15);

    // Save assistant message
    chat.messages.push({
      role: 'assistant',
      content: aiResponse,
      candidates: uniqueCandidates,
      meta: {
        model: 'gpt-4o-mini',
        tokens: completion.usage?.total_tokens || 0,
        toolsUsed: [...new Set(toolsUsed)]
      }
    });

    // Generate smart title for new chats
    if (chat.messages.filter(m => m.role === 'user').length === 1) {
      const smartTitle = await generateChatTitle(cleanMessage);
      chat.title = smartTitle;
    }

    await chat.save();

    res.json({
      success: true,
      chatId: chat._id,
      title: chat.title,
      response: aiResponse,
      candidates: uniqueCandidates,
      meta: {
        model: 'gpt-4o-mini',
        tokens: completion.usage?.total_tokens || 0,
        toolsUsed: [...new Set(toolsUsed)]
      }
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error.code === 'insufficient_quota' || error.status === 429) {
      return res.status(429).json({ success: false, message: 'API rate limit reached. Please try again in a moment.' });
    }
    if (error.code === 'invalid_api_key') {
      return res.status(500).json({ success: false, message: 'AI service configuration error.' });
    }

    next(error);
  }
};

// ═══════════════════════════════════════════════════════════════════
// STREAMING CHAT WITH SSE (typing effect)
// ═══════════════════════════════════════════════════════════════════

exports.chatWithAgentStream = async (req, res, next) => {
  try {
    const { message, chatId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Please provide a message' });
    }

    const cleanMessage = sanitizeInput(message);
    if (!cleanMessage) {
      return res.status(400).json({ success: false, message: 'Invalid message content' });
    }

    // Load or create chat history
    let chat;
    if (chatId) {
      chat = await ChatHistory.findOne({ _id: chatId, userId: req.user.id });
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat session not found' });
      }
    } else {
      chat = new ChatHistory({ userId: req.user.id, messages: [] });
    }

    // Enforce max conversation length
    if (chat.messages.length >= MAX_CONVERSATION_MESSAGES) {
      const first = chat.messages.slice(0, 2);
      const recent = chat.messages.slice(-20);
      chat.messages = [...first, ...recent];
    }

    // Add user message
    chat.messages.push({ role: 'user', content: cleanMessage });

    // Setup SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Build system prompt
    const systemPrompt = await buildSystemPrompt();

    // Build OpenAI messages from history
    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...chat.messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }))
    ];

    // Run with tool calling loop
    let toolsUsed = [];
    let candidatesFromTools = [];
    let completion;
    let rounds = 0;
    let fullResponse = '';

    while (rounds < MAX_TOOL_ROUNDS) {
      rounds++;
      
      const stream = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: openaiMessages,
        tools,
        tool_choice: 'auto',
        max_tokens: 2000,
        temperature: 0.4,
        stream: true
      });

      let currentMessage = { role: 'assistant', content: '', tool_calls: [] };
      let currentToolCall = null;

      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          currentMessage.content += delta.content;
          fullResponse += delta.content;
          // Send character by character (or small chunks)
          sendEvent('token', { content: delta.content });
        }

        if (delta?.tool_calls) {
          for (const toolCallDelta of delta?.tool_calls) {
            const index = toolCallDelta.index;
            
            if (!currentMessage.tool_calls[index]) {
              currentMessage.tool_calls[index] = {
                id: '',
                type: 'function',
                function: { name: '', arguments: '' }
              };
            }

            if (toolCallDelta.id) {
              currentMessage.tool_calls[index].id = toolCallDelta.id;
            }

            if (toolCallDelta.function?.name) {
              currentMessage.tool_calls[index].function.name = toolCallDelta.function.name;
            }

            if (toolCallDelta.function?.arguments) {
              currentMessage.tool_calls[index].function.arguments += toolCallDelta.function.arguments;
            }
          }
        }
      }

      // Handle tool calls if present
      if (currentMessage.tool_calls && currentMessage.tool_calls.length > 0) {
        openaiMessages.push(currentMessage);

        for (const toolCall of currentMessage.tool_calls) {
          if (!toolCall.function.name) continue;

          const fnName = toolCall.function.name;
          let fnArgs;
          try {
            fnArgs = JSON.parse(toolCall.function.arguments);
          } catch {
            fnArgs = {};
          }

          toolsUsed.push(fnName);
          sendEvent('tool', { name: fnName, args: fnArgs });

          const result = await executeToolCall(fnName, fnArgs);

          // Collect candidates
          if (fnName === 'search_employees' || fnName === 'find_project_team') {
            const items = result.team || result;
            if (Array.isArray(items)) {
              candidatesFromTools.push(...items.map(c => ({
                name: c.name, email: c.email,
                role: c.role || c.teamRole,
                department: c.department,
                experience: c.experience,
                skills: (c.skills || []).slice(0, 8),
                avgScore: c.avgScore,
                teamRole: c.teamRole || undefined
              })));
            }
          }

          openaiMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result).substring(0, 10000)
          });
        }
      } else {
        // No more tool calls, we're done
        break;
      }
    }

    // Deduplicate candidates
    const seen = new Set();
    const uniqueCandidates = candidatesFromTools.filter(c => {
      if (seen.has(c.name)) return false;
      seen.add(c.name);
      return true;
    }).slice(0, 15);

    // Send candidates
    if (uniqueCandidates.length > 0) {
      sendEvent('candidates', { candidates: uniqueCandidates });
    }

    // Save assistant message
    chat.messages.push({
      role: 'assistant',
      content: fullResponse,
      candidates: uniqueCandidates,
      meta: {
        model: 'gpt-4o-mini',
        toolsUsed: [...new Set(toolsUsed)]
      }
    });

    // Generate smart title for new chats
    if (chat.messages.filter(m => m.role === 'user').length === 1) {
      const smartTitle = await generateChatTitle(cleanMessage);
      chat.title = smartTitle;
    }

    await chat.save();

    // Send completion event with metadata
    sendEvent('done', {
      chatId: chat._id,
      title: chat.title,
      meta: {
        model: 'gpt-4o-mini',
        toolsUsed: [...new Set(toolsUsed)]
      }
    });

    res.end();
  } catch (error) {
    console.error('Stream chat error:', error);
    
    try {
      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ message: 'An error occurred during processing' })}\n\n`);
      res.end();
    } catch {
      // Connection already closed
    }
  }
};

// ═══════════════════════════════════════════════════════════════════
// CHAT HISTORY ENDPOINTS
// ═══════════════════════════════════════════════════════════════════

exports.getChatSessions = async (req, res, next) => {
  try {
    const chats = await ChatHistory.find({ userId: req.user.id })
      .select('title messageCount createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, chats });
  } catch (error) {
    next(error);
  }
};

exports.getChatById = async (req, res, next) => {
  try {
    const chat = await ChatHistory.findOne({ _id: req.params.id, userId: req.user.id }).lean();
    if (!chat) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.json({ success: true, chat });
  } catch (error) {
    next(error);
  }
};

exports.deleteChatSession = async (req, res, next) => {
  try {
    const result = await ChatHistory.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!result) return res.status(404).json({ success: false, message: 'Chat not found' });
    res.json({ success: true, message: 'Chat deleted' });
  } catch (error) {
    next(error);
  }
};

// Backward compat
exports.superAgentQuery = async (req, res, next) => {
  try {
    const { query, limit = 5 } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'Please provide a query' });
    const result = await toolSearchEmployees({ skills: [], nameSearch: '', limit: sanitizeNumber(limit, 1, 25) });
    res.json({ success: true, query, count: result.length, candidates: result.slice(0, limit) });
  } catch (error) {
    next(error);
  }
};
