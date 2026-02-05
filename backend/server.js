import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import { config } from 'dotenv';
import pdfParse from 'pdf-parse';
import { v4 as uuidv4 } from 'uuid';
import { JobMatcher } from './jobMatcher.js';
import { AIAssistant } from './aiAssistant.js';
import { generateMockJobs, filterJobs } from './jobData.js';

config();

const fastify = Fastify({ logger: true });

// Register plugins
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
});

await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// In-memory storage
const storage = {
  users: [
    {
      id: 'user-1',
      email: 'test@gmail.com',
      password: 'test@123', // In production, use hashed passwords
      resume: null,
      applications: []
    }
  ],
  jobs: generateMockJobs(),
  sessions: new Map()
};

// Initialize AI services
let jobMatcher;
let aiAssistants = new Map(); // One assistant per session

try {
  jobMatcher = new JobMatcher(process.env.ANTHROPIC_API_KEY);
  console.log('✓ JobMatcher initialized with LangChain');
} catch (error) {
  console.error('Failed to initialize JobMatcher:', error);
}

// Helper function to get or create AI assistant for session
function getAIAssistant(sessionId) {
  if (!aiAssistants.has(sessionId)) {
    aiAssistants.set(sessionId, new AIAssistant(process.env.ANTHROPIC_API_KEY));
    console.log(`✓ Created new AIAssistant for session ${sessionId}`);
  }
  return aiAssistants.get(sessionId);
}

// Routes

// Health check
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Login
fastify.post('/api/auth/login', async (request, reply) => {
  const { email, password } = request.body;
  
  const user = storage.users.find(u => u.email === email && u.password === password);
  
  if (!user) {
    return reply.code(401).send({ error: 'Invalid credentials' });
  }

  const sessionId = uuidv4();
  storage.sessions.set(sessionId, { userId: user.id, createdAt: new Date() });

  return {
    sessionId,
    user: {
      id: user.id,
      email: user.email,
      hasResume: !!user.resume
    }
  };
});

// Upload resume
fastify.post('/api/resume/upload', async (request, reply) => {
  const sessionId = request.headers['x-session-id'];
  const session = storage.sessions.get(sessionId);
  
  if (!session) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const data = await request.file();
  
  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }

  try {
    const buffer = await data.toBuffer();
    let resumeText = '';

    if (data.mimetype === 'application/pdf') {
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    } else if (data.mimetype === 'text/plain') {
      resumeText = buffer.toString('utf-8');
    } else {
      return reply.code(400).send({ error: 'Unsupported file type. Please upload PDF or TXT.' });
    }

    const user = storage.users.find(u => u.id === session.userId);
    if (user) {
      user.resume = {
        text: resumeText,
        filename: data.filename,
        uploadedAt: new Date().toISOString()
      };
    }

    return { success: true, message: 'Resume uploaded successfully' };
  } catch (error) {
    console.error('Resume upload error:', error);
    return reply.code(500).send({ error: 'Failed to process resume' });
  }
});

// Get user profile
fastify.get('/api/user/profile', async (request, reply) => {
  const sessionId = request.headers['x-session-id'];
  const session = storage.sessions.get(sessionId);
  
  if (!session) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const user = storage.users.find(u => u.id === session.userId);
  
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return {
    email: user.email,
    hasResume: !!user.resume,
    resumeFilename: user.resume?.filename || null,
    resumeUploadedAt: user.resume?.uploadedAt || null
  };
});

// Get jobs with optional filtering and matching
fastify.post('/api/jobs', async (request, reply) => {
  const sessionId = request.headers['x-session-id'];
  const session = storage.sessions.get(sessionId);
  
  if (!session) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const filters = request.body.filters || {};
  const user = storage.users.find(u => u.id === session.userId);

  let jobs = [...storage.jobs];

  // Apply filters
  jobs = filterJobs(jobs, filters);

  // Apply AI matching if user has resume
  if (user?.resume?.text && jobMatcher) {
    try {
      console.log(`Matching ${jobs.length} jobs with AI...`);
      jobs = await jobMatcher.batchMatchJobs(jobs, user.resume.text);
      console.log(`✓ AI matching completed`);
    } catch (error) {
      console.error('AI matching error:', error);
      // Continue without matching scores
      jobs = jobs.map(job => ({ ...job, matchScore: 0 }));
    }
  } else {
    jobs = jobs.map(job => ({ ...job, matchScore: 0 }));
  }

  // Sort by match score descending
  jobs.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  return {
    jobs,
    total: jobs.length,
    bestMatches: jobs.filter(j => j.matchScore > 70).slice(0, 8)
  };
});

// Track application
fastify.post('/api/applications', async (request, reply) => {
  const sessionId = request.headers['x-session-id'];
  const session = storage.sessions.get(sessionId);
  
  if (!session) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const { jobId, status } = request.body;
  const user = storage.users.find(u => u.id === session.userId);
  
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const job = storage.jobs.find(j => j.id === jobId);
  
  if (!job) {
    return reply.code(404).send({ error: 'Job not found' });
  }

  const application = {
    id: uuidv4(),
    jobId: job.id,
    job: job,
    status: status || 'Applied',
    appliedAt: new Date().toISOString(),
    timeline: [
      {
        status: status || 'Applied',
        date: new Date().toISOString()
      }
    ]
  };

  user.applications.push(application);

  return { success: true, application };
});

// Get applications
fastify.get('/api/applications', async (request, reply) => {
  const sessionId = request.headers['x-session-id'];
  const session = storage.sessions.get(sessionId);
  
  if (!session) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const user = storage.users.find(u => u.id === session.userId);
  
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  return { applications: user.applications };
});

// Update application status
fastify.put('/api/applications/:id', async (request, reply) => {
  const sessionId = request.headers['x-session-id'];
  const session = storage.sessions.get(sessionId);
  
  if (!session) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const { id } = request.params;
  const { status } = request.body;
  const user = storage.users.find(u => u.id === session.userId);
  
  if (!user) {
    return reply.code(404).send({ error: 'User not found' });
  }

  const application = user.applications.find(a => a.id === id);
  
  if (!application) {
    return reply.code(404).send({ error: 'Application not found' });
  }

  application.status = status;
  application.timeline.push({
    status,
    date: new Date().toISOString()
  });

  return { success: true, application };
});

// AI Assistant chat
fastify.post('/api/ai/chat', async (request, reply) => {
  const sessionId = request.headers['x-session-id'];
  const session = storage.sessions.get(sessionId);
  
  if (!session) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }

  const { message } = request.body;
  
  if (!message) {
    return reply.code(400).send({ error: 'Message is required' });
  }

  try {
    const assistant = getAIAssistant(sessionId);
    const result = await assistant.chat(message);
    
    return {
      response: result.response,
      intent: result.intent,
      filters: result.filters
    };
  } catch (error) {
    console.error('AI chat error:', error);
    return reply.code(500).send({ 
      error: 'AI service error',
      response: 'Sorry, I encountered an error. Please try again.'
    });
  }
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`
🚀 Server running on http://localhost:${port}
📊 ${storage.jobs.length} mock jobs loaded
🤖 AI services ready
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();