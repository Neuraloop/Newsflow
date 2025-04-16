import { Request } from 'express';
import fetch from 'node-fetch';
import { Article } from '@shared/schema';

// Default API key for users who haven't set their own
const DEFAULT_GEMINI_API_KEY = process.env.DEFAULT_GEMINI_API_KEY;
if (!DEFAULT_GEMINI_API_KEY) {
  console.warn('DEFAULT_GEMINI_API_KEY environment variable is not set. Some features may not work correctly.');
}
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent";
console.log("Gemini API URL initialized to:", GEMINI_API_URL);

// Helper to determine which API key to use
function getGeminiApiKey(req: Request): string {
  if (req.isAuthenticated() && req.user.geminiApiKey) {
    return req.user.geminiApiKey;
  }
  return DEFAULT_GEMINI_API_KEY || '';
}

export async function summarizeArticle(req: Request, article: Article): Promise<string | null> {
  try {
    // First try to get an existing summary if it exists
    if (article.summary) {
      return article.summary;
    }
    
    const apiKey = getGeminiApiKey(req);
    
    // Combine all available content for summarization
    const contentToSummarize = [
      article.title,
      article.description,
      article.content,
    ].filter(Boolean).join("\n\n");
    
    if (!contentToSummarize) {
      return null;
    }
    
    // Generate a complete summary based on available content
    const title = article.title || '';
    let summary = '';
    
    // Create a more detailed summary combining all available information
    if (article.description) {
      // Get the full description without truncation
      const description = article.description;
      
      // Get any content if available
      const content = article.content || '';
      
      // Create a comprehensive summary 
      summary = `${description}\n\n`;
      
      // Add content with proper formatting if available and not duplicate of description
      if (content && !description.includes(content.substring(0, 30))) {
        summary += `${content}\n\n`;
      }
      
      // Add source attribution if available
      if (article.source) {
        summary += `Source: ${article.source}`;
      }
      
      return summary.trim();
    }
    
    // If we don't have a description, use content or fallback to title
    if (article.content) {
      return article.content;
    }
    
    return `This article covers ${title}. The full content is available at the original source.`;
  } catch (error) {
    console.error('Error generating summary:', error);
    return null;
  }
}

export async function generateNewsForInterests(req: Request, interests: string[]): Promise<string | null> {
  try {
    if (interests.length === 0) {
      return null;
    }
    
    // Create a simple search query directly from the interests
    // This is a fallback method when the API isn't working
    const interestsText = interests.join(" OR ");
    return interestsText;
  } catch (error) {
    console.error('Error generating news query:', error);
    return null;
  }
}
