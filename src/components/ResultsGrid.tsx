
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { ExternalLink, Copy, Info, CheckCircle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import ImageModal from './ImageModal';

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
  dateFound?: Date;
}

interface ResultsGridProps {
  matches: WebImage[];
  onMarkAsReviewed?: (url: string) => void;
  onToggleSave?: (url: string) => void;
  savedItems?: string[];
  reviewedItems?: string[];
}

export const ResultsGrid: React.FC<ResultsGridProps> = ({
  matches,
  onMarkAsReviewed,
  onToggleSave,
  savedItems = [],
  reviewedItems = []
}) => {
  const isMobile = useIsMobile();
  const [selectedImage, setSelectedImage] = useState<WebImage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCopyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleImageClick = (image: WebImage) => {
    setSelectedImage(image);
    setModalOpen(true);
  };

  const handleMarkAsReviewed = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMarkAsReviewed) {
      onMarkAsReviewed(url);
      toast.success("Marked as reviewed");
    }
  };
  
  const handleToggleSave = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(url);
      const isSaved = savedItems.includes(url);
      toast.success(isSaved ? "Removed from saved items" : "Added to saved items");
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.9) return "bg-brand-red text-white";
    if (score >= 0.8) return "bg-amber-500 text-white";
    if (score >= 0.7) return "bg-amber-400 text-white";
    return "bg-blue-500 text-white";
  };
  
  // Function to get hostname from URL
  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Function to get website name from hostname
  const getWebsiteName = (url: string, platform?: string): string => {
    if (platform) return platform;
    
    const hostname = getHostname(url);
    const domainParts = hostname.split('.');
    if (domainParts.length > 1) {
      return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
    }
    return hostname;
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
        {matches.map((match, index) => {
          const isReviewed = reviewedItems.includes(match.url);
          const isSaved = savedItems.includes(match.url);
          
          return (
            <Card 
              key={index} 
              className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                isReviewed ? 'border-green-200' : isSaved ? 'border-amber-200' : ''
              }`}
              onClick={() => handleImageClick(match)}
            >
              <div className="relative">
                <AspectRatio ratio={1} className="bg-gray-100">
                  <img 
                    src={match.imageUrl || match.url} 
                    alt={`Match ${index + 1}`}
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/placeholder.svg';
                    }}
                  />
                </AspectRatio>
                <div className="absolute top-2 right-2 flex flex-col gap-1">
                  <Badge 
                    className={`${getConfidenceColor(match.score)} text-[10px]`}
                  >
                    {Math.round(match.score * 100)}%
                  </Badge>
                </div>
                {isReviewed && (
                  <div className="absolute bottom-2 right-2">
                    <Badge className="bg-green-100 text-green-800 border border-green-200">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Reviewed
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-2 space-y-1">
                <div className="text-xs font-medium truncate" title={getWebsiteName(match.url, match.platform)}>
                  {getWebsiteName(match.url, match.platform)}
                </div>
                <div className="text-[10px] text-muted-foreground truncate" title={getHostname(match.url)}>
                  {getHostname(match.url)}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleCopyUrl(match.url, e)}
                      title="Copy URL"
                    >
                      <Copy className="h-3 w-3 text-gray-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleToggleSave(match.url, e)}
                      title={isSaved ? "Remove from saved" : "Save"}
                    >
                      <Star className={`h-3 w-3 ${isSaved ? 'text-amber-500 fill-amber-500' : 'text-gray-500'}`} />
                    </Button>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      asChild
                    >
                      <a href={match.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                        <ExternalLink className="h-3 w-3 text-gray-500" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={(e) => handleMarkAsReviewed(match.url, e)}
                      title="Mark as reviewed"
                    >
                      <CheckCircle className={`h-3 w-3 ${isReviewed ? 'text-green-500' : 'text-gray-500'}`} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {matches.length === 0 && (
        <Card className="p-6 text-center">
          <Info className="mx-auto h-10 w-10 text-gray-400 mb-2" />
          <p className="text-muted-foreground">No matches found</p>
        </Card>
      )}
      
      {selectedImage && (
        <ImageModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          imageUrl={selectedImage.imageUrl || selectedImage.url}
          sourceUrl={selectedImage.url}
          siteName={selectedImage.platform || getWebsiteName(selectedImage.url)}
          confidence={selectedImage.score}
        />
      )}
    </div>
  );
};

export default ResultsGrid;
