import { ChatAnthropic } from '@langchain/anthropic';
import { StateGraph, END } from '@langchain/langgraph';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

export class AIAssistant {
  constructor(apiKey) {
    this.llm = new ChatAnthropic({
      apiKey: apiKey,
      modelName: 'claude-sonnet-4-20250514',
      temperature: 0.7,
    });
    
    this.graph = this.buildGraph();
    this.conversationHistory = [];
  }

  buildGraph() {
    // Define state channels
    const graphState = {
      messages: {
        value: (left, right) => left.concat(right),
        default: () => []
      },
      intent: {
        value: (left, right) => right ?? left,
        default: () => null
      },
      filters: {
        value: (left, right) => ({ ...left, ...right }),
        default: () => ({})
      },
      response: {
        value: (left, right) => right ?? left,
        default: () => ''
      }
    };

    const workflow = new StateGraph({ channels: graphState });

    // Node 1: Classify Intent
    workflow.addNode('classify_intent', async (state) => {
      const userMessage = state.messages[state.messages.length - 1].content;
      
      const intentPrompt = `Classify the user's intent. User message: "${userMessage}"

Return ONLY ONE of these intents as a single word:
- SEARCH (searching for specific jobs)
- FILTER (applying/changing filters)
- HELP (asking for help/information)
- CLEAR (clearing filters)
- GENERAL (general conversation)

Intent:`;

      const response = await this.llm.invoke([
        new SystemMessage(intentPrompt)
      ]);

      const intent = response.content.trim().toUpperCase();
      
      return {
        ...state,
        intent: ['SEARCH', 'FILTER', 'HELP', 'CLEAR', 'GENERAL'].includes(intent) 
          ? intent 
          : 'GENERAL'
      };
    });

    // Node 2: Extract Filters
    workflow.addNode('extract_filters', async (state) => {
      const userMessage = state.messages[state.messages.length - 1].content;
      
      const filterPrompt = `Extract job search filters from: "${userMessage}"

Return ONLY valid JSON with these exact fields (use null if not mentioned):
{
  "role": string or null,
  "skills": array of strings or null,
  "datePosted": "24h" or "week" or "month" or "any" or null,
  "jobType": "full-time" or "part-time" or "contract" or "internship" or null,
  "workMode": "remote" or "hybrid" or "on-site" or null,
  "location": string or null,
  "matchScore": "high" or "medium" or "all" or null
}

Examples:
"Show me React developer jobs" -> {"role": "React developer", "skills": ["React"], "datePosted": null, "jobType": null, "workMode": null, "location": null, "matchScore": null}
"Remote frontend jobs" -> {"role": "frontend", "skills": null, "datePosted": null, "jobType": null, "workMode": "remote", "location": null, "matchScore": null}
"Only full-time roles in Bangalore" -> {"role": null, "skills": null, "datePosted": null, "jobType": "full-time", "workMode": null, "location": "Bangalore", "matchScore": null}

JSON:`;

      try {
        const response = await this.llm.invoke([new SystemMessage(filterPrompt)]);
        const content = response.content.trim();
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
          const filters = JSON.parse(jsonMatch[0]);
          // Clean null values
          const cleanFilters = {};
          Object.keys(filters).forEach(key => {
            if (filters[key] !== null) {
              cleanFilters[key] = filters[key];
            }
          });
          
          return {
            ...state,
            filters: cleanFilters
          };
        }
      } catch (error) {
        console.error('Filter extraction error:', error);
      }
      
      return state;
    });

    // Node 3: Generate Response
    workflow.addNode('generate_response', async (state) => {
      const userMessage = state.messages[state.messages.length - 1].content;
      const intent = state.intent;
      const filters = state.filters;

      let systemPrompt = `You are a helpful AI assistant for a job tracking application. Be concise and friendly.`;

      if (intent === 'FILTER' || intent === 'SEARCH') {
        const appliedFilters = Object.keys(filters).length > 0 
          ? JSON.stringify(filters, null, 2)
          : 'none';
        
        systemPrompt += `\n\nThe user wants to ${intent === 'SEARCH' ? 'search for jobs' : 'apply filters'}.
Filters being applied: ${appliedFilters}

Respond naturally confirming what filters you're applying. Be brief (1-2 sentences).`;
      } else if (intent === 'HELP') {
        systemPrompt += `\n\nAnswer the user's question about the job tracker app. Keep it brief and helpful.
        
Available features:
- Upload/update resume in profile
- Browse job feed with AI match scores
- Filter jobs by role, skills, date, type, work mode, location, match score
- Track applications with status updates
- Use AI assistant (me!) to search and filter jobs`;
      } else if (intent === 'CLEAR') {
        systemPrompt += `\n\nConfirm that you're clearing all filters. Be brief.`;
      }

      const messages = [
        new SystemMessage(systemPrompt),
        ...this.conversationHistory.slice(-4), // Last 2 exchanges
        new HumanMessage(userMessage)
      ];

      const response = await this.llm.invoke(messages);
      
      return {
        ...state,
        response: response.content
      };
    });

    // Node 4: Help Response
    workflow.addNode('help_response', async (state) => {
      const userMessage = state.messages[state.messages.length - 1].content.toLowerCase();
      
      let response = '';
      if (userMessage.includes('application') || userMessage.includes('track')) {
        response = 'Your applications are in the "Applications" tab. Click "Apply" on any job, and I\'ll help you track it!';
      } else if (userMessage.includes('resume') || userMessage.includes('upload')) {
        response = 'Go to your Profile (top right) to upload or update your resume. This helps me match jobs to your skills!';
      } else if (userMessage.includes('match') || userMessage.includes('score')) {
        response = 'Match scores show how well jobs fit your resume. Green (>70%) = Great match, Yellow (40-70%) = Good match, Gray (<40%) = Lower match.';
      } else {
        response = 'I can help you search jobs, apply filters, or answer questions. Try: "Show me React jobs" or "Remote roles only"!';
      }
      
      return {
        ...state,
        response
      };
    });

    // Set entry point
    workflow.setEntryPoint('classify_intent');

    // Add conditional edges
    workflow.addConditionalEdges(
      'classify_intent',
      (state) => {
        if (state.intent === 'HELP') return 'help';
        if (state.intent === 'SEARCH' || state.intent === 'FILTER') return 'extract';
        if (state.intent === 'CLEAR') return 'clear';
        return 'generate';
      },
      {
        help: 'help_response',
        extract: 'extract_filters',
        clear: 'generate_response',
        generate: 'generate_response'
      }
    );

    workflow.addEdge('extract_filters', 'generate_response');
    workflow.addEdge('help_response', END);
    workflow.addEdge('generate_response', END);

    return workflow.compile();
  }

  async chat(userMessage) {
    this.conversationHistory.push(new HumanMessage(userMessage));

    const initialState = {
      messages: [new HumanMessage(userMessage)],
      intent: null,
      filters: {},
      response: ''
    };

    try {
      const result = await this.graph.invoke(initialState);
      
      const response = result.response || 'I can help you find jobs! Try asking me to search or filter jobs.';
      this.conversationHistory.push(new AIMessage(response));
      
      // Keep conversation history manageable
      if (this.conversationHistory.length > 10) {
        this.conversationHistory = this.conversationHistory.slice(-10);
      }

      return {
        response,
        intent: result.intent,
        filters: result.filters || {}
      };
    } catch (error) {
      console.error('AI Assistant error:', error);
      return {
        response: 'Sorry, I encountered an error. Please try again.',
        intent: 'GENERAL',
        filters: {}
      };
    }
  }

  clearHistory() {
    this.conversationHistory = [];
  }
}