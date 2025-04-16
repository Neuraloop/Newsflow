import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { NewsCard } from "@/components/news-card";
import { ArticleDialog } from "@/components/article-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Newspaper, Monitor, Activity, Globe } from "lucide-react";
import { NewsArticle, NewsResponse, Category } from "@/types/news";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";

export default function CategoryPage() {
  const { category } = useParams<{ category: string }>();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Define our categories with icons
  const categories: Category[] = [
    { id: "technology", name: "Technology", icon: Monitor },
    { id: "sports", name: "Sports", icon: Activity },
    { id: "general", name: "General", icon: Globe },
  ];

  // Find current category
  const currentCategory = categories.find(c => c.id === category) || {
    id: category || "",
    name: category ? category.charAt(0).toUpperCase() + category.slice(1) : "",
    icon: Newspaper
  };

  const { data, isLoading, isError, error } = useQuery<NewsResponse>({
    queryKey: [`/api/news/top-headlines?category=${category}&page=${currentPage}`],
    keepPreviousData: true,
  });

  const saveArticleMutation = useMutation({
    mutationFn: async (article: NewsArticle) => {
      // Prepare article for saving with category
      const articleToSave = {
        title: article.title,
        description: article.description || null,
        content: article.content || null,
        source: article.source?.name || null,
        sourceId: article.source?.id || article.url,
        url: article.url,
        urlToImage: article.urlToImage || null,
        publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
        category: category || null,
      };
      
      const res = await apiRequest("POST", "/api/articles", articleToSave);
      return res.json();
    },
  });

  const handleArticleClick = async (article: NewsArticle) => {
    // Add category to the article
    const articleWithCategory = { ...article, category };
    
    // Only save the article if user is logged in
    if (user) {
      try {
        const savedArticle = await saveArticleMutation.mutateAsync(articleWithCategory);
        setSelectedArticle({ 
          ...articleWithCategory, 
          id: savedArticle.id, 
          summary: savedArticle.summary 
        });
      } catch (error) {
        console.error("Failed to save article:", error);
        setSelectedArticle(articleWithCategory);
      }
    } else {
      setSelectedArticle(articleWithCategory);
    }
    
    setDialogOpen(true);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  // Dynamically create icon
  const CategoryIcon = currentCategory.icon;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <CategoryIcon className="h-8 w-8 mr-2 text-primary" />
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
            {currentCategory.name} News
          </h1>
        </div>
        
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
              {data?.articles.map((article, index) => (
                <NewsCard 
                  key={`${article.title}-${index}`}
                  article={{ ...article, category }}
                  onClick={() => handleArticleClick(article)}
                />
              ))}
            </div>
            
            {data?.articles.length === 0 && (
              <div className="text-center py-10">
                <p className="text-neutral-600 dark:text-neutral-400">
                  No news articles found for this category. Try checking back later.
                </p>
              </div>
            )}
            
            {data?.articles.length && data.articles.length > 0 && (
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
    </div>
  );
}
