# AI-Powered Job Tracker with Smart Matching

A full-stack application that uses AI to match jobs with user resumes and provides an intelligent conversational assistant for job searching.

## 🎯 Live Demo

- **Frontend**: [Deploy to Vercel/Netlify]
- **Backend**: [Deploy to Railway/Render]

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (React)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   Job Feed   │  │ Applications │  │   Profile    │           │
│  │  + Filters   │  │   Tracking   │  │   Resume     │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────┐       │
│  │         AI Chat Assistant (Sidebar)                  │       │
│  │  • Natural language filter control                   │       │
│  │  • Real-time UI updates                              │       │
│  │  • Help & guidance                                   │       │
│  └──────────────────────────────────────────────────────┘       │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REST API
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Backend (Node.js + Fastify)                  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                   API Endpoints                        │     │
│  │  /auth/login  /resume/upload  /jobs  /applications     │     │
│  │  /ai/chat                                              │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                 │
│  ┌────────────────┐           ┌────────────────────────┐        │
│  │  JobMatcher    │           │    AIAssistant         │        │
│  │  (LangChain)   │           │    (LangGraph)         │        │
│  │                │           │                        │        │
│  │ • Score jobs   │           │ ┌────────────────────┐ │        │
│  │ • Extract      │           │ │ classify_intent    │ │        │
│  │   skills       │           │ └────────────────────┘ │        │
│  │ • Match        │           │          │             │        │
│  │   experience   │           │          ▼             │        │
│  │                │           │ ┌────────────────────┐ │        │
│  └────────────────┘           │ │ extract_filters    │ │        │
│         │                     │ └────────────────────┘ │        │
│         │                     │          │             │        │
│         │                     │          ▼             │        │
│         │                     │ ┌────────────────────┐ │        │
│         │                     │ │ generate_response  │ │        │
│         │                     │ └────────────────────┘ │        │
│         │                     └────────────────────────┘        │
│         │                                  │                    │
│         └──────────┬───────────────────────┘                    │
│                    ▼                                            │
│            Claude API (Anthropic)                               │
│            Model: claude-sonnet-4                               │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐     │
│  │              In-Memory Storage                         │     │
│  │  • Users & Sessions                                    │     │
│  │  • Jobs (150 mock jobs)                                │     │
│  │  • Applications                                        │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Features

### ✅ Core Features Implemented

1. **Job Feed & Filtering**
   - 150 mock jobs from various companies
   - Comprehensive filters: role, skills, date, job type, work mode, location, match score
   - Clean, responsive UI with real-time filtering

2. **Resume Upload & AI Matching**
   - PDF and TXT resume support
   - Automatic job scoring using LangChain
   - Match scores (0-100%) with color-coded badges
   - "Best Matches" section for top jobs (>70%)
   - Detailed match explanations

3. **Smart Application Tracking**
   - Application popup after clicking "Apply"
   - Three options: "Yes, Applied" / "Applied Earlier" / "Just Browsing"
   - Status updates: Applied → Interview → Offer / Rejected
   - Timeline view for each application

4. **AI Assistant (LangGraph)**
   - Sidebar chat interface
   - Natural language job search
   - **Direct UI filter control** - AI updates filters in real-time
   - Help and product guidance
   - Conversation memory

## 📦 Tech Stack

- **Frontend**: React 18, React Router, Lucide Icons
- **Backend**: Node.js, Fastify
- **AI Matching**: LangChain (@langchain/anthropic)
- **AI Assistant**: LangGraph (@langchain/langgraph)
- **LLM**: Claude Sonnet 4 (Anthropic)
- **Storage**: In-memory (JSON objects)
- **File Processing**: pdf-parse

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Anthropic API key ([Get one here](https://console.anthropic.com/))

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Add your Anthropic API key to .env
# ANTHROPIC_API_KEY=your_key_here

# Start development server
npm run dev
```

Backend will run on `http://localhost:3001`

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on `http://localhost:5173`

### Environment Variables

**Backend (.env)**
```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**Frontend**
No environment variables required for local development (uses proxy).

For production, set:
```env
VITE_API_URL=https://your-backend-url.com
```

## 🤖 LangChain & LangGraph Usage

### LangChain for Job Matching

The `JobMatcher` class uses LangChain to score jobs against user resumes:

```javascript
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';

// Initialize LLM
this.llm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  modelName: 'claude-sonnet-4-20250514',
  temperature: 0.3,
});

// Create prompt template
const prompt = PromptTemplate.fromTemplate(`
  Analyze job match...
  Resume: {resume}
  Job: {title}, {description}...
`);

// Get AI response
const response = await this.llm.invoke(formattedPrompt);
```

**Scoring Approach:**
1. Direct skill matches (highest weight - 15 points per skill)
2. Relevant experience and projects
3. Education and certifications
4. Keyword alignment from job description
5. Years of experience matching

The AI returns structured JSON with:
- Match score (0-100)
- Matching skills
- Relevant experience
- Keyword alignment
- Reasoning

**Why it works:**
- Uses structured prompts for consistent output
- Combines semantic understanding with keyword matching
- Provides explainable results

**Performance:**
- Batch processing for multiple jobs
- Fallback to keyword matching if AI fails
- ~2-3 seconds for 150 jobs

### LangGraph for AI Assistant

The `AIAssistant` class uses LangGraph to orchestrate conversational AI with UI control:

```javascript
import { StateGraph } from '@langchain/langgraph';

// Define state channels
const graphState = {
  messages: { value: (left, right) => left.concat(right), default: () => [] },
  intent: { value: (left, right) => right ?? left, default: () => null },
  filters: { value: (left, right) => ({ ...left, ...right }), default: () => ({}) },
  response: { value: (left, right) => right ?? left, default: () => '' }
};

// Build workflow
const workflow = new StateGraph({ channels: graphState });
```

**Graph Structure:**

```
Entry → classify_intent → [conditional routing]
                           │
                           ├─ SEARCH/FILTER → extract_filters → generate_response → END
                           ├─ HELP → help_response → END
                           ├─ CLEAR → generate_response → END
                           └─ GENERAL → generate_response → END
```

**Nodes:**
1. **classify_intent**: Categorizes user message (SEARCH, FILTER, HELP, CLEAR, GENERAL)
2. **extract_filters**: Extracts structured filter parameters from natural language
3. **generate_response**: Creates contextual response
4. **help_response**: Provides product help

**Tool/Function Calling for UI Filters:**

The AI extracts filters as structured JSON:
```javascript
{
  "role": "React developer",
  "skills": ["React", "TypeScript"],
  "workMode": "remote",
  "matchScore": "high"
}
```

These are returned to the frontend and immediately applied to the UI, updating the job feed in real-time.

**State Management:**
- Conversation history stored (last 10 messages)
- Filter state accumulated across turns
- Intent tracking for context-aware responses

**Prompt Design:**
- Clear intent classification with specific keywords
- Structured JSON extraction for filters
- Contextual response generation based on intent

## 💡 Smart Application Popup Design

### Design Decision

The popup appears **after** the user clicks "Apply" and returns to the app, asking:
"Did you apply to [Job Title] at [Company]?"

**Options:**
1. **Yes, Applied** - Saves with timestamp, starts tracking
2. **Applied Earlier** - Marks as applied with earlier status
3. **Just Browsing** - Dismisses, doesn't track

### Why This Design?

**Advantages:**
- ✅ Non-intrusive - doesn't block the application flow
- ✅ Captures both immediate applications and returning users
- ✅ Allows users to browse without commitment
- ✅ Builds honest tracking data

**Edge Cases Handled:**
- User doesn't return → No tracking (clean data)
- User applied earlier → Separate status maintained
- Multiple attempts → Only tracks confirmed applications
- Quick browsing → Easy dismissal

**Alternatives Considered:**
1. **Pre-apply popup** - Too intrusive, blocks workflow
2. **Auto-track on click** - Inaccurate (user might not actually apply)
3. **Manual add later** - Users forget, poor UX

### Implementation Details

```javascript
// Triggered after external link is opened
const handleApply = (job) => {
  window.open(job.applyUrl, '_blank');
  setTimeout(() => setShowPopup(true), 500); // Small delay
};
```

## 🎨 AI Assistant UI Choice

**Choice: Collapsible Sidebar**

### Why Sidebar Over Bubble?

**Advantages:**
- More space for conversation history
- Better for displaying filter updates
- Easier to read AI responses
- Professional appearance
- Natural for desktop and mobile

**UX Reasoning:**
- Persistent toggle button (bottom-right)
- Slides in smoothly without blocking content
- Full-height for scrollable history
- Clear header with close button
- Dedicated input area at bottom

**Mobile Considerations:**
- Full-width on mobile
- Overlay instead of sidebar
- Touch-friendly close button
- Responsive message layout

## 📈 Scalability

### Handling 100+ Jobs

**Current Implementation:**
- Batch processing with LangChain
- Parallel promises for AI matching
- Frontend pagination (ready to implement)
- Filter before match (reduces AI calls)

**Optimizations for Scale:**
```javascript
// Batch match in chunks
const chunkSize = 10;
for (let i = 0; i < jobs.length; i += chunkSize) {
  const chunk = jobs.slice(i, i + chunkSize);
  await batchMatchJobs(chunk, resume);
}
```

### Handling 10,000 Users

**Required Changes:**

1. **Database:**
   - PostgreSQL or MongoDB
   - User authentication with JWT
   - Session management in Redis

2. **Caching:**
   ```javascript
   // Cache AI responses
   const cacheKey = `match_${jobId}_${resumeHash}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);
   ```

3. **Background Jobs:**
   - Bull queue for AI matching
   - Process matches asynchronously
   - Send notifications when ready

4. **Rate Limiting:**
   ```javascript
   fastify.register(require('@fastify/rate-limit'), {
     max: 100,
     timeWindow: '1 minute'
   });
   ```

5. **CDN & Load Balancing:**
   - Static assets on CDN
   - Multiple backend instances
   - Nginx load balancer

6. **Monitoring:**
   - Application metrics (Prometheus)
   - Error tracking (Sentry)
   - AI usage analytics

## 🎯 Known Limitations & Tradeoffs

### Current Limitations

1. **In-Memory Storage**
   - Data lost on server restart
   - Not scalable beyond single instance
   - *Tradeoff*: Simplicity for MVP vs persistence

2. **Mock Job Data**
   - Static dataset
   - No real job API integration
   - *Tradeoff*: Development speed vs real data

3. **Synchronous AI Matching**
   - Blocks response for large job sets
   - *Tradeoff*: Simple implementation vs async processing

4. **No Email Verification**
   - Simple test credentials
   - *Tradeoff*: Quick demo vs security

5. **Limited Error Handling**
   - Basic try-catch blocks
   - *Tradeoff*: Fast development vs robustness

### What I'd Improve with More Time

1. **Database Integration**
   - PostgreSQL with Prisma ORM
   - Proper indexing for fast queries

2. **Real Job APIs**
   - Integration with Indeed, LinkedIn
   - Automatic job refresh

3. **Advanced AI Features**
   - Resume improvement suggestions
   - Interview prep based on job
   - Salary negotiation insights

4. **Enhanced Tracking**
   - Email reminders for follow-ups
   - Application analytics
   - Success rate tracking

5. **Better UX**
   - Skeleton loaders
   - Optimistic UI updates
   - Offline support

6. **Testing**
   - Unit tests for AI functions
   - Integration tests for API
   - E2E tests with Playwright

7. **Security**
   - JWT authentication
   - Resume encryption
   - XSS/CSRF protection

## 🧪 Testing

### Run Backend Tests
```bash
cd backend
npm test
```

### Run Frontend Tests
```bash
cd frontend
npm test
```

### Manual Testing Checklist

- [ ] Login with test credentials
- [ ] Upload PDF resume
- [ ] View job feed with match scores
- [ ] Apply filters (each type)
- [ ] Use AI assistant to filter jobs
- [ ] Click Apply and track application
- [ ] Update application status
- [ ] Logout and login again

## 📝 Test Credentials

- **Email**: test@gmail.com
- **Password**: test@123

## 🎓 Learning Resources

- [LangChain Documentation](https://js.langchain.com/docs/)
- [LangGraph Documentation](https://langchain-ai.github.io/langgraphjs/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [Fastify Documentation](https://www.fastify.io/)

## 📜 License

MIT License - Feel free to use this project for learning and development.

## 🙋 Support

For questions or issues, please reach out to info@tcconsultingservices.in

---

**Built with ❤️ using React, Node.js, LangChain & LangGraph**
