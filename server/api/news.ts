import { Request, Response } from 'express';
import fetch from 'node-fetch';
import { storage } from '../storage';
import { summarizeArticle, generateNewsForInterests } from './gemini';

// Default API key for users who haven't set their own
const DEFAULT_NEWS_API_KEY = process.env.DEFAULT_NEWS_API_KEY;
if (!DEFAULT_NEWS_API_KEY) {
  console.warn('DEFAULT_NEWS_API_KEY environment variable is not set. Some features may not work correctly.');
}
const NEWS_API_BASE_URL = "https://newsapi.org/v2";

// Helper to determine which API key to use
function getNewsApiKey(req: Request): string {
  if (req.isAuthenticated() && req.user.newsApiKey) {
    return req.user.newsApiKey;
  }
  return DEFAULT_NEWS_API_KEY || '';
}

export async function getTopHeadlines(req: Request, res: Response) {
  try {
    const apiKey = getNewsApiKey(req);
    const category = req.query.category?.toString() || '';
    const page = parseInt(req.query.page?.toString() || '1');
    const pageSize = parseInt(req.query.pageSize?.toString() || '10');
    
    const url = `${NEWS_API_BASE_URL}/top-headlines?country=us&page=${page}&pageSize=${pageSize}${category ? `&category=${category}` : ''}`;
    
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        message: `News API error: ${errorText}` 
      });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching top headlines:', error);
    res.status(500).json({ message: 'Failed to fetch news' });
  }
}

export async function searchNews(req: Request, res: Response) {
  try {
    const apiKey = getNewsApiKey(req);
    const query = req.query.q?.toString() || '';
    const page = parseInt(req.query.page?.toString() || '1');
    const pageSize = parseInt(req.query.pageSize?.toString() || '10');
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    const url = `${NEWS_API_BASE_URL}/everything?q=${query}&page=${page}&pageSize=${pageSize}&language=en&sortBy=relevancy`;
    
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        message: `News API error: ${errorText}` 
      });
    }
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error searching news:', error);
    res.status(500).json({ message: 'Failed to search news' });
  }
}

export async function getArticleSummary(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const articleId = req.params.id;
    const article = await storage.getArticleById(parseInt(articleId));
    
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    if (article.summary) {
      return res.json({ summary: article.summary });
    }
    
    const summary = await summarizeArticle(req, article);
    
    if (!summary) {
      return res.status(500).json({ message: 'Failed to generate summary' });
    }
    
    // Update the article with the summary
    const updatedArticle = await storage.saveArticle({
      ...article,
      summary
    });
    
    res.json({ summary });
  } catch (error) {
    console.error('Error getting article summary:', error);
    res.status(500).json({ message: 'Failed to get article summary' });
  }
}

export async function getCustomNews(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const userId = req.user.id;
    const interests = await storage.getInterests(userId);
    
    // Filter active interests
    const activeInterests = interests.filter(interest => interest.active);
    
    if (activeInterests.length === 0) {
      return res.status(404).json({ 
        message: 'No active interests found. Add interests to see personalized news.' 
      });
    }
    
    // Use Gemini to generate news query for user's interests
    const interestNames = activeInterests.map(i => i.name);
    const searchQuery = await generateNewsForInterests(req, interestNames);
    
    if (!searchQuery) {
      return res.status(500).json({ message: 'Failed to generate news for interests' });
    }
    
    // Use the generated query to search news
    const apiKey = getNewsApiKey(req);
    const page = parseInt(req.query.page?.toString() || '1');
    const pageSize = parseInt(req.query.pageSize?.toString() || '10');
    
    const url = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(searchQuery)}&page=${page}&pageSize=${pageSize}&language=en&sortBy=relevancy`;
    
    const response = await fetch(url, {
      headers: {
        'X-Api-Key': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ 
        message: `News API error: ${errorText}` 
      });
    }
    
    const data = await response.json();
    
    // Attach the interests to the response
    const newsData = data as any;
    res.json({
      ...newsData,
      interests: interestNames,
      generatedQuery: searchQuery
    });
  } catch (error) {
    console.error('Error fetching custom news:', error);
    res.status(500).json({ message: 'Failed to fetch custom news' });
  }
}
