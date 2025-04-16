import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { NewsCard } from "@/components/news-card";
import { ArticleDialog } from "@/components/article-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { NewsArticle, NewsResponse } from "@/types/news";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";

export default function HomePage() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // Add state to store all articles across paginations
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [`/api/news/top-headlines?page=${currentPage}`],
    staleTime: 60000, // 1 minute,
  });

  // Handle data updates separately - React 18 style
  useEffect(() => {
    if (data && typeof data === 'object' && 'articles' in data) {
      const newsData = data as NewsResponse;
      // Append new articles to existing ones instead of replacing
      setAllArticles(prev => {
        // Create a unique set of articles based on URL to avoid duplicates
        const existingUrls = new Set(prev.map(article => article.url));
        const uniqueNewArticles = newsData.articles.filter(article => !existingUrls.has(article.url));
        return [...prev, ...uniqueNewArticles];
      });
    }
  }, [data]);

  const saveArticleMutation = useMutation({
    mutationFn: async (article: NewsArticle) => {
      // Prepare article for saving
      const articleToSave = {
        title: article.title,
        description: article.description || null,
        content: article.content || null,
        source: article.source?.name || null,
        sourceId: article.source?.id || article.url, // Use source ID or URL as fallback
        url: article.url,
        urlToImage: article.urlToImage || null,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
        category: article.category || null,
      };
      
      const res = await apiRequest("POST", "/api/articles", articleToSave);
      return res.json();
    },
  });

  const handleArticleClick = async (article: NewsArticle) => {
    // Only save the article if user is logged in
    if (user) {
      try {
        const savedArticle = await saveArticleMutation.mutateAsync(article);
        // Update with the database ID and any summary that might have been retrieved
        setSelectedArticle({ ...article, id: savedArticle.id, summary: savedArticle.summary });
      } catch (error) {
        console.error("Failed to save article:", error);
        setSelectedArticle(article);
      }
    } else {
      setSelectedArticle(article);
    }
    
    setDialogOpen(true);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-6">
          Today's Top Stories
        </h1>
        
        {isLoading && currentPage === 1 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">
              Loading news...
            </span>
          </div>
        ) : isError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-md">
            <p className="text-red-800 dark:text-red-200">
              Error loading news: {error?.message || "Something went wrong"}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allArticles.map((article, index) => (
                <NewsCard 
                  key={`${article.title}-${index}`}
                  article={article}
                  onClick={() => handleArticleClick(article)}
                />
              ))}
            </div>
            
            {allArticles.length === 0 && (
              <div className="text-center py-10">
                <p className="text-neutral-600 dark:text-neutral-400">
                  No news articles found. Try checking back later.
                </p>
              </div>
            )}
            
            {allArticles.length > 0 && (
              <div className="mt-8 flex justify-center">
                <Button 
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading && currentPage > 1 ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Load More Stories"
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </main>
      
      <ArticleDialog 
        article={selectedArticle}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  );
}
