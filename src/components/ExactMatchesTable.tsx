
import React, { useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Copy, ChevronDown, ChevronUp,
  Clock, FileText, Calendar, ShoppingBag, Globe, Tag, Server, Hash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from 'sonner';
import ImageModal from './ImageModal';
import { format } from 'date-fns';
import { getHostname, getWebsiteName, isCdnUrl, getSourceWebsite, getCdnInfo } from '@/utils/domainUtils';

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

interface ExactMatchesTableProps {
  matches: WebImage[];
  relatedPages?: WebPage[];
  sortBy?: 'confidence' | 'date' | 'domain' | 'count';
  compact?: boolean;
  initialItemsToShow?: number;
}

type GroupedMatch = {
  site: string;
  platform: string;
  matches: WebImage[];
  expanded: boolean;
  cdnInfo?: string;
  sourceWebsite?: string;
};

// Function to get actual source website from image URL when possible
const getSourceWebsite = (url: string, relatedPages?: WebPage[]): string | null => {
  try {
    // First, check if there are related pages for this image
    if (relatedPages && relatedPages.length) {
      const relatedPage = relatedPages.find(page => 
        page.matchingImages?.some(img => img.url === url || img.imageUrl === url)
      );
      
      if (relatedPage) {
        return relatedPage.platform || getWebsiteName(relatedPage.url);
      }
    }
    
    // Check for common patterns in image URLs that indicate the source website
    const hostname = getHostname(url);
    
    if (hostname.includes('media-amazon.com')) {
      return 'Amazon';
    } else if (hostname.includes('staticflickr.com')) {
      return 'Flickr';
    } else if (hostname.includes('cdninstagram.com') || hostname.includes('fbcdn.net')) {
      return 'Instagram';
    } else if (hostname.includes('pinimg.com')) {
      return 'Pinterest';
    } else if (hostname.includes('twimg.com')) {
      return 'Twitter';
    } else if (hostname.includes('wikimedia.org')) {
      return 'Wikimedia';
    } else if (hostname.includes('ytimg.com')) {
      return 'YouTube';
    }
    
    return null;
  } catch {
    return null;
  }
};

// Get page type icon
const getPageTypeIcon = (pageType?: string) => {
  switch(pageType) {
    case 'product':
      return <ShoppingBag className="h-4 w-4" />;
    case 'category':
      return <Tag className="h-4 w-4" />;
    case 'search':
      return <Globe className="h-4 w-4" />;
    default:
      return <FileText className="h-4 w-4" />;
  }
};

export const ExactMatchesTable: React.FC<ExactMatchesTableProps> = ({ 
  matches, 
  relatedPages = [],
  sortBy = 'confidence',
  compact = false,
  initialItemsToShow = 5
}) => {
  const [visibleMatches, setVisibleMatches] = useState<WebImage[]>(matches.slice(0, initialItemsToShow));
  const [loadMoreVisible, setLoadMoreVisible] = useState(matches.length > initialItemsToShow);
  const [groupedState, setGroupedState] = useState<Record<string, boolean>>({});
  const [selectedImage, setSelectedImage] = useState<WebImage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Sort matches based on sortBy prop
  const sortedMatches = useMemo(() => {
    let sorted = [...matches];
    
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
        // Sort by number of matches from same domain
        return sorted.sort((a, b) => {
          const hostnameA = getHostname(a.url);
          const hostnameB = getHostname(b.url);
          const countA = matches.filter(m => getHostname(m.url) === hostnameA).length;
          const countB = matches.filter(m => getHostname(m.url) === hostnameB).length;
          return countB - countA;
        });
      default:
        return sorted;
    }
  }, [matches, sortBy]);

  // Update visible matches when sorting changes
  useMemo(() => {
    setVisibleMatches(sortedMatches.slice(0, initialItemsToShow));
    setLoadMoreVisible(sortedMatches.length > initialItemsToShow);
  }, [sortedMatches, initialItemsToShow]);

  // Group visible matches by site - each result is now its own entry
  const groupedMatches = useMemo(() => {
    return visibleMatches.map(match => {
      const hostname = getHostname(match.url);
      const isCdn = isCdnUrl(match.url);
      const sourceWebsite = getSourceWebsite(match.url, relatedPages);
      let platform = match.platform || sourceWebsite || getWebsiteName(match.url);
      
      // If this is a CDN URL, try to identify the actual site
      const cdnInfo = isCdn ? getCdnInfo(match.url) : undefined;
      
      // Set default expanded state if not already set
      if (groupedState[hostname] === undefined) {
        groupedState[hostname] = true;
      }
      
      return {
        site: hostname,
        platform,
        matches: [match],
        expanded: groupedState[hostname] ?? true,
        cdnInfo,
        sourceWebsite
      };
    });
  }, [visibleMatches, groupedState, relatedPages]);

  const loadMore = () => {
    const nextBatch = sortedMatches.slice(visibleMatches.length, visibleMatches.length + initialItemsToShow);
    setVisibleMatches(prev => [...prev, ...nextBatch]);
    
    if (visibleMatches.length + initialItemsToShow >= sortedMatches.length) {
      setLoadMoreVisible(false);
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

  const findRelatedPages = (imageUrl: string): WebPage[] => {
    return relatedPages.filter(page => 
      page.matchingImages?.some(img => 
        img.url === imageUrl || img.imageUrl === imageUrl
      )
    );
  };

  return (
    <div className="space-y-4">
      {groupedMatches.length > 0 ? (
        groupedMatches.map((group, groupIndex) => (
          <Collapsible 
            key={`${group.site}-${groupIndex}`} 
            open={groupedState[group.site]} 
            onOpenChange={() => toggleExpand(group.site)}
            className="border rounded-lg overflow-hidden mb-4 shadow-sm"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-gray-200 text-gray-800">{group.matches.length}</Badge>
                  <h3 className="text-base font-medium">
                    {group.platform}
                    {group.cdnInfo && (
                      <span className="text-xs text-muted-foreground ml-2">
                        (hosted on {group.cdnInfo})
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <span className="text-sm mr-2">
                    {groupedState[group.site] ? 'Hide matches' : 'Show matches'}
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
                      <TableHead className="w-16">Image</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead className="hidden md:table-cell">URL</TableHead>
                      {!compact && <TableHead className="hidden md:table-cell">Found</TableHead>}
                      <TableHead className="w-24 text-right">Score</TableHead>
                      <TableHead className="w-20 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.matches.map((match, index) => {
                      const relatedPagesList = findRelatedPages(match.url);
                      const isImageFromCdn = isCdnUrl(match.url);
                      const realSourceWebsite = getSourceWebsite(match.url, relatedPages);
                      const cdnInfo = isImageFromCdn ? getCdnInfo(match.url) : null;
                      
                      return (
                        <React.Fragment key={index}>
                          <TableRow className="group hover:bg-gray-50">
                            <TableCell className="p-2">
                              <div 
                                className="w-14 h-14 bg-gray-100 rounded overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-blue hover:ring-opacity-50 transition-all"
                                onClick={() => handleImageClick(match)}
                              >
                                {match.imageUrl && (
                                  <AspectRatio ratio={1 / 1} className="bg-muted">
                                    <img 
                                      src={match.imageUrl} 
                                      alt="Matched image" 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).onerror = null;
                                        (e.currentTarget as HTMLImageElement).src = '/placeholder.svg';
                                      }}
                                    />
                                  </AspectRatio>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium flex items-center">
                                {realSourceWebsite || match.platform || getWebsiteName(match.url)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {isImageFromCdn ? (
                                  <span className="flex items-center">
                                    <Server className="h-3 w-3 mr-1 text-gray-400" />
                                    <span className="font-mono">Image hosted on {cdnInfo}</span>
                                  </span>
                                ) : (
                                  getHostname(match.url)
                                )}
                              </div>
                              <div className="md:hidden text-xs mt-1 text-brand-blue underline">
                                <a href={match.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                  View URL
                                  <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                                </a>
                              </div>
                              {relatedPagesList.length > 0 && (
                                <div className="text-xs mt-1 text-brand-blue">
                                  {relatedPagesList.length} page{relatedPagesList.length !== 1 ? 's' : ''} with this image
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <div className="max-w-xs truncate text-sm text-brand-blue hover:underline">
                                <a href={match.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                  {getHostname(match.url)}
                                  <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                                </a>
                              </div>
                            </TableCell>
                            {!compact && (
                              <TableCell className="hidden md:table-cell">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {match.dateFound 
                                    ? format(match.dateFound, 'MMM d, yyyy')
                                    : format(new Date(), 'MMM d, yyyy')}
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="text-right">
                              <Badge className={`${match.score >= 0.9 ? 'bg-brand-red' : 'bg-amber-500'} text-white`}>
                                {Math.round(match.score * 100)}%
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0" 
                                  title="Copy URL"
                                  onClick={() => handleCopyUrl(match.url)}
                                >
                                  <Copy className="h-4 w-4 text-gray-600" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0" 
                                  title="Visit URL"
                                  asChild
                                >
                                  <a href={match.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 text-gray-600" />
                                  </a>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          
                          {relatedPagesList.length > 0 && (
                            <TableRow className="bg-gray-50/50 border-t border-dashed">
                              <TableCell colSpan={compact ? 5 : 6}>
                                <div className="pl-6 py-2">
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Pages with Image:</p>
                                  <div className="space-y-1">
                                    {relatedPagesList.map((page, pageIdx) => (
                                      <div key={pageIdx} className="flex items-center justify-between text-sm flex-wrap gap-1">
                                        <a 
                                          href={page.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-brand-blue hover:underline flex items-center"
                                        >
                                          <span className="truncate max-w-xs">{page.pageTitle || getWebsiteName(page.url)}</span>
                                          <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                                        </a>
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                                            {getPageTypeIcon(page.pageType)}
                                            <span>{page.pageType === 'product' ? 'Product' : 
                                                  page.pageType === 'category' ? 'Category' : 
                                                  page.pageType === 'search' ? 'Search' : 'Page'}</span>
                                          </Badge>
                                          {!compact && page.dateFound && (
                                            <span className="text-xs text-muted-foreground hidden md:inline">
                                              {format(page.dateFound, 'MMM d, yyyy')}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
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
          <p className="text-muted-foreground">No image matches found</p>
        </Card>
      )}

      {loadMoreVisible && (
        <div className="flex justify-center mt-6">
          <Button 
            onClick={loadMore} 
            variant="outline" 
            className="text-brand-blue border-brand-blue"
          >
            Show More Results
          </Button>
        </div>
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
