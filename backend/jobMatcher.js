import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';

export class JobMatcher {
  constructor(apiKey) {
    this.llm = new ChatAnthropic({
      apiKey: apiKey,
      modelName: 'claude-sonnet-4-20250514',
      temperature: 0.3,
    });
  }

  async matchJob(job, resumeText) {
    const prompt = PromptTemplate.fromTemplate(`You are an expert job matching AI. Analyze how well this candidate's resume matches the job posting.

Resume:
{resume}

Job Posting:
Title: {title}
Company: {company}
Description: {description}
Required Skills: {skills}
Location: {location}
Job Type: {jobType}

Provide your analysis in this EXACT JSON format (no other text):
{{
  "score": <number 0-100>,
  "matchingSkills": ["skill1", "skill2"],
  "relevantExperience": ["experience1", "experience2"],
  "keywordAlignment": ["keyword1", "keyword2"],
  "reasoning": "Brief explanation of the match"
}}

Focus on:
1. Direct skill matches (highest weight)
2. Relevant experience and projects
3. Education and certifications
4. Keywords from job description appearing in resume
5. Years of experience alignment

Be precise and realistic with scoring.`);

    try {
      const formattedPrompt = await prompt.format({
        resume: resumeText,
        title: job.title,
        company: job.company,
        description: job.description || 'Not specified',
        skills: Array.isArray(job.skills) ? job.skills.join(', ') : 'Not specified',
        location: job.location || 'Not specified',
        jobType: job.jobType || 'Not specified'
      });

      const response = await this.llm.invoke(formattedPrompt);
      const content = response.content;
      
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          score: Math.round(result.score),
          matchingSkills: result.matchingSkills || [],
          relevantExperience: result.relevantExperience || [],
          keywordAlignment: result.keywordAlignment || [],
          reasoning: result.reasoning || ''
        };
      }
      
      throw new Error('Invalid response format from LLM');
    } catch (error) {
      console.error('Error matching job:', error);
      // Fallback basic matching
      return this.fallbackMatching(job, resumeText);
    }
  }

  fallbackMatching(job, resumeText) {
    const resumeLower = resumeText.toLowerCase();
    let score = 0;
    const matchingSkills = [];
    
    if (job.skills && Array.isArray(job.skills)) {
      job.skills.forEach(skill => {
        if (resumeLower.includes(skill.toLowerCase())) {
          score += 15;
          matchingSkills.push(skill);
        }
      });
    }
    
    // Title match
    if (job.title && resumeLower.includes(job.title.toLowerCase())) {
      score += 20;
    }
    
    return {
      score: Math.min(score, 100),
      matchingSkills,
      relevantExperience: [],
      keywordAlignment: [],
      reasoning: 'Basic keyword matching applied'
    };
  }

  async batchMatchJobs(jobs, resumeText) {
    const matches = await Promise.all(
      jobs.map(job => this.matchJob(job, resumeText))
    );
    
    return jobs.map((job, index) => ({
      ...job,
      matchScore: matches[index].score,
      matchDetails: {
        matchingSkills: matches[index].matchingSkills,
        relevantExperience: matches[index].relevantExperience,
        keywordAlignment: matches[index].keywordAlignment,
        reasoning: matches[index].reasoning
      }
    }));
  }
}