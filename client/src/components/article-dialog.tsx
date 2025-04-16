import { NewsArticle } from "@/types/news";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ArticleDialogProps {
  article: NewsArticle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ArticleDialog({ article, open, onOpenChange }: ArticleDialogProps) {
  // Skip the request if no article or already has summary
  const fetchSummary = open && article && article.id && !article.summary;

  const { data, isLoading } = useQuery({
    queryKey: [`/api/news/article/${article?.id}/summary`],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/news/article/${article?.id}/summary`);
      return res.json();
    },
    enabled: fetchSummary,
  });

  if (!article) return null;

  const formattedDate = article.publishedAt 
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    : "Unknown date";

  const summary = data?.summary || article.summary;
  const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1170&auto=format&fit=crop";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <Badge className="px-2 py-1 bg-primary text-white">
              {article.source?.name || "Unknown Source"}
            </Badge>
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              {formattedDate}
            </span>
          </div>
          <DialogTitle className="text-2xl mt-2">{article.title}</DialogTitle>
        </DialogHeader>

        <div className="my-4">
          <img 
            src={article.urlToImage || defaultImage} 
            alt={article.title} 
            className="w-full h-64 object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            AI-Generated Summary
          </h3>
          <div className="bg-neutral-50 dark:bg-neutral-700 p-4 rounded-md border border-neutral-200 dark:border-neutral-600">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-neutral-600 dark:text-neutral-300">
                  Generating summary...
                </span>
              </div>
            ) : summary ? (
              <div className="text-neutral-700 dark:text-neutral-200 whitespace-pre-line">
                {summary.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 dark:text-neutral-400 italic">
                Sorry, could not generate a summary for this article.
              </p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-2">
            Article Content
          </h3>
          <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">
            {article.content || article.description || "No content available"}
          </p>
        </div>

        <DialogFooter className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Want to read more? 
          </p>
          <Button asChild variant="outline">
            <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
              Visit Original Source
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
