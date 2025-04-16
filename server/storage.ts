import {
  users, interests, articles, userArticles,
  type User, type InsertUser,
  type Interest, type InsertInterest,
  type Article, type InsertArticle,
  type UserArticle, type InsertUserArticle
} from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, or, desc, sql } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";

const MemoryStore = createMemoryStore(session);
const PostgresStore = connectPgSimple(session);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<Omit<InsertUser, "password">>): Promise<User | undefined>;
  
  // Interest methods
  getInterests(userId: number): Promise<Interest[]>;
  createInterest(interest: InsertInterest): Promise<Interest>;
  updateInterest(id: number, data: Partial<Omit<InsertInterest, "userId">>): Promise<Interest | undefined>;
  deleteInterest(id: number): Promise<boolean>;
  
  // Article methods
  getArticleById(id: number): Promise<Article | undefined>;
  getArticleBySourceId(sourceId: string): Promise<Article | undefined>;
  saveArticle(article: InsertArticle): Promise<Article>;
  
  // Session store
  sessionStore: any; // Type simplification for session store
}

// Database implementation
export class DatabaseStorage implements IStorage {
  sessionStore: any; // Type simplification for session store

  constructor() {
    this.sessionStore = new PostgresStore({
      pool,
      tableName: 'session',
      createTableIfMissing: true
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, data: Partial<Omit<InsertUser, "password">>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Interest methods
  async getInterests(userId: number): Promise<Interest[]> {
    return await db
      .select()
      .from(interests)
      .where(eq(interests.userId, userId))
      .orderBy(interests.name);
  }

  async createInterest(interest: InsertInterest): Promise<Interest> {
    const [newInterest] = await db
      .insert(interests)
      .values(interest)
      .returning();
    return newInterest;
  }

  async updateInterest(id: number, data: Partial<Omit<InsertInterest, "userId">>): Promise<Interest | undefined> {
    const [updatedInterest] = await db
      .update(interests)
      .set(data)
      .where(eq(interests.id, id))
      .returning();
    return updatedInterest;
  }

  async deleteInterest(id: number): Promise<boolean> {
    const result = await db
      .delete(interests)
      .where(eq(interests.id, id));
    return true;
  }

  // Article methods
  async getArticleById(id: number): Promise<Article | undefined> {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.id, id));
    return article;
  }

  async getArticleBySourceId(sourceId: string): Promise<Article | undefined> {
    const [article] = await db
      .select()
      .from(articles)
      .where(eq(articles.sourceId, sourceId));
    return article;
  }

  async saveArticle(article: InsertArticle): Promise<Article> {
    // Check if article already exists by sourceId
    if (article.sourceId) {
      const existingArticle = await this.getArticleBySourceId(article.sourceId);
      if (existingArticle) {
        return existingArticle;
      }
    }

    const [newArticle] = await db
      .insert(articles)
      .values(article)
      .returning();
    return newArticle;
  }
}

// Memory implementation for development
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private interests: Map<number, Interest>;
  private articles: Map<number, Article>;
  private userArticles: Map<number, UserArticle>;
  
  currentUserId: number;
  currentInterestId: number;
  currentArticleId: number;
  currentUserArticleId: number;
  sessionStore: any; // Type simplification for session store

  constructor() {
    this.users = new Map();
    this.interests = new Map();
    this.articles = new Map();
    this.userArticles = new Map();
    
    this.currentUserId = 1;
    this.currentInterestId = 1;
    this.currentArticleId = 1;
    this.currentUserArticleId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      newsApiKey: insertUser.newsApiKey || null,
      geminiApiKey: insertUser.geminiApiKey || null
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<Omit<InsertUser, "password">>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Interest methods
  async getInterests(userId: number): Promise<Interest[]> {
    return Array.from(this.interests.values())
      .filter(interest => interest.userId === userId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async createInterest(interest: InsertInterest): Promise<Interest> {
    const id = this.currentInterestId++;
    const now = new Date();
    const newInterest: Interest = { 
      ...interest, 
      id, 
      createdAt: now,
      active: interest.active !== undefined ? interest.active : true
    };
    this.interests.set(id, newInterest);
    return newInterest;
  }

  async updateInterest(id: number, data: Partial<Omit<InsertInterest, "userId">>): Promise<Interest | undefined> {
    const interest = this.interests.get(id);
    if (!interest) return undefined;
    
    const updatedInterest = { ...interest, ...data };
    this.interests.set(id, updatedInterest);
    return updatedInterest;
  }

  async deleteInterest(id: number): Promise<boolean> {
    return this.interests.delete(id);
  }

  // Article methods
  async getArticleById(id: number): Promise<Article | undefined> {
    return this.articles.get(id);
  }

  async getArticleBySourceId(sourceId: string): Promise<Article | undefined> {
    return Array.from(this.articles.values()).find(
      article => article.sourceId === sourceId
    );
  }

  async saveArticle(article: InsertArticle): Promise<Article> {
    // Check if article already exists by sourceId
    if (article.sourceId) {
      const existingArticle = await this.getArticleBySourceId(article.sourceId);
      if (existingArticle) {
        return existingArticle;
      }
    }

    const id = this.currentArticleId++;
    const newArticle: Article = { 
      id,
      title: article.title,
      description: article.description || null,
      content: article.content || null,
      source: article.source || null,
      sourceId: article.sourceId || null,
      url: article.url || null,
      urlToImage: article.urlToImage || null,
      publishedAt: article.publishedAt || null,
      category: article.category || null,
      summary: article.summary || null
    };
    this.articles.set(id, newArticle);
    return newArticle;
  }
}

// Always use DatabaseStorage to ensure PostgreSQL connection
export const storage = new DatabaseStorage();
