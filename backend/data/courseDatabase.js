// Curated course recommendations mapped by skill
const courseDatabase = {
  'JavaScript': [
    { title: 'The Complete JavaScript Course 2025', provider: 'Udemy', url: 'https://www.udemy.com/course/the-complete-javascript-course/', duration: '69 hours', level: 'beginner' },
    { title: 'JavaScript: The Advanced Concepts', provider: 'Udemy', url: 'https://www.udemy.com/course/advanced-javascript-concepts/', duration: '25 hours', level: 'advanced' }
  ],
  'React': [
    { title: 'React - The Complete Guide', provider: 'Udemy', url: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', duration: '68 hours', level: 'beginner' },
    { title: 'React Path', provider: 'Pluralsight', url: 'https://www.pluralsight.com/paths/react', duration: '25 hours', level: 'intermediate' }
  ],
  'TypeScript': [
    { title: 'Understanding TypeScript', provider: 'Udemy', url: 'https://www.udemy.com/course/understanding-typescript/', duration: '15 hours', level: 'beginner' },
    { title: 'TypeScript Path', provider: 'Pluralsight', url: 'https://www.pluralsight.com/paths/typescript-core-language', duration: '20 hours', level: 'intermediate' }
  ],
  'Node.js': [
    { title: 'The Complete Node.js Developer Course', provider: 'Udemy', url: 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/', duration: '35 hours', level: 'beginner' },
    { title: 'Node.js Path', provider: 'Pluralsight', url: 'https://www.pluralsight.com/paths/node-js', duration: '30 hours', level: 'intermediate' }
  ],
  'Express.js': [
    { title: 'Node.js API Masterclass with Express', provider: 'Udemy', url: 'https://www.udemy.com/course/nodejs-api-masterclass/', duration: '12 hours', level: 'intermediate' }
  ],
  'Next.js': [
    { title: 'Next.js & React - The Complete Guide', provider: 'Udemy', url: 'https://www.udemy.com/course/nextjs-react-the-complete-guide/', duration: '25 hours', level: 'intermediate' }
  ],
  'Python': [
    { title: '100 Days of Code: Python', provider: 'Udemy', url: 'https://www.udemy.com/course/100-days-of-code/', duration: '64 hours', level: 'beginner' },
    { title: 'Python Path', provider: 'Pluralsight', url: 'https://www.pluralsight.com/paths/python', duration: '25 hours', level: 'intermediate' }
  ],
  'PostgreSQL': [
    { title: 'The Complete SQL Bootcamp', provider: 'Udemy', url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/', duration: '9 hours', level: 'beginner' },
    { title: 'PostgreSQL Advanced', provider: 'Pluralsight', url: 'https://www.pluralsight.com/courses/postgresql-advanced', duration: '12 hours', level: 'advanced' }
  ],
  'MongoDB': [
    { title: 'MongoDB - The Complete Developer Guide', provider: 'Udemy', url: 'https://www.udemy.com/course/mongodb-the-complete-developers-guide/', duration: '17 hours', level: 'intermediate' }
  ],
  'SQL': [
    { title: 'The Complete SQL Bootcamp', provider: 'Udemy', url: 'https://www.udemy.com/course/the-complete-sql-bootcamp/', duration: '9 hours', level: 'beginner' }
  ],
  'System Design': [
    { title: 'System Design Interview Prep', provider: 'Udemy', url: 'https://www.udemy.com/course/system-design-interview-prep/', duration: '12 hours', level: 'advanced' },
    { title: 'Software Architecture', provider: 'Pluralsight', url: 'https://www.pluralsight.com/paths/software-architecture', duration: '20 hours', level: 'advanced' }
  ],
  'Machine Learning': [
    { title: 'Machine Learning A-Z', provider: 'Udemy', url: 'https://www.udemy.com/course/machinelearning/', duration: '44 hours', level: 'beginner' },
    { title: 'ML Specialization', provider: 'Coursera', url: 'https://www.coursera.org/specializations/machine-learning-introduction', duration: '30 hours', level: 'intermediate' }
  ],
  'Docker': [
    { title: 'Docker & Kubernetes: The Practical Guide', provider: 'Udemy', url: 'https://www.udemy.com/course/docker-kubernetes-the-practical-guide/', duration: '24 hours', level: 'beginner' },
    { title: 'Docker Deep Dive', provider: 'Pluralsight', url: 'https://www.pluralsight.com/courses/docker-deep-dive-update', duration: '6 hours', level: 'intermediate' }
  ],
  'Kubernetes': [
    { title: 'Kubernetes for the Absolute Beginners', provider: 'Udemy', url: 'https://www.udemy.com/course/learn-kubernetes/', duration: '6 hours', level: 'beginner' },
    { title: 'Certified Kubernetes Administrator', provider: 'Udemy', url: 'https://www.udemy.com/course/certified-kubernetes-administrator-with-practice-tests/', duration: '17 hours', level: 'advanced' }
  ],
  'AWS': [
    { title: 'AWS Certified Solutions Architect Associate', provider: 'Udemy', url: 'https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/', duration: '27 hours', level: 'intermediate' },
    { title: 'AWS Certified Cloud Practitioner', provider: 'Udemy', url: 'https://www.udemy.com/course/aws-certified-cloud-practitioner-new/', duration: '14 hours', level: 'beginner' }
  ],
  'Azure': [
    { title: 'AZ-900 Azure Fundamentals', provider: 'Udemy', url: 'https://www.udemy.com/course/az900-azure/', duration: '11 hours', level: 'beginner' }
  ],
  'Terraform': [
    { title: 'HashiCorp Terraform Associate Certification', provider: 'Udemy', url: 'https://www.udemy.com/course/terraform-beginner-to-advanced/', duration: '13 hours', level: 'intermediate' }
  ],
  'CI/CD': [
    { title: 'DevOps CI/CD Pipeline', provider: 'Udemy', url: 'https://www.udemy.com/course/devops-ci-cd/', duration: '10 hours', level: 'intermediate' }
  ],
  'Security': [
    { title: 'Web Security & Bug Bounty', provider: 'Udemy', url: 'https://www.udemy.com/course/web-security-and-bug-bounty/', duration: '10 hours', level: 'intermediate' }
  ],
  'Testing': [
    { title: 'Testing JavaScript', provider: 'Udemy', url: 'https://www.udemy.com/course/js-testing/', duration: '12 hours', level: 'intermediate' }
  ],
  'REST APIs': [
    { title: 'REST APIs with Node.js', provider: 'Udemy', url: 'https://www.udemy.com/course/nodejs-api-masterclass/', duration: '12 hours', level: 'intermediate' }
  ],
  'GraphQL': [
    { title: 'GraphQL by Example', provider: 'Udemy', url: 'https://www.udemy.com/course/graphql-by-example/', duration: '8 hours', level: 'intermediate' }
  ],
  'Deep Learning': [
    { title: 'Deep Learning A-Z', provider: 'Udemy', url: 'https://www.udemy.com/course/deeplearning/', duration: '23 hours', level: 'intermediate' }
  ],
  'TensorFlow': [
    { title: 'TensorFlow Developer Certificate', provider: 'Coursera', url: 'https://www.coursera.org/professional-certificates/tensorflow-in-practice', duration: '16 hours', level: 'intermediate' }
  ],
  'Redis': [
    { title: 'Redis: The Complete Developer Guide', provider: 'Udemy', url: 'https://www.udemy.com/course/redis-the-complete-developers-guide-p/', duration: '13 hours', level: 'intermediate' }
  ],
  'Microservices': [
    { title: 'Microservices with Node.js and React', provider: 'Udemy', url: 'https://www.udemy.com/course/microservices-with-node-js-and-react/', duration: '54 hours', level: 'advanced' }
  ],
  'Linux': [
    { title: 'Linux Mastery', provider: 'Udemy', url: 'https://www.udemy.com/course/linux-mastery/', duration: '11 hours', level: 'beginner' }
  ],
  'Networking': [
    { title: 'Complete Networking Fundamentals', provider: 'Udemy', url: 'https://www.udemy.com/course/complete-networking-fundamentals-course-ccna-start/', duration: '65 hours', level: 'beginner' }
  ],
  'Leadership': [
    { title: 'Leadership: Practical Leadership Skills', provider: 'Udemy', url: 'https://www.udemy.com/course/leadership-practical/', duration: '7 hours', level: 'intermediate' }
  ],
  'Communication': [
    { title: 'Complete Communication Skills Master Class', provider: 'Udemy', url: 'https://www.udemy.com/course/complete-communication-skills-master-class-for-life/', duration: '18 hours', level: 'beginner' }
  ],
  'React Native': [
    { title: 'React Native - The Practical Guide', provider: 'Udemy', url: 'https://www.udemy.com/course/react-native-the-practical-guide/', duration: '29 hours', level: 'intermediate' }
  ],
  'Figma': [
    { title: 'Complete Figma Course', provider: 'Udemy', url: 'https://www.udemy.com/course/figma-ux-ui-design-user-experience-tutorial-course/', duration: '14 hours', level: 'beginner' }
  ],
  'Architecture': [
    { title: 'Software Architecture', provider: 'Pluralsight', url: 'https://www.pluralsight.com/paths/software-architecture', duration: '20 hours', level: 'advanced' }
  ],
  'Project Management': [
    { title: 'PMP Prep Seminar', provider: 'Udemy', url: 'https://www.udemy.com/course/pmp-pmbok6-35-702/', duration: '35 hours', level: 'advanced' }
  ]
};

module.exports = courseDatabase;
