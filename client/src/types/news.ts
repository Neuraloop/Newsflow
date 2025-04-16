export interface NewsSource {
  id: string | null;
  name: string;
}

export interface NewsArticle {
  source: NewsSource;
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
  category?: string;
  id?: number; // Database ID (if saved)
  sourceId?: string; // ID from API
  summary?: string; // AI-generated summary
}

export interface NewsResponse {
  status: string;
  totalResults: number;
  articles: NewsArticle[];
  code?: string;
  message?: string;
}

export interface CustomNewsResponse extends NewsResponse {
  interests: string[];
  generatedQuery: string;
}

export interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}
