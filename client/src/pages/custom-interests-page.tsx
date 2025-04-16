import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { NewsCard } from "@/components/news-card";
import { ArticleDialog } from "@/components/article-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { InterestTag } from "@/components/interest-tag";
import { AddInterestDialog } from "@/components/add-interest-dialog";
import { NewsArticle, CustomNewsResponse } from "@/types/news";
import { Interest } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CustomInterestsPage() {
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addInterestDialogOpen, setAddInterestDialogOpen] = useState(false);
  // Add state to store all articles across paginations
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);

  // Fetch user interests
  const { data: interests = [] } = useQuery<Interest[]>({
    queryKey: ["/api/interests"],
  });

  // Fetch news based on interests
  const { 
    data: customNews, 
    isLoading, 
    isError, 
    error,
    refetch
  } = useQuery<CustomNewsResponse>({
    queryKey: [`/api/news/custom?page=${currentPage}`],
    staleTime: 60000 // 1 minute
  });
  
  // Handle errors
  useEffect(() => {
    if (error) {
      toast({
        title: "Error loading custom news",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [error, toast]);
  
  // Handle data updates
  useEffect(() => {
    if (customNews?.articles) {
      // Append new articles to existing ones instead of replacing
      setAllArticles(prev => {
        // Create a unique set of articles based on URL to avoid duplicates
        const existingUrls = new Set(prev.map(article => article.url));
        // Add category to each article
        const articlesWithCategory = customNews.articles.map(article => ({
          ...article,
          category: "custom"
        }));
        // Filter out duplicates
        const uniqueNewArticles = articlesWithCategory.filter(article => 
          !existingUrls.has(article.url)
        );
        return [...prev, ...uniqueNewArticles];
      });
    }
  }, [customNews]);

  const saveArticleMutation = useMutation({
    mutationFn: async (article: NewsArticle) => {
      // Prepare article for saving
      const articleToSave = {
        title: article.title,
        description: article.description || null,
        content: article.content || null,
        source: article.source?.name || null,
        sourceId: article.source?.id || article.url,
        url: article.url,
        urlToImage: article.urlToImage || null,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
        category: "custom",
      };
      
      const res = await apiRequest("POST", "/api/articles", articleToSave);
      return res.json();
    },
  });

  const handleArticleClick = async (article: NewsArticle) => {
    try {
      const savedArticle = await saveArticleMutation.mutateAsync(article);
      setSelectedArticle({ 
        ...article, 
        id: savedArticle.id, 
        summary: savedArticle.summary,
        category: "custom" 
      });
      setDialogOpen(true);
    } catch (error) {
      console.error("Failed to save article:", error);
      setSelectedArticle({ ...article, category: "custom" });
      setDialogOpen(true);
    }
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/news/custom"] });
    setCurrentPage(1);
  };

  // Check if user has active interests
  const hasActiveInterests = interests.some(interest => interest.active);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            My Custom Interests
          </h1>
          <Button onClick={() => setAddInterestDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Interest
          </Button>
        </div>
        
        {/* User Interests */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-50 mb-3">
            Your interests:
          </h2>
          <div className="flex flex-wrap gap-2">
            {interests.length > 0 ? (
              interests.map(interest => (
                <InterestTag key={interest.id} interest={interest} />
              ))
            ) : (
              <div className="text-neutral-500 dark:text-neutral-400 text-sm italic">
                No interests added yet. Add some to personalize your feed!
              </div>
            )}
          </div>
          
          {interests.length > 0 && (
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                Refresh News
              </Button>
            </div>
          )}
        </div>
        
        {/* News Content */}
        {isLoading && currentPage === 1 ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-neutral-600 dark:text-neutral-400">
              Loading personalized news...
            </span>
          </div>
        ) : isError || !hasActiveInterests ? (
          <div className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="h-12 w-12 text-neutral-400 mb-4">
                {!hasActiveInterests ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {!hasActiveInterests 
                  ? "No active interests found" 
                  : "Failed to load custom news"}
              </h3>
              
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                {!hasActiveInterests 
                  ? "Add some interests or activate existing ones to see personalized news." 
                  : error?.message || "Try refreshing or check back later."}
              </p>
              
              {!hasActiveInterests && (
                <Button 
                  onClick={() => setAddInterestDialogOpen(true)}
                  className="mt-4"
                >
                  Add Interest
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {customNews?.generatedQuery && (
              <div className="mb-6 p-4 bg-primary/10 rounded-md border border-primary/20">
                <p className="text-sm text-primary font-medium">
                  AI-generated query: "{customNews.generatedQuery}"
                </p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allArticles.map((article, index) => (
                <NewsCard 
                  key={`${article.title}-${index}`}
                  article={article}
                  onClick={() => handleArticleClick(article)}
                  interests={customNews?.interests || []}
                />
              ))}
            </div>
            
            {allArticles.length === 0 && (
              <div className="text-center py-10">
                <p className="text-neutral-600 dark:text-neutral-400">
                  No news articles found matching your interests. Try adding different interests or check back later.
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
                    "Load More"
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
      
      <AddInterestDialog 
        open={addInterestDialogOpen}
        onOpenChange={setAddInterestDialogOpen}
      />
    </div>
  );
}
