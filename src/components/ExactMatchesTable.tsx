import React, { useState, useMemo, useCallback } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Copy, ChevronDown, ChevronUp,
  Clock, FileText, Calendar, ShoppingBag, Globe, Tag, Server
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

const getHostname = (url: string): string => {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
};

const isCdnUrl = (url: string): boolean => {
  const cdnPatterns = [
    'cloudfront.net', 'cdn.shopify', 'cloudinary', 'imgix', 
    'fastly', 'akamaized', 'cdn.', 'ibb.co', 'imgur.com',
    'postimg.cc', 'amazonaws.com', 's3.', 'media-amazon.com',
    'staticflickr.com', 'cdninstagram.com', 'fbcdn.net',
    'pinimg.com', 'twimg.com', 'assets.', 'static.'
  ];
  
  const urlLower = url.toLowerCase();
  return cdnPatterns.some(pattern => urlLower.includes(pattern));
};

const getSourceWebsite = (url: string, relatedPages?: WebPage[]): string | null => {
  try {
    if (relatedPages && relatedPages.length) {
      const relatedPage = relatedPages.find(page => 
        page.matchingImages?.some(img => img.url === url || img.imageUrl === url)
      );
      
      if (relatedPage) {
        return relatedPage.platform || getWebsiteName(relatedPage.url);
      }
    }
    
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

const getCdnInfo = (url: string): string => {
  const hostname = getHostname(url);
  
  if (hostname.includes('cloudfront.net')) return 'Amazon CloudFront';
  if (hostname.includes('amazonaws.com') || hostname.includes('s3.')) return 'Amazon S3';
  if (hostname.includes('cdn.shopify')) return 'Shopify CDN';
  if (hostname.includes('cloudinary')) return 'Cloudinary CDN';
  if (hostname.includes('imgix')) return 'Imgix CDN';
  if (hostname.includes('media-amazon')) return 'Amazon Media';
  if (hostname.includes('akamaized')) return 'Akamai CDN';
  if (hostname.includes('staticflickr')) return 'Flickr CDN';
  if (hostname.includes('twimg')) return 'Twitter CDN';
  if (hostname.includes('fbcdn')) return 'Facebook CDN';
  if (hostname.includes('cdninstagram')) return 'Instagram CDN';
  if (hostname.includes('pinimg')) return 'Pinterest CDN';
  
  return hostname;
};

const getWebsiteName = (url: string, platform?: string): string => {
  if (platform) return platform;
  
  const hostname = getHostname(url);
  const domainParts = hostname.split('.');
  if (domainParts.length > 1) {
    return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
  }
  return hostname;
};

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

  useEffect(() => {
    setVisibleMatches(sortedMatches.slice(0, initialItemsToShow));
    setLoadMoreVisible(sortedMatches.length > initialItemsToShow);
  }, [sortedMatches, initialItemsToShow]);

  const groupedMatches = useMemo(() => {
    const sites = new Map<string, GroupedMatch>();
    
    visibleMatches.forEach(match => {
      const hostname = getHostname(match.url);
      const isCdn = isCdnUrl(match.url);
      const sourceWebsite = getSourceWebsite(match.url, relatedPages);
      let platform = match.platform || sourceWebsite || (isCdn ? "CDN Content" : getWebsiteName(match.url));
      
      const cdnInfo = isCdn ? getCdnInfo(match.url) : undefined;
      
      if (!sites.has(hostname)) {
        sites.set(hostname, {
          site: hostname,
          platform: platform,
          matches: [match],
          expanded: groupedState[hostname] ?? true,
          cdnInfo: cdnInfo,
          sourceWebsite: sourceWebsite
        });
      } else {
        const existingGroup = sites.get(hostname);
        if (existingGroup) {
          existingGroup.matches.push(match);
        }
      }
    });
    
    return Array.from(sites.values());
  }, [visibleMatches, groupedState, relatedPages]);

  const loadMore = useCallback(() => {
    const nextBatch = sortedMatches.slice(visibleMatches.length, visibleMatches.length + initialItemsToShow);
    setVisibleMatches(prev => [...prev, ...nextBatch]);
    
    if (visibleMatches.length + initialItemsToShow >= sortedMatches.length) {
      setLoadMoreVisible(false);
    }
  }, [sortedMatches, visibleMatches, initialItemsToShow]);

  const handleCopyUrl = useCallback((url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  }, []);

  const toggleExpand = useCallback((site: string) => {
    setGroupedState(prev => ({
      ...prev,
      [site]: !prev[site]
    }));
  }, []);

  const handleImageClick = useCallback((image: WebImage) => {
    setSelectedImage(image);
    setModalOpen(true);
  }, []);

  const findRelatedPages = useCallback((imageUrl: string): WebPage[] => {
    return relatedPages.filter(page => 
      page.matchingImages?.some(img => 
        img.url === imageUrl || img.imageUrl === imageUrl
      )
    );
  }, [relatedPages]);

  return (
    <div className="space-y-4">
      {groupedMatches.length > 0 ? (
        groupedMatches.map((group) => (
          <Collapsible 
            key={group.site} 
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
                      <TableHead>URL</TableHead>
                      {!compact && <TableHead>Found</TableHead>}
                      <TableHead className="w-24 text-right">Confidence</TableHead>
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
                              {relatedPagesList.length > 0 && (
                                <div className="text-xs mt-1 text-brand-blue">
                                  {relatedPagesList.length} page{relatedPagesList.length !== 1 ? 's' : ''} with this image
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate text-sm text-brand-blue hover:underline">
                                <a href={match.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                  {getHostname(match.url)}
                                  <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                                </a>
                              </div>
                            </TableCell>
                            {!compact && (
                              <TableCell>
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
                                  <Copy className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0" 
                                  title="Visit URL"
                                  asChild
                                >
                                  <a href={match.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
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
                                      <div key={pageIdx} className="flex items-center justify-between text-sm">
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
                                            <span className="text-xs text-muted-foreground">
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
