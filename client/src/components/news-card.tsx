import { NewsArticle } from "@/types/news";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface NewsCardProps {
  article: NewsArticle;
  onClick: () => void;
  interests?: string[];
}

export function NewsCard({ article, onClick, interests }: NewsCardProps) {
  const formattedDate = article.publishedAt 
    ? formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true })
    : "Unknown date";

  const defaultImage = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1170&auto=format&fit=crop";
  
  return (
    <Card 
      className="news-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer dark:bg-neutral-800"
      onClick={onClick}
    >
      <div className="aspect-video w-full overflow-hidden">
        <img 
          src={article.urlToImage || defaultImage} 
          alt={article.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-primary dark:text-primary-light">
            {article.source?.name || "Unknown Source"}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {formattedDate}
          </span>
        </div>
        <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-3 line-clamp-2">
          {article.description || "No description available"}
        </p>
        
        <div className="flex flex-wrap gap-1.5">
          {article.category && (
            <Badge variant="secondary" className="capitalize">
              {article.category}
            </Badge>
          )}
          
          {interests && interests.map(interest => (
            <Badge 
              key={interest} 
              variant="outline" 
              className="bg-primary/10 text-primary border-primary/20"
            >
              {interest}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
