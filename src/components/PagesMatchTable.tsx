
import React, { useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Copy, ChevronDown, ChevronUp,
  Calendar, FileText, ShoppingBag, Globe, Tag, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from 'sonner';
import ImageModal from './ImageModal';
import { format } from 'date-fns';

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
  dateFound?: Date;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
  pageType?: 'product' | 'category' | 'search' | 'unknown';
  matchingImages?: WebImage[];
  dateFound?: Date;
}

interface PagesMatchTableProps {
  pages: WebPage[];
  sortBy?: 'confidence' | 'date' | 'domain' | 'count';
  compact?: boolean;
}

type GroupedPage = {
  site: string;
  platform: string;
  pages: WebPage[];
  expanded: boolean;
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

export const PagesMatchTable: React.FC<PagesMatchTableProps> = ({ 
  pages,
  sortBy = 'confidence',
  compact = false 
}) => {
  // Sort pages based on sortBy prop
  const sortedPages = useMemo(() => {
    let sorted = [...pages];
    
    switch(sortBy) {
      case 'confidence':
        return sorted.sort((a, b) => b.score - a.score);
      case 'date':
        return sorted.sort((a, b) => {
          const dateA = a.dateFound || new Date();
          const dateB = b.dateFound || new Date();
          return dateB.getTime() - dateA.getTime();
        });
      case 'domain':
        return sorted.sort((a, b) => {
          const domainA = getHostname(a.url);
          const domainB = getHostname(b.url);
          return domainA.localeCompare(domainB);
        });
      case 'count':
        // Sort by number of matching images
        return sorted.sort((a, b) => {
          const countA = a.matchingImages?.length || 0;
          const countB = b.matchingImages?.length || 0;
          return countB - countA;
        });
      default:
        return sorted;
    }
  }, [pages, sortBy]);

  const [visiblePages, setVisiblePages] = useState<WebPage[]>(sortedPages.slice(0, compact ? 3 : 5));
  const [loadMoreVisible, setLoadMoreVisible] = useState(sortedPages.length > (compact ? 3 : 5));
  const [groupedState, setGroupedState] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<WebImage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Update visible pages when sorting changes
  useMemo(() => {
    setVisiblePages(sortedPages.slice(0, compact ? 3 : 5));
    setLoadMoreVisible(sortedPages.length > (compact ? 3 : 5));
  }, [sortedPages, compact]);

  // Group pages by hostname
  const groupedPages = useMemo(() => {
    const sites = new Map<string, GroupedPage>();
    
    visiblePages.forEach(page => {
      const hostname = getHostname(page.url);
      const platform = page.platform || getWebsiteName(page.url);
      
      if (!sites.has(hostname)) {
        sites.set(hostname, {
          site: hostname,
          platform: platform,
          pages: [page],
          expanded: groupedState[hostname] ?? true
        });
      } else {
        sites.get(hostname)?.pages.push(page);
      }
    });
    
    return Array.from(sites.values());
  }, [visiblePages, groupedState]);

  const getPlatformBadgeColor = (platform?: string): string => {
    if (!platform) return "bg-gray-500 text-white";
    
    switch(platform.toLowerCase()) {
      case "amazon": return "bg-yellow-600 text-white";
      case "ebay": return "bg-blue-600 text-white";
      case "etsy": return "bg-orange-600 text-white";
      case "aliexpress": return "bg-red-600 text-white";
      case "walmart": return "bg-blue-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getPageTypeColor = (pageType?: string): string => {
    switch(pageType) {
      case 'product': return "text-brand-blue";
      case 'category': return "text-green-600";
      case 'search': return "text-purple-600";
      default: return "text-gray-600";
    }
  };

  const loadMore = () => {
    const nextBatchSize = compact ? 3 : 5;
    const nextBatch = sortedPages.slice(visiblePages.length, visiblePages.length + nextBatchSize);
    setVisiblePages(prev => [...prev, ...nextBatch]);
    
    if (visiblePages.length + nextBatchSize >= sortedPages.length) {
      setLoadMoreVisible(false);
    }
  };
  
  // Get page type icon
  const getPageTypeIcon = (pageType?: string) => {
    switch(pageType) {
      case 'product':
        return <ShoppingBag className={`h-4 w-4 ${getPageTypeColor(pageType)}`} />;
      case 'category':
        return <Tag className={`h-4 w-4 ${getPageTypeColor(pageType)}`} />;
      case 'search':
        return <Globe className={`h-4 w-4 ${getPageTypeColor(pageType)}`} />;
      default:
        return <FileText className={`h-4 w-4 ${getPageTypeColor(pageType)}`} />;
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const toggleExpand = (site: string) => {
    setGroupedState(prev => ({
      ...prev,
      [site]: !prev[site]
    }));
  };

  const handleImageClick = (image: WebImage) => {
    setSelectedImage(image);
    setModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {groupedPages.length > 0 ? (
        groupedPages.map((group) => (
          <Collapsible 
            key={group.site} 
            open={groupedState[group.site]} 
            onOpenChange={() => toggleExpand(group.site)}
            className="border rounded-lg overflow-hidden mb-4"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-gray-200 text-gray-800">{group.pages.length}</Badge>
                  <h3 className="text-base font-medium">{group.platform}</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground">({group.site})</span>
                  </div>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <span className="text-sm mr-2">
                    {groupedState[group.site] ? 'Hide pages' : 'Show pages'}
                  </span>
                  {groupedState[group.site] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </div>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14"></TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    {!compact && <TableHead>Found</TableHead>}
                    <TableHead className="w-20 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.pages.map((page, index) => (
                    <TableRow key={index} className="group hover:bg-gray-50">
                      <TableCell className="p-2">
                        <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">
                          {page.matchingImages && page.matchingImages.length > 0 ? (
                            <div 
                              className="w-full h-full cursor-pointer hover:ring-2 hover:ring-brand-blue hover:ring-opacity-50 transition-all"
                              onClick={() => page.matchingImages && handleImageClick(page.matchingImages[0])}
                            >
                              <AspectRatio ratio={1 / 1} className="bg-muted">
                                <img 
                                  src={page.matchingImages[0].imageUrl || page.matchingImages[0].url} 
                                  alt={getWebsiteName(page.url, page.platform)}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).onerror = null;
                                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                                    (e.currentTarget.parentElement as HTMLElement).innerHTML = `
                                      <div class="w-full h-full flex items-center justify-center bg-gray-200">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-gray-400">
                                          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
                                          <circle cx="9" cy="9" r="2"></circle>
                                          <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"></path>
                                        </svg>
                                      </div>`;
                                  }}
                                />
                              </AspectRatio>
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              {getPageTypeIcon(page.pageType)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium line-clamp-1" title={page.pageTitle || getWebsiteName(page.url, page.platform)}>
                          {page.pageTitle || getWebsiteName(page.url, page.platform)}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          {page.platform !== 'unknown' ? page.platform : getHostname(page.url)}
                        </div>
                        {page.matchingImages && page.matchingImages.length > 1 && (
                          <div className="text-xs mt-1 text-brand-blue">
                            {page.matchingImages.length} matching images
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-brand-blue hover:underline">
                          <a href={page.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            {getHostname(page.url)}
                            <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getPageTypeIcon(page.pageType)}
                          <span className="ml-2 text-sm">
                            {page.pageType === 'product' ? 'Product' : 
                            page.pageType === 'category' ? 'Category' : 
                            page.pageType === 'search' ? 'Search' : 'Web Page'}
                          </span>
                        </div>
                      </TableCell>
                      {!compact && (
                        <TableCell>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {page.dateFound 
                              ? format(page.dateFound, 'MMM d, yyyy')
                              : format(new Date(), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            title="View Page"
                            asChild
                          >
                            <a href={page.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </a>
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            title="Copy URL"
                            onClick={() => handleCopyUrl(page.url)}
                          >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CollapsibleContent>
          </Collapsible>
        ))
      ) : (
        <Card className="p-6 text-center">
          <FileText className="mx-auto h-10 w-10 text-brand-blue mb-4" />
          <p className="text-muted-foreground">No pages with matching images found</p>
        </Card>
      )}

      {loadMoreVisible && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={loadMore} 
            variant="outline"
            className="text-brand-blue border-brand-blue"
          >
            Load More Pages
          </Button>
        </div>
      )}
      
      {selectedImage && (
        <ImageModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          imageUrl={selectedImage.imageUrl || selectedImage.url}
          sourceUrl={selectedImage.url}
          siteName={selectedImage.platform || "Unknown Platform"}
          confidence={selectedImage.score}
        />
      )}
    </div>
  );
};
