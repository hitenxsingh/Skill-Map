/**
 * Seed Script — Generates 520+ realistic employees with granular, real-world
 * skills (React, Node.js, AWS, Docker, PostgreSQL, etc.), proper experience
 * distributions, assessments across multiple categories, and learning plans.
 *
 * Usage:  node scripts/seed.js
 */

const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Assessment = require('../models/Assessment');
const LearningPlan = require('../models/LearningPlan');
const ChatHistory = require('../models/ChatHistory');
const connectDB = require('../config/db');

// ─── Realistic data pools ────────────────────────────────────────────────────

const firstNames = [
  'Aarav','Aditi','Akash','Ananya','Arjun','Bhavna','Chetan','Deepa','Dhruv','Esha',
  'Farhan','Gauri','Harsh','Isha','Jayesh','Kavya','Lakshmi','Manish','Neha','Om',
  'Priya','Rahul','Sakshi','Tanvi','Uday','Varun','Yash','Zara','Aditya','Shreya',
  'Rohan','Meera','Karan','Pooja','Vikram','Sanya','Nikhil','Riya','Amit','Sneha',
  'Siddharth','Divya','Rajesh','Ankita','Suresh','Kriti','Dev','Pallavi','Gaurav','Simran',
  'James','Emma','Liam','Olivia','Noah','Ava','William','Sophia','Benjamin','Isabella',
  'Lucas','Mia','Henry','Charlotte','Alexander','Amelia','Daniel','Harper','Matthew','Evelyn',
  'Sebastian','Abigail','Jack','Emily','Owen','Elizabeth','Ethan','Sofia','Ryan','Avery',
  'Carlos','Maria','Miguel','Ana','Diego','Lucia','Pablo','Carmen','Alejandro','Elena',
  'Ahmed','Fatima','Hassan','Aisha','Omar','Noor','Ali','Sara','Khalid','Layla',
  'Wei','Lin','Jun','Mei','Tao','Xia','Chen','Ying','Feng','Hui',
  'Yuki','Sakura','Kenji','Hana','Ryu','Miko','Sho','Aoi','Kai','Rin',
  'Pierre','Claire','Jean','Marie','Louis','Sophie','Marc','Julie','Thomas','Camille'
];

const lastNames = [
  'Sharma','Patel','Singh','Kumar','Gupta','Verma','Joshi','Mehta','Shah','Reddy',
  'Chopra','Malhotra','Iyer','Nair','Rao','Das','Bose','Sen','Dutta','Kapoor',
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Rodriguez','Martinez',
  'Hernandez','Lopez','Gonzalez','Wilson','Anderson','Thomas','Taylor','Moore','Jackson','Martin',
  'Lee','Perez','Thompson','White','Harris','Sanchez','Clark','Ramirez','Lewis','Robinson',
  'Walker','Young','Allen','King','Wright','Scott','Torres','Nguyen','Hill','Flores',
  'Green','Adams','Nelson','Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts',
  'Chen','Wang','Li','Zhang','Liu','Yang','Huang','Wu','Zhou','Xu',
  'Tanaka','Watanabe','Yamamoto','Suzuki','Takahashi','Sato','Kim','Park','Choi','Jung',
  'Dubois','Moreau','Petit','Bernard','Robert','Richard','Durand','Leroy','Simon','Laurent'
];

const departments = [
  'Engineering', 'Product', 'Data Science', 'DevOps', 'QA',
  'Design', 'Mobile', 'Security', 'Infrastructure', 'Platform',
  'AI/ML', 'Frontend', 'Backend', 'Full Stack', 'Cloud'
];

const jobRoles = [
  'Junior Frontend Developer', 'Frontend Developer', 'Senior Frontend Developer',
  'Junior Backend Developer', 'Backend Developer', 'Senior Backend Developer',
  'Full Stack Developer', 'Senior Full Stack Developer',
  'Data Analyst', 'Senior Data Analyst', 'Data Scientist', 'Senior Data Scientist',
  'ML Engineer', 'Senior ML Engineer', 'AI Researcher',
  'DevOps Engineer', 'Senior DevOps Engineer', 'Site Reliability Engineer',
  'QA Engineer', 'Senior QA Engineer', 'QA Lead',
  'UI/UX Designer', 'Senior UI/UX Designer', 'Design Lead',
  'Mobile Developer', 'Senior Mobile Developer',
  'Security Engineer', 'Senior Security Engineer',
  'Cloud Architect', 'Solutions Architect',
  'Engineering Manager', 'Technical Lead', 'Principal Engineer',
  'Product Manager', 'Technical Program Manager',
  'Platform Engineer', 'Infrastructure Engineer'
];

const desiredRoles = [
  'Senior Frontend Developer', 'Senior Backend Developer', 'Full Stack Developer',
  'ML Engineer', 'DevOps Engineer', 'Data Analyst', 'Engineering Manager',
  'Cloud Architect', 'Solutions Architect', 'Principal Engineer',
  'Technical Lead', 'AI Researcher', 'Senior Data Scientist',
  'Site Reliability Engineer', 'Security Engineer'
];

// ─── GRANULAR real-world skills per role ──────────────────────────────────────
// Each role has PRIMARY skills (always assessed) and SECONDARY skills (randomly picked)

const skillsByRole = {
  'Junior Frontend Developer': {
    primary: ['JavaScript', 'React', 'HTML', 'CSS', 'Git'],
    secondary: ['TypeScript', 'Tailwind CSS', 'Figma', 'REST APIs', 'Responsive Design']
  },
  'Frontend Developer': {
    primary: ['JavaScript', 'React', 'TypeScript', 'CSS', 'HTML', 'Git'],
    secondary: ['Next.js', 'Tailwind CSS', 'Redux', 'Webpack', 'Jest', 'REST APIs', 'GraphQL', 'Figma', 'Responsive Design', 'Web Performance']
  },
  'Senior Frontend Developer': {
    primary: ['JavaScript', 'React', 'TypeScript', 'Next.js', 'System Design', 'Web Performance'],
    secondary: ['Redux', 'GraphQL', 'Webpack', 'Tailwind CSS', 'Testing', 'CI/CD', 'Mentoring', 'Architecture', 'Micro-Frontends', 'Accessibility']
  },
  'Junior Backend Developer': {
    primary: ['Node.js', 'JavaScript', 'SQL', 'Git', 'REST APIs'],
    secondary: ['Express.js', 'MongoDB', 'PostgreSQL', 'Python', 'Docker']
  },
  'Backend Developer': {
    primary: ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Docker'],
    secondary: ['Python', 'Redis', 'RabbitMQ', 'GraphQL', 'TypeScript', 'SQL', 'Jest', 'CI/CD', 'Microservices', 'AWS']
  },
  'Senior Backend Developer': {
    primary: ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'System Design', 'Microservices', 'Docker'],
    secondary: ['Python', 'Redis', 'Kafka', 'GraphQL', 'gRPC', 'AWS', 'Kubernetes', 'CI/CD', 'Testing', 'Architecture', 'Mentoring', 'Security']
  },
  'Full Stack Developer': {
    primary: ['JavaScript', 'React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs'],
    secondary: ['TypeScript', 'Next.js', 'PostgreSQL', 'Docker', 'Git', 'Tailwind CSS', 'Redis', 'AWS', 'GraphQL']
  },
  'Senior Full Stack Developer': {
    primary: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'System Design', 'Docker'],
    secondary: ['Next.js', 'Express.js', 'MongoDB', 'Redis', 'AWS', 'Kubernetes', 'GraphQL', 'CI/CD', 'Microservices', 'Architecture', 'Mentoring', 'Testing']
  },
  'Data Analyst': {
    primary: ['SQL', 'Python', 'Excel', 'Data Visualization', 'Statistics'],
    secondary: ['Tableau', 'Power BI', 'Pandas', 'R', 'Jupyter Notebooks', 'Business Intelligence']
  },
  'Senior Data Analyst': {
    primary: ['SQL', 'Python', 'Data Visualization', 'Statistics', 'Tableau', 'Business Intelligence'],
    secondary: ['Power BI', 'Pandas', 'R', 'Machine Learning', 'Data Modeling', 'ETL Pipelines', 'Stakeholder Management']
  },
  'Data Scientist': {
    primary: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'Pandas', 'Scikit-learn'],
    secondary: ['TensorFlow', 'Deep Learning', 'NLP', 'Data Visualization', 'Jupyter Notebooks', 'Feature Engineering', 'A/B Testing']
  },
  'Senior Data Scientist': {
    primary: ['Python', 'Machine Learning', 'Deep Learning', 'Statistics', 'TensorFlow', 'System Design'],
    secondary: ['PyTorch', 'NLP', 'Computer Vision', 'MLOps', 'Spark', 'Feature Engineering', 'Research', 'Mentoring']
  },
  'ML Engineer': {
    primary: ['Python', 'Machine Learning', 'TensorFlow', 'Docker', 'MLOps', 'Data Processing'],
    secondary: ['PyTorch', 'Kubernetes', 'AWS SageMaker', 'Feature Engineering', 'CI/CD', 'Spark', 'Deep Learning', 'Model Serving']
  },
  'Senior ML Engineer': {
    primary: ['Python', 'Machine Learning', 'Deep Learning', 'MLOps', 'System Design', 'Kubernetes'],
    secondary: ['TensorFlow', 'PyTorch', 'AWS SageMaker', 'Spark', 'Kafka', 'Model Serving', 'Architecture', 'Mentoring', 'Research']
  },
  'AI Researcher': {
    primary: ['Python', 'Deep Learning', 'Machine Learning', 'PyTorch', 'Mathematics', 'Research'],
    secondary: ['TensorFlow', 'NLP', 'Computer Vision', 'Reinforcement Learning', 'Statistics', 'LaTeX', 'Paper Writing']
  },
  'DevOps Engineer': {
    primary: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Linux', 'Terraform'],
    secondary: ['Jenkins', 'GitHub Actions', 'Ansible', 'Prometheus', 'Grafana', 'Python', 'Bash', 'Networking', 'Monitoring', 'Helm']
  },
  'Senior DevOps Engineer': {
    primary: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'System Design', 'Linux'],
    secondary: ['Azure', 'GCP', 'Jenkins', 'GitHub Actions', 'Ansible', 'Prometheus', 'Grafana', 'Istio', 'Security', 'Networking', 'Mentoring', 'Infrastructure as Code']
  },
  'Site Reliability Engineer': {
    primary: ['Kubernetes', 'Docker', 'AWS', 'Monitoring', 'Linux', 'Python', 'Terraform'],
    secondary: ['Prometheus', 'Grafana', 'ELK Stack', 'Incident Management', 'Networking', 'Bash', 'Go', 'System Design', 'Chaos Engineering']
  },
  'QA Engineer': {
    primary: ['Testing', 'Selenium', 'JavaScript', 'REST APIs', 'Git', 'SQL'],
    secondary: ['Cypress', 'Jest', 'Postman', 'JIRA', 'Test Planning', 'Python', 'Performance Testing']
  },
  'Senior QA Engineer': {
    primary: ['Testing', 'Selenium', 'Cypress', 'CI/CD', 'REST APIs', 'Test Planning'],
    secondary: ['Jest', 'Performance Testing', 'Security Testing', 'Python', 'JavaScript', 'Docker', 'Mentoring', 'K6 Load Testing']
  },
  'QA Lead': {
    primary: ['Testing', 'Test Planning', 'Leadership', 'CI/CD', 'Project Management', 'Communication'],
    secondary: ['Selenium', 'Cypress', 'Performance Testing', 'Security Testing', 'Mentoring', 'Stakeholder Management', 'Agile']
  },
  'UI/UX Designer': {
    primary: ['Figma', 'UI Design', 'UX Research', 'Prototyping', 'CSS'],
    secondary: ['Adobe XD', 'Sketch', 'Design Systems', 'Accessibility', 'User Testing', 'Responsive Design', 'HTML']
  },
  'Senior UI/UX Designer': {
    primary: ['Figma', 'UI Design', 'UX Research', 'Design Systems', 'Prototyping', 'User Testing'],
    secondary: ['Accessibility', 'CSS', 'Leadership', 'Stakeholder Management', 'Motion Design', 'A/B Testing', 'Mentoring']
  },
  'Design Lead': {
    primary: ['UI Design', 'UX Research', 'Leadership', 'Design Systems', 'Communication', 'Prototyping'],
    secondary: ['Figma', 'Project Management', 'Mentoring', 'Stakeholder Management', 'Agile', 'Brand Design']
  },
  'Mobile Developer': {
    primary: ['React Native', 'JavaScript', 'TypeScript', 'REST APIs', 'Git'],
    secondary: ['iOS', 'Android', 'Swift', 'Kotlin', 'Firebase', 'Redux', 'App Store Deployment']
  },
  'Senior Mobile Developer': {
    primary: ['React Native', 'TypeScript', 'iOS', 'Android', 'System Design', 'REST APIs'],
    secondary: ['Swift', 'Kotlin', 'Firebase', 'CI/CD', 'Testing', 'Architecture', 'Performance Optimization', 'Mentoring']
  },
  'Security Engineer': {
    primary: ['Security', 'Networking', 'Linux', 'Python', 'Penetration Testing', 'OWASP'],
    secondary: ['AWS', 'Docker', 'SIEM', 'Incident Response', 'Compliance', 'Cryptography', 'Bash', 'Vulnerability Assessment']
  },
  'Senior Security Engineer': {
    primary: ['Security', 'Penetration Testing', 'Cloud Security', 'OWASP', 'System Design', 'Incident Response'],
    secondary: ['AWS', 'Networking', 'Compliance', 'Cryptography', 'SIEM', 'Docker', 'Kubernetes', 'Mentoring', 'Threat Modeling']
  },
  'Cloud Architect': {
    primary: ['AWS', 'Azure', 'System Design', 'Terraform', 'Kubernetes', 'Networking'],
    secondary: ['GCP', 'Docker', 'Security', 'Microservices', 'Serverless', 'Cost Optimization', 'Infrastructure as Code', 'Leadership', 'Architecture']
  },
  'Solutions Architect': {
    primary: ['System Design', 'AWS', 'Architecture', 'Communication', 'Security', 'Microservices'],
    secondary: ['Azure', 'GCP', 'Terraform', 'Docker', 'Leadership', 'Stakeholder Management', 'Cost Optimization', 'API Design']
  },
  'Engineering Manager': {
    primary: ['Leadership', 'Communication', 'Project Management', 'System Design', 'Agile', 'People Management'],
    secondary: ['Technical Strategy', 'Architecture', 'Mentoring', 'Stakeholder Management', 'Hiring', 'OKRs', 'Budget Management']
  },
  'Technical Lead': {
    primary: ['System Design', 'Architecture', 'Leadership', 'Communication', 'Code Review', 'Mentoring'],
    secondary: ['JavaScript', 'Node.js', 'React', 'TypeScript', 'Docker', 'AWS', 'CI/CD', 'Agile', 'Technical Strategy']
  },
  'Principal Engineer': {
    primary: ['System Design', 'Architecture', 'Leadership', 'Technical Strategy', 'Security', 'Communication'],
    secondary: ['Cloud Architecture', 'Microservices', 'Mentoring', 'Research', 'Stakeholder Management', 'Innovation', 'Performance Engineering']
  },
  'Product Manager': {
    primary: ['Communication', 'Leadership', 'Business Intelligence', 'Agile', 'Stakeholder Management', 'Data Visualization'],
    secondary: ['SQL', 'A/B Testing', 'User Research', 'Roadmapping', 'OKRs', 'Market Analysis', 'Project Management']
  },
  'Technical Program Manager': {
    primary: ['Project Management', 'Communication', 'Leadership', 'Agile', 'Stakeholder Management', 'Risk Management'],
    secondary: ['System Design', 'Technical Strategy', 'JIRA', 'OKRs', 'Budget Management', 'Cross-functional Coordination']
  },
  'Platform Engineer': {
    primary: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux'],
    secondary: ['Python', 'Go', 'Helm', 'Prometheus', 'Grafana', 'System Design', 'Networking', 'Infrastructure as Code']
  },
  'Infrastructure Engineer': {
    primary: ['AWS', 'Networking', 'Linux', 'Terraform', 'Docker', 'Monitoring'],
    secondary: ['Azure', 'Ansible', 'Bash', 'Python', 'Security', 'Kubernetes', 'System Design', 'DNS', 'Load Balancing']
  }
};

const assessmentCategories = [
  'Frontend Development', 'Backend Development', 'Full Stack Development',
  'Data Science & Analytics', 'Machine Learning & AI', 'DevOps & Cloud',
  'Security & Compliance', 'System Design & Architecture',
  'Leadership & Management', 'Mobile Development', 'QA & Testing',
  'UI/UX Design', 'Cloud Architecture', 'Data Engineering',
  'Platform Engineering', 'Infrastructure & Networking'
];

const assessmentSources = ['skill_lab', 'voice_ai', 'manual'];

const bios = [
  'Passionate about building scalable applications and solving complex problems.',
  'Dedicated to continuous learning and professional growth in the tech industry.',
  'Experienced developer with a strong focus on clean code and best practices.',
  'Enthusiastic about emerging technologies and their real-world applications.',
  'Team player who thrives in collaborative, fast-paced environments.',
  'Motivated by challenging projects that push the boundaries of technology.',
  'Believer in the power of data-driven decision making and analytics.',
  'Committed to mentoring junior developers and fostering a learning culture.',
  'Strong advocate for DevOps practices and continuous improvement.',
  'Detail-oriented professional with a track record of delivering quality solutions.',
  'Creative problem solver with a keen eye for user experience design.',
  'Results-driven engineer focused on performance optimization and scalability.',
  'Lifelong learner passionate about AI/ML and its transformative potential.',
  'Security-first mindset with experience in building resilient systems.',
  'Full stack enthusiast who loves bridging the gap between frontend and backend.',
  'Cloud-native advocate with deep expertise in distributed systems.',
  'Backend specialist who enjoys designing robust APIs and microservices.',
  'Focused on building reliable, observable, and maintainable infrastructure.',
  'Experienced in leading cross-functional teams to deliver impactful products.',
  'Enjoys tackling data challenges and extracting actionable insights.'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Returns [minScore, maxScore] based on seniority AND a random performance tier.
 * ~15% employees are low performers (need training)
 * ~35% are average
 * ~50% are good/excellent
 */
function scoreForSeniority(role) {
  const tier = Math.random();

  if (role.includes('Junior')) {
    if (tier < 0.25) return [10, 30];   // struggling junior
    if (tier < 0.55) return [25, 50];   // average junior
    return [40, 65];                     // good junior
  }

  if (role.includes('Senior') || role.includes('Lead') || role.includes('Principal') || role.includes('Manager') || role.includes('Architect')) {
    if (tier < 0.10) return [25, 45];   // under-performing senior
    if (tier < 0.35) return [45, 65];   // average senior
    return [60, 98];                     // strong senior
  }

  // Mid-level
  if (tier < 0.20) return [15, 38];     // poor mid-level
  if (tier < 0.50) return [35, 60];     // average mid-level
  return [50, 85];                       // good mid-level
}

function experienceForRole(role) {
  if (role.includes('Senior') || role.includes('Lead')) return randInt(6, 16);
  if (role.includes('Principal') || role.includes('Manager') || role.includes('Architect')) return randInt(10, 22);
  if (role.includes('Junior')) return randInt(0, 2);
  return randInt(2, 8);
}

// ─── Main seed function ───────────────────────────────────────────────────────

async function seed() {
  await connectDB();
  console.log('🌱 Connected to MongoDB. Starting seed...\n');

  // Clear existing data
  await User.deleteMany({});
  await Assessment.deleteMany({});
  await LearningPlan.deleteMany({});
  await ChatHistory.deleteMany({});
  console.log('🗑  Cleared existing data (including chat history).\n');

  const hashedPassword = await bcrypt.hash('password123', 10);
  const totalEmployees = 520;
  const users = [];
  const assessments = [];
  const learningPlans = [];
  const usedEmails = new Set();

  // ── Admin user ──
  const adminUser = {
    name: 'Admin User',
    email: 'admin@skillmap.io',
    password: hashedPassword,
    role: 'admin',
    profile: {
      currentRole: 'Engineering Manager',
      yearsOfExperience: 14,
      techStack: ['System Design', 'Leadership', 'Communication', 'Technical Strategy', 'Project Management', 'AWS', 'Architecture'],
      desiredRole: 'VP of Engineering',
      department: 'Engineering',
      bio: 'Leading the engineering organization towards excellence and innovation.'
    }
  };
  usedEmails.add(adminUser.email);

  console.log('👤 Creating admin user...');
  const savedAdmin = await User.create(adminUser);
  users.push(savedAdmin);

  await Assessment.create({
    userId: savedAdmin._id,
    source: 'skill_lab',
    category: 'Leadership & Management',
    scores: [
      { skill: 'System Design', score: 92, maxScore: 100 },
      { skill: 'Leadership', score: 88, maxScore: 100 },
      { skill: 'Communication', score: 90, maxScore: 100 },
      { skill: 'Technical Strategy', score: 85, maxScore: 100 },
      { skill: 'Project Management', score: 87, maxScore: 100 }
    ]
  });

  console.log(`\n🏭 Generating ${totalEmployees} employees...\n`);

  // ── Build employees ──
  const employeeDocs = [];
  for (let i = 1; i <= totalEmployees; i++) {
    const firstName = pick(firstNames);
    const lastName = pick(lastNames);
    const name = `${firstName} ${lastName}`;
    const role = pick(jobRoles);
    const dept = pick(departments);
    const exp = experienceForRole(role);
    const roleSkills = skillsByRole[role] || { primary: ['JavaScript', 'Git'], secondary: ['Python'] };
    const techStack = [...new Set([...roleSkills.primary, ...pickN(roleSkills.secondary, randInt(2, 4))])];
    const desired = pick(desiredRoles);

    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@skillmap.io`;
    let counter = 1;
    while (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${counter}@skillmap.io`;
      counter++;
    }
    usedEmails.add(email);

    employeeDocs.push({
      name, email,
      password: hashedPassword,
      role: 'employee',
      profile: {
        currentRole: role,
        yearsOfExperience: exp,
        techStack,
        desiredRole: desired,
        department: dept,
        bio: pick(bios)
      }
    });

    if (i % 100 === 0) process.stdout.write(`  ✓ Prepared ${i}/${totalEmployees} employees\n`);
  }

  console.log('\n📥 Inserting users into database...');
  const savedEmployees = await User.insertMany(employeeDocs);
  users.push(...savedEmployees);
  console.log(`  ✓ ${savedEmployees.length} employees created.\n`);

  // ── Generate assessments ──
  // Each employee gets 2-5 assessments with GRANULAR skills from their role
  console.log('📊 Generating assessments...\n');
  const assessmentDocs = [];

  for (let idx = 0; idx < savedEmployees.length; idx++) {
    const emp = savedEmployees[idx];
    const empRole = emp.profile.currentRole;
    const roleSkills = skillsByRole[empRole] || { primary: ['JavaScript'], secondary: ['Git'] };
    const allSkills = [...roleSkills.primary, ...roleSkills.secondary];
    const [minScore, maxScore] = scoreForSeniority(empRole);
    const numAssessments = randInt(2, 5);

    for (let a = 0; a < numAssessments; a++) {
      const category = pick(assessmentCategories);
      const source = pick(assessmentSources);

      // PRIMARY skills get higher weight — always pick most of them
      const primaryPick = pickN(roleSkills.primary, randInt(Math.max(3, roleSkills.primary.length - 2), roleSkills.primary.length));
      // Add 1-3 secondary skills
      const secondaryPick = pickN(roleSkills.secondary, randInt(1, 3));
      const assessedSkills = [...new Set([...primaryPick, ...secondaryPick])];

      const scores = assessedSkills.map(skill => {
        // Primary skills score higher than secondary
        const isPrimary = roleSkills.primary.includes(skill);
        const boost = isPrimary ? 10 : 0;
        const score = Math.min(100, randInt(minScore + boost, maxScore));
        return { skill, score, maxScore: 100 };
      });

      const daysAgo = randInt(1, 365);
      const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

      assessmentDocs.push({
        userId: emp._id,
        source, category, scores, completedAt
      });
    }

    if ((idx + 1) % 100 === 0) process.stdout.write(`  ✓ Prepared assessments for ${idx + 1}/${savedEmployees.length} employees\n`);
  }

  console.log('\n📥 Inserting assessments...');
  const chunkSize = 500;
  for (let i = 0; i < assessmentDocs.length; i += chunkSize) {
    const chunk = assessmentDocs.slice(i, i + chunkSize);
    const saved = await Assessment.insertMany(chunk);
    assessments.push(...saved);
    process.stdout.write(`  ✓ Inserted ${Math.min(i + chunkSize, assessmentDocs.length)}/${assessmentDocs.length} assessments\n`);
  }
  console.log(`  Total: ${assessments.length} assessments.\n`);

  // ── Generate learning plans ── (about 60% of employees)
  console.log('📚 Generating learning plans...\n');
  const learningPlanDocs = [];
  const courseDb = require('../data/courseDatabase');
  const roleReqs = require('../data/roleRequirements');
  const availableTargetRoles = Object.keys(roleReqs);

  for (let idx = 0; idx < savedEmployees.length; idx++) {
    if (Math.random() > 0.6) continue;

    const emp = savedEmployees[idx];
    const targetRole = emp.profile.desiredRole && availableTargetRoles.includes(emp.profile.desiredRole)
      ? emp.profile.desiredRole
      : pick(availableTargetRoles);

    const requirements = roleReqs[targetRole];
    if (!requirements) continue;

    const empAssessments = assessmentDocs.filter(a => a.userId.toString() === emp._id.toString());
    const skillScores = {};
    empAssessments.forEach(a => {
      a.scores.forEach(s => {
        if (!skillScores[s.skill] || skillScores[s.skill] < s.score) {
          skillScores[s.skill] = s.score;
        }
      });
    });

    const gaps = requirements.skills.map(req => {
      const current = skillScores[req.skill] || randInt(10, 40);
      const gap = req.requiredLevel - current;
      let priority = 'low';
      if (gap > 40) priority = 'high';
      else if (gap > 20) priority = 'medium';
      return { skill: req.skill, currentLevel: current, requiredLevel: req.requiredLevel, priority: gap > 0 ? priority : 'low' };
    });

    const recommendations = [];
    gaps.forEach(gap => {
      if (gap.currentLevel < gap.requiredLevel) {
        const courses = courseDb[gap.skill] || [];
        if (courses.length > 0) {
          let level = 'beginner';
          if (gap.currentLevel > 50) level = 'intermediate';
          if (gap.currentLevel > 70) level = 'advanced';
          const course = courses.find(c => c.level === level) || courses[0];
          if (course) recommendations.push({ ...course, skill: gap.skill });
        }
      }
    });

    learningPlanDocs.push({
      userId: emp._id, targetRole, gaps, recommendations,
      progress: randInt(0, 65)
    });
  }

  if (learningPlanDocs.length > 0) {
    console.log(`📥 Inserting ${learningPlanDocs.length} learning plans...`);
    for (let i = 0; i < learningPlanDocs.length; i += chunkSize) {
      const chunk = learningPlanDocs.slice(i, i + chunkSize);
      const saved = await LearningPlan.insertMany(chunk);
      learningPlans.push(...saved);
      process.stdout.write(`  ✓ Inserted ${Math.min(i + chunkSize, learningPlanDocs.length)}/${learningPlanDocs.length} plans\n`);
    }
  }

  // ── Summary ──
  const uniqueSkills = new Set();
  assessmentDocs.forEach(a => a.scores.forEach(s => uniqueSkills.add(s.skill)));

  console.log('\n' + '═'.repeat(60));
  console.log('✅  SEED COMPLETE');
  console.log('═'.repeat(60));
  console.log(`  👤  Admin:          1 (admin@skillmap.io / password123)`);
  console.log(`  👥  Employees:      ${savedEmployees.length}`);
  console.log(`  📊  Assessments:    ${assessments.length}`);
  console.log(`  📚  Learning Plans: ${learningPlans.length}`);
  console.log(`  🎯  Unique Skills:  ${uniqueSkills.size}`);
  console.log('═'.repeat(60));
  console.log(`\n  Sample skills: ${[...uniqueSkills].slice(0, 20).join(', ')}`);
  console.log('\n  Login credentials:');
  console.log('  📧  Email: <firstname>.<lastname>@skillmap.io');
  console.log('  🔑  Password: password123\n');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
