export const generateMockJobs = () => {
  const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Spotify', 'Uber', 'Airbnb', 'Stripe', 'Shopify', 'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA', 'Tesla', 'Twitter', 'LinkedIn'];
  
  const roles = [
    { title: 'Senior Frontend Developer', skills: ['React', 'TypeScript', 'CSS', 'JavaScript', 'Redux'] },
    { title: 'Backend Engineer', skills: ['Node.js', 'Python', 'PostgreSQL', 'MongoDB', 'Redis'] },
    { title: 'Full Stack Developer', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'] },
    { title: 'ML Engineer', skills: ['Python', 'PyTorch', 'TensorFlow', 'Scikit-learn', 'Pandas'] },
    { title: 'DevOps Engineer', skills: ['Kubernetes', 'Docker', 'AWS', 'Jenkins', 'Terraform'] },
    { title: 'Data Scientist', skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Statistics'] },
    { title: 'Mobile Developer', skills: ['React Native', 'iOS', 'Android', 'Swift', 'Kotlin'] },
    { title: 'UI/UX Designer', skills: ['Figma', 'Adobe XD', 'Sketch', 'Prototyping', 'User Research'] },
    { title: 'Product Manager', skills: ['Product Strategy', 'Agile', 'Analytics', 'User Stories', 'Roadmapping'] },
    { title: 'QA Engineer', skills: ['Selenium', 'Jest', 'Testing', 'Automation', 'Bug Tracking'] }
  ];

  const locations = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Remote', 'Gurgaon', 'Noida'];
  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Internship'];
  const workModes = ['Remote', 'Hybrid', 'On-site'];

  const descriptions = [
    'Join our innovative team to build cutting-edge solutions that impact millions of users worldwide. We are looking for passionate developers who love to solve complex problems.',
    'We are seeking a talented professional to help us scale our platform and deliver exceptional user experiences. Great opportunity for growth and learning.',
    'Be part of a dynamic startup environment where your contributions directly impact product success. Work with modern technologies and best practices.',
    'Looking for someone who can hit the ground running and contribute to our fast-paced development cycle. Competitive compensation and benefits.',
    'Excellent opportunity to work on challenging projects with a collaborative team. We value innovation, creativity, and continuous learning.'
  ];

  const jobs = [];
  const now = new Date();

  for (let i = 0; i < 150; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const company = companies[Math.floor(Math.random() * companies.length)];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
    const workMode = workModes[Math.floor(Math.random() * workModes.length)];
    
    // Generate random date in the past 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const postedDate = new Date(now);
    postedDate.setDate(postedDate.getDate() - daysAgo);

    jobs.push({
      id: `job-${i + 1}`,
      title: role.title,
      company: company,
      location: location,
      jobType: jobType,
      workMode: workMode,
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      skills: role.skills,
      postedDate: postedDate.toISOString(),
      applyUrl: `https://careers.${company.toLowerCase().replace(' ', '')}.com/job/${i + 1}`,
      salary: `$${(80 + Math.floor(Math.random() * 120))}k - $${(120 + Math.floor(Math.random() * 100))}k`
    });
  }

  return jobs;
};

export const filterJobs = (jobs, filters) => {
  return jobs.filter(job => {
    // Role filter
    if (filters.role && !job.title.toLowerCase().includes(filters.role.toLowerCase())) {
      return false;
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      const hasMatchingSkill = filters.skills.some(skill => 
        job.skills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase())
        )
      );
      if (!hasMatchingSkill) return false;
    }

    // Date posted filter
    if (filters.datePosted && filters.datePosted !== 'any') {
      const jobDate = new Date(job.postedDate);
      const now = new Date();
      const hoursDiff = (now - jobDate) / (1000 * 60 * 60);
      
      if (filters.datePosted === '24h' && hoursDiff > 24) return false;
      if (filters.datePosted === 'week' && hoursDiff > 168) return false;
      if (filters.datePosted === 'month' && hoursDiff > 720) return false;
    }

    // Job type filter
    if (filters.jobType && job.jobType.toLowerCase() !== filters.jobType.toLowerCase()) {
      return false;
    }

    // Work mode filter
    if (filters.workMode && job.workMode.toLowerCase() !== filters.workMode.toLowerCase()) {
      return false;
    }

    // Location filter
    if (filters.location && !job.location.toLowerCase().includes(filters.location.toLowerCase())) {
      return false;
    }

    // Match score filter
    if (filters.matchScore) {
      if (filters.matchScore === 'high' && job.matchScore < 70) return false;
      if (filters.matchScore === 'medium' && (job.matchScore < 40 || job.matchScore >= 70)) return false;
    }

    return true;
  });
};