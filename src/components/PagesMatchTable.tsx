import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Copy, ChevronDown, ChevronUp,
  Calendar, FileText, ShoppingBag, Globe, Tag, Eye, Server, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from 'sonner';
import ImageModal from './ImageModal';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getHostname, getWebsiteName, isCdnUrl, getCdnInfo } from '@/utils/domainUtils';

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
  initialItemsToShow?: number;
}

type GroupedPage = {
  site: string;
  platform: string;
  pages: WebPage[];
  expanded: boolean;
};

const isLikelySpam = (url: string, score: number): boolean => {
  const spamPatterns = [
    'ebb.rs', 'goo.gl', 'bit.ly', 't.co', 'tinyurl.com', 'is.gd',
    'buff.ly', 'adf.ly', 'j.mp', 'ow.ly', 'soo.gd', 'cutt.ly'
  ];
  
  const isShortURL = spamPatterns.some(pattern => url.includes(pattern));
  
  if (isShortURL && score < 0.8) {
    return true;
  }
  
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    if (params.has('ref') || params.has('affiliate') || params.has('e') || 
        params.has('track') || params.has('campaign')) {
      return score < 0.85;
    }
  } catch (e) {
  }
  
  return false;
};

export const PagesMatchTable: React.FC<PagesMatchTableProps> = ({ 
  pages,
  sortBy = 'confidence',
  compact = false,
  initialItemsToShow = 5
}) => {
  const filteredPages = useMemo(() => pages.filter(page => !isLikelySpam(page.url, page.score)), [pages]);
  const spamCount = useMemo(() => pages.length - filteredPages.length, [pages, filteredPages]);
  
  const sortedPages = useMemo(() => {
    let sorted = [...filteredPages];
    
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
        return sorted.sort((a, b) => {
          const countA = a.matchingImages?.length || 0;
          const countB = b.matchingImages?.length || 0;
          return countB - countA;
        });
      default:
        return sorted;
    }
  }, [filteredPages, sortBy]);

  const [visiblePages, setVisiblePages] = useState<WebPage[]>([]);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [groupedState, setGroupedState] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<WebImage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const ITEMS_PER_BATCH = initialItemsToShow;

  // Sort page types in preferred order: category, product, others
  const getPageTypeOrder = (pageType?: string): number => {
    switch(pageType) {
      case 'category': return 1;
      case 'product': return 2;
      case 'search': return 3;
      default: return 4;
    }
  };

  // Sort pages by type within each group
  const sortPagesByType = (pages: WebPage[]): WebPage[] => {
    return [...pages].sort((a, b) => {
      return getPageTypeOrder(a.pageType) - getPageTypeOrder(b.pageType);
    });
  };

  // Initialize visible pages
  useEffect(() => {
    if (sortedPages.length > 0) {
      setVisiblePages(sortedPages.slice(0, initialItemsToShow));
      setHasMorePages(sortedPages.length > initialItemsToShow);
    } else {
      setVisiblePages([]);
      setHasMorePages(false);
    }
  }, [sortedPages, initialItemsToShow]);

  // Initialize group states
  useEffect(() => {
    const initialGroupState: Record<string, boolean> = {};
    visiblePages.forEach(page => {
      const hostname = getHostname(page.url);
      initialGroupState[hostname] = true;  // Default to expanded
    });
    setGroupedState(initialGroupState);
  }, [visiblePages]);

  // Group pages by their actual hostname
  const groupedPages = useMemo(() => {
    // Create a map to store each page by its site (hostname)
    const pagesMap = new Map<string, WebPage[]>();
    
    // Each page gets grouped individually by hostname
    visiblePages.forEach(page => {
      const hostname = getHostname(page.url);
      
      if (!pagesMap.has(hostname)) {
        pagesMap.set(hostname, [page]);
      } else {
        pagesMap.get(hostname)?.push(page);
      }
    });
    
    // Convert the map to an array of grouped pages
    return Array.from(pagesMap.entries()).map(([site, pagesList]) => {
      const platform = pagesList[0].platform || getWebsiteName(pagesList[0].url);
      
      return {
        site: site,
        platform: platform,
        pages: sortPagesByType(pagesList),
        expanded: groupedState[site] ?? true
      };
    });
  }, [visiblePages, groupedState]);

  const loadMorePages = useCallback(() => {
    if (!hasMorePages) return;
    
    const currentLength = visiblePages.length;
    const nextBatch = sortedPages.slice(currentLength, currentLength + ITEMS_PER_BATCH);
    
    if (nextBatch.length === 0) {
      setHasMorePages(false);
      return;
    }
    
    setVisiblePages(prevPages => [...prevPages, ...nextBatch]);
    setHasMorePages(currentLength + nextBatch.length < sortedPages.length);
  }, [visiblePages, sortedPages, hasMorePages, ITEMS_PER_BATCH]);

  // Intersection observer for infinite scrolling
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMorePages) {
          loadMorePages();
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
    };
  }, [loadMorePages, hasMorePages]);

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
      {spamCount > 0 && (
        <Alert className="bg-yellow-50 border-yellow-200 mb-4">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {spamCount} potential spam page{spamCount !== 1 ? 's' : ''} filtered out from results.
          </AlertDescription>
        </Alert>
      )}
      
      {groupedPages.length > 0 ? (
        groupedPages.map((group) => (
          <Collapsible 
            key={group.site} 
            open={groupedState[group.site]} 
            onOpenChange={() => toggleExpand(group.site)}
            className="border rounded-lg overflow-hidden mb-4 shadow-sm"
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
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14"></TableHead>
                      <TableHead className="text-left">Page</TableHead>
                      <TableHead className="text-left">URL</TableHead>
                      <TableHead className="w-24">Type</TableHead>
                      {!compact && <TableHead>Found</TableHead>}
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.pages.map((page, index) => {
                      let cdnInfo = null;
                      let isFromCdn = false;
                      
                      if (page.matchingImages && page.matchingImages.length > 0) {
                        const imageUrl = page.matchingImages[0].url;
                        isFromCdn = isCdnUrl(imageUrl);
                        if (isFromCdn) {
                          cdnInfo = getCdnInfo(imageUrl);
                        }
                      }
                      
                      return (
                        <TableRow key={index} className="group hover:bg-gray-50">
                          <TableCell className="p-2">
                            <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden relative">
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
                                  {page.matchingImages && page.matchingImages.length > 1 && (
                                    <div className="absolute top-0 right-0 bg-brand-blue text-white text-xs font-bold px-1.5 py-0.5 rounded-bl">
                                      {page.matchingImages.length}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  {getPageTypeIcon(page.pageType)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium line-clamp-1 text-left" title={page.pageTitle || getWebsiteName(page.url, page.platform)}>
                              {page.pageTitle || getWebsiteName(page.url, page.platform)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {isFromCdn ? (
                                <span>Image from {cdnInfo}</span>
                              ) : (
                                page.platform !== 'unknown' ? page.platform : getHostname(page.url)
                              )}
                            </div>
                            {page.matchingImages && page.matchingImages.length > 1 && (
                              <div className="text-xs mt-1 text-brand-blue font-medium">
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
                              <div className="text-sm text-muted-foreground">
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))
      ) : (
        <Card className="p-6 text-center">
          <FileText className="mx-auto h-10 w-10 text-brand-blue mb-4" />
          <p className="text-muted-foreground">No pages with matching images found</p>
        </Card>
      )}

      {/* Infinite scroll loading indicator */}
      {hasMorePages && (
        <div ref={loaderRef} className="flex justify-center py-4">
          <div className="w-8 h-8 border-4 border-t-brand-blue border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
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
