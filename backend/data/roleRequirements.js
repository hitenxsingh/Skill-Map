// Role requirements for gap analysis — using granular real-world skills
const roleRequirements = {
  'Senior Frontend Developer': {
    skills: [
      { skill: 'JavaScript', requiredLevel: 85 },
      { skill: 'React', requiredLevel: 80 },
      { skill: 'TypeScript', requiredLevel: 75 },
      { skill: 'Next.js', requiredLevel: 65 },
      { skill: 'Testing', requiredLevel: 65 },
      { skill: 'Web Performance', requiredLevel: 70 },
      { skill: 'System Design', requiredLevel: 60 }
    ]
  },
  'Senior Backend Developer': {
    skills: [
      { skill: 'Node.js', requiredLevel: 85 },
      { skill: 'Express.js', requiredLevel: 80 },
      { skill: 'PostgreSQL', requiredLevel: 75 },
      { skill: 'MongoDB', requiredLevel: 70 },
      { skill: 'System Design', requiredLevel: 75 },
      { skill: 'Docker', requiredLevel: 65 },
      { skill: 'Microservices', requiredLevel: 60 }
    ]
  },
  'Full Stack Developer': {
    skills: [
      { skill: 'JavaScript', requiredLevel: 80 },
      { skill: 'React', requiredLevel: 75 },
      { skill: 'Node.js', requiredLevel: 75 },
      { skill: 'Express.js', requiredLevel: 70 },
      { skill: 'MongoDB', requiredLevel: 65 },
      { skill: 'REST APIs', requiredLevel: 70 },
      { skill: 'Docker', requiredLevel: 55 }
    ]
  },
  'ML Engineer': {
    skills: [
      { skill: 'Python', requiredLevel: 85 },
      { skill: 'Machine Learning', requiredLevel: 80 },
      { skill: 'TensorFlow', requiredLevel: 70 },
      { skill: 'Docker', requiredLevel: 65 },
      { skill: 'MLOps', requiredLevel: 60 },
      { skill: 'Deep Learning', requiredLevel: 70 },
      { skill: 'System Design', requiredLevel: 55 }
    ]
  },
  'DevOps Engineer': {
    skills: [
      { skill: 'Docker', requiredLevel: 80 },
      { skill: 'Kubernetes', requiredLevel: 80 },
      { skill: 'AWS', requiredLevel: 80 },
      { skill: 'Terraform', requiredLevel: 75 },
      { skill: 'CI/CD', requiredLevel: 85 },
      { skill: 'Linux', requiredLevel: 70 },
      { skill: 'Monitoring', requiredLevel: 65 }
    ]
  },
  'Data Analyst': {
    skills: [
      { skill: 'SQL', requiredLevel: 85 },
      { skill: 'Python', requiredLevel: 70 },
      { skill: 'Data Visualization', requiredLevel: 80 },
      { skill: 'Statistics', requiredLevel: 75 },
      { skill: 'Excel', requiredLevel: 70 },
      { skill: 'Tableau', requiredLevel: 65 },
      { skill: 'Business Intelligence', requiredLevel: 60 }
    ]
  },
  'Engineering Manager': {
    skills: [
      { skill: 'Leadership', requiredLevel: 85 },
      { skill: 'Communication', requiredLevel: 85 },
      { skill: 'Project Management', requiredLevel: 80 },
      { skill: 'System Design', requiredLevel: 75 },
      { skill: 'Agile', requiredLevel: 75 },
      { skill: 'People Management', requiredLevel: 80 },
      { skill: 'Architecture', requiredLevel: 70 }
    ]
  },
  'Cloud Architect': {
    skills: [
      { skill: 'AWS', requiredLevel: 85 },
      { skill: 'Azure', requiredLevel: 70 },
      { skill: 'Terraform', requiredLevel: 80 },
      { skill: 'Kubernetes', requiredLevel: 75 },
      { skill: 'System Design', requiredLevel: 85 },
      { skill: 'Networking', requiredLevel: 70 },
      { skill: 'Security', requiredLevel: 65 }
    ]
  },
  'Solutions Architect': {
    skills: [
      { skill: 'System Design', requiredLevel: 85 },
      { skill: 'AWS', requiredLevel: 80 },
      { skill: 'Architecture', requiredLevel: 85 },
      { skill: 'Communication', requiredLevel: 80 },
      { skill: 'Security', requiredLevel: 70 },
      { skill: 'Microservices', requiredLevel: 75 },
      { skill: 'Leadership', requiredLevel: 65 }
    ]
  },
  'Principal Engineer': {
    skills: [
      { skill: 'System Design', requiredLevel: 90 },
      { skill: 'Architecture', requiredLevel: 90 },
      { skill: 'Leadership', requiredLevel: 80 },
      { skill: 'Technical Strategy', requiredLevel: 85 },
      { skill: 'Communication', requiredLevel: 80 },
      { skill: 'Security', requiredLevel: 70 },
      { skill: 'Mentoring', requiredLevel: 75 }
    ]
  },
  'Technical Lead': {
    skills: [
      { skill: 'System Design', requiredLevel: 80 },
      { skill: 'Architecture', requiredLevel: 80 },
      { skill: 'Leadership', requiredLevel: 80 },
      { skill: 'Communication', requiredLevel: 75 },
      { skill: 'Code Review', requiredLevel: 80 },
      { skill: 'Mentoring', requiredLevel: 75 },
      { skill: 'Agile', requiredLevel: 65 }
    ]
  },
  'AI Researcher': {
    skills: [
      { skill: 'Python', requiredLevel: 85 },
      { skill: 'Deep Learning', requiredLevel: 85 },
      { skill: 'Machine Learning', requiredLevel: 85 },
      { skill: 'PyTorch', requiredLevel: 80 },
      { skill: 'Mathematics', requiredLevel: 80 },
      { skill: 'Research', requiredLevel: 85 },
      { skill: 'Statistics', requiredLevel: 75 }
    ]
  },
  'Senior Data Scientist': {
    skills: [
      { skill: 'Python', requiredLevel: 85 },
      { skill: 'Machine Learning', requiredLevel: 80 },
      { skill: 'Deep Learning', requiredLevel: 75 },
      { skill: 'Statistics', requiredLevel: 80 },
      { skill: 'TensorFlow', requiredLevel: 70 },
      { skill: 'System Design', requiredLevel: 65 },
      { skill: 'Mentoring', requiredLevel: 60 }
    ]
  },
  'Site Reliability Engineer': {
    skills: [
      { skill: 'Kubernetes', requiredLevel: 80 },
      { skill: 'Docker', requiredLevel: 80 },
      { skill: 'AWS', requiredLevel: 80 },
      { skill: 'Monitoring', requiredLevel: 85 },
      { skill: 'Linux', requiredLevel: 80 },
      { skill: 'Terraform', requiredLevel: 70 },
      { skill: 'System Design', requiredLevel: 65 }
    ]
  },
  'Security Engineer': {
    skills: [
      { skill: 'Security', requiredLevel: 85 },
      { skill: 'Penetration Testing', requiredLevel: 75 },
      { skill: 'Linux', requiredLevel: 70 },
      { skill: 'Python', requiredLevel: 65 },
      { skill: 'Networking', requiredLevel: 75 },
      { skill: 'OWASP', requiredLevel: 80 },
      { skill: 'AWS', requiredLevel: 60 }
    ]
  }
};

module.exports = roleRequirements;
