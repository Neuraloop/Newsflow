import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  getTopHeadlines, 
  searchNews, 
  getArticleSummary, 
  getCustomNews 
} from "./api/news";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // News API Routes
  app.get("/api/news/top-headlines", getTopHeadlines);
  app.get("/api/news/search", searchNews);
  app.get("/api/news/article/:id/summary", getArticleSummary);
  app.get("/api/news/custom", getCustomNews);
  
  // Interest Routes
  app.get("/api/interests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const interests = await storage.getInterests(req.user.id);
      res.json(interests);
    } catch (error) {
      console.error("Error fetching interests:", error);
      res.status(500).json({ message: "Failed to fetch interests" });
    }
  });
  
  app.post("/api/interests", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { name } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Interest name is required" });
      }
      
      const newInterest = await storage.createInterest({
        userId: req.user.id,
        name,
        active: true
      });
      
      res.status(201).json(newInterest);
    } catch (error) {
      console.error("Error creating interest:", error);
      res.status(500).json({ message: "Failed to create interest" });
    }
  });
  
  app.put("/api/interests/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const interestId = parseInt(req.params.id);
      const { active, name } = req.body;
      
      const updatedInterest = await storage.updateInterest(interestId, {
        active: active !== undefined ? active : undefined,
        name: name || undefined
      });
      
      if (!updatedInterest) {
        return res.status(404).json({ message: "Interest not found" });
      }
      
      res.json(updatedInterest);
    } catch (error) {
      console.error("Error updating interest:", error);
      res.status(500).json({ message: "Failed to update interest" });
    }
  });
  
  app.delete("/api/interests/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const interestId = parseInt(req.params.id);
      const success = await storage.deleteInterest(interestId);
      
      if (!success) {
        return res.status(404).json({ message: "Interest not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting interest:", error);
      res.status(500).json({ message: "Failed to delete interest" });
    }
  });
  
  // Save article to database
  app.post("/api/articles", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const articleData = req.body;
      
      if (!articleData.title) {
        return res.status(400).json({ message: "Article title is required" });
      }
      
      // Ensure publishedAt is converted to a proper Date if it's a string
      if (articleData.publishedAt && typeof articleData.publishedAt === 'string') {
        try {
          articleData.publishedAt = new Date(articleData.publishedAt);
          
          // Check if date is valid
          if (isNaN(articleData.publishedAt.getTime())) {
            articleData.publishedAt = null;
          }
        } catch (e) {
          articleData.publishedAt = null;
        }
      }
      
      const savedArticle = await storage.saveArticle(articleData);
      res.status(201).json(savedArticle);
    } catch (error) {
      console.error("Error saving article:", error);
      res.status(500).json({ message: "Failed to save article" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
