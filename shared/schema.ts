import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  newsApiKey: text("news_api_key"),
  geminiApiKey: text("gemini_api_key"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  source: text("source"),
  sourceId: text("source_id"),
  url: text("url"),
  urlToImage: text("url_to_image"),
  publishedAt: timestamp("published_at"),
  category: text("category"),
  summary: text("summary"),
});

export const userArticles = pgTable("user_articles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  articleId: integer("article_id").notNull().references(() => articles.id, { onDelete: "cascade" }),
  read: boolean("read").default(false).notNull(),
  saved: boolean("saved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert Schema definitions
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  newsApiKey: true,
  geminiApiKey: true,
});

export const insertInterestSchema = createInsertSchema(interests).pick({
  userId: true,
  name: true,
  active: true,
});

export const insertArticleSchema = createInsertSchema(articles);

export const insertUserArticleSchema = createInsertSchema(userArticles).pick({
  userId: true,
  articleId: true,
  read: true,
  saved: true,
});

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type Interest = typeof interests.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

export type InsertUserArticle = z.infer<typeof insertUserArticleSchema>;
export type UserArticle = typeof userArticles.$inferSelect;
