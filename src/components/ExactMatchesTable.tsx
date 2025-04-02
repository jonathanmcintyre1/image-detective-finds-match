
import React, { useState, useMemo } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Download, Flag, Copy, Star, AlertTriangle, ChevronDown, ChevronUp,
  Clock, FileText, Calendar, Shield, ShieldOff
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
  pageType?: 'product' | 'category' | 'unknown';
  matchingImages?: WebImage[];
  dateFound?: Date;
}

interface ExactMatchesTableProps {
  matches: WebImage[];
  relatedPages?: WebPage[];
  sortBy?: 'confidence' | 'date' | 'domain';
  compact?: boolean;
}

type GroupedMatch = {
  site: string;
  platform: string;
  matches: WebImage[];
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

export const ExactMatchesTable: React.FC<ExactMatchesTableProps> = ({ 
  matches, 
  relatedPages = [],
  sortBy = 'confidence',
  compact = false
}) => {
  const [visibleMatches, setVisibleMatches] = useState<WebImage[]>(matches.slice(0, compact ? 3 : 5));
  const [loadMoreVisible, setLoadMoreVisible] = useState(matches.length > (compact ? 3 : 5));
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
      default:
        return sorted;
    }
  }, [matches, sortBy]);

  // Update visible matches when sorting changes
  useMemo(() => {
    setVisibleMatches(sortedMatches.slice(0, compact ? 3 : 5));
    setLoadMoreVisible(sortedMatches.length > (compact ? 3 : 5));
  }, [sortedMatches, compact]);

  // Group visible matches by site
  const groupedMatches = useMemo(() => {
    const sites = new Map<string, GroupedMatch>();
    
    visibleMatches.forEach(match => {
      const hostname = getHostname(match.url);
      const platform = match.platform || getWebsiteName(match.url);
      
      if (!sites.has(hostname)) {
        sites.set(hostname, {
          site: hostname,
          platform: platform,
          matches: [match],
          expanded: groupedState[hostname] ?? true // Default to expanded in this version
        });
      } else {
        sites.get(hostname)?.matches.push(match);
      }
    });
    
    return Array.from(sites.values());
  }, [visibleMatches, groupedState]);

  const loadMore = () => {
    const nextBatchSize = compact ? 3 : 5;
    const nextBatch = sortedMatches.slice(visibleMatches.length, visibleMatches.length + nextBatchSize);
    setVisibleMatches(prev => [...prev, ...nextBatch]);
    
    if (visibleMatches.length + nextBatchSize >= sortedMatches.length) {
      setLoadMoreVisible(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleReportClick = (url: string) => {
    toast.info(`Preparing DMCA takedown for ${getHostname(url)}`, {
      description: "This will guide you through filing a copyright claim"
    });
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

  // Determine if a domain might be an authorized reseller
  const isLikelyAuthorized = (url: string): boolean => {
    const hostname = getHostname(url);
    // This would normally be a check against a user-configured whitelist
    const commonMarketplaces = ['amazon.com', 'walmart.com', 'etsy.com'];
    return commonMarketplaces.some(market => hostname.includes(market));
  };

  return (
    <div className="space-y-4">
      {groupedMatches.length > 0 ? (
        groupedMatches.map((group) => (
          <Collapsible 
            key={group.site} 
            open={groupedState[group.site]} 
            onOpenChange={() => toggleExpand(group.site)}
            className="border rounded-lg overflow-hidden mb-4"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-gray-200 text-gray-800">{group.matches.length}</Badge>
                  <h3 className="text-base font-medium">{group.platform}</h3>
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground">({group.site})</span>
                    {isLikelyAuthorized(group.site) ? (
                      <Badge className="ml-2 bg-green-500 text-white text-xs">Authorized</Badge>
                    ) : (
                      <Badge className="ml-2 bg-red-500 text-white text-xs">Unauthorized</Badge>
                    )}
                  </div>
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
              <div className="px-4 py-2 bg-gray-50 border-b flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  {isLikelyAuthorized(group.site) ? (
                    <div className="flex items-center text-green-600">
                      <Shield className="h-4 w-4 mr-1" />
                      <span className="text-sm">Authorized Reseller</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <ShieldOff className="h-4 w-4 mr-1" />
                      <span className="text-sm">Unauthorized Use</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => toast.info(`Domain ${group.site} added to whitelist`, {
                      description: "This domain will be marked as authorized in future scans"
                    })}
                  >
                    Add to Whitelist
                  </Button>
                  <Button 
                    variant={isLikelyAuthorized(group.site) ? "outline" : "destructive"} 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => {
                      if (isLikelyAuthorized(group.site)) {
                        toast.info(`Contact ${group.site}`, {
                          description: "This appears to be an authorized reseller"
                        });
                      } else {
                        toast.info(`Report all matches from ${group.site}`, {
                          description: "Preparing batch DMCA takedown notices"
                        });
                      }
                    }}
                  >
                    {isLikelyAuthorized(group.site) ? 'Contact' : 'Report All'}
                  </Button>
                </div>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>URL</TableHead>
                    {!compact && <TableHead>Found</TableHead>}
                    <TableHead className="w-24 text-right">Confidence</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.matches.map((match, index) => {
                    const relatedPagesList = findRelatedPages(match.url);
                    
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
                            <div className="font-medium">{getWebsiteName(match.url, match.platform)}</div>
                            <div className="text-xs text-muted-foreground">
                              {match.platform ? `${match.platform} Marketplace` : getHostname(match.url)}
                            </div>
                            {relatedPagesList.length > 0 && (
                              <div className="text-xs mt-1 text-brand-blue">
                                {relatedPagesList.length} related page{relatedPagesList.length !== 1 ? 's' : ''}
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
                            <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end space-x-1 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0" 
                                title="Report"
                                onClick={() => handleReportClick(match.url)}
                              >
                                <Flag className="h-4 w-4 text-muted-foreground" />
                              </Button>
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
                                title="Save"
                                onClick={() => toast.success("Saved for later")}
                              >
                                <Star className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        
                        {relatedPagesList.length > 0 && (
                          <TableRow className="bg-gray-50/50 border-t border-dashed">
                            <TableCell colSpan={compact ? 5 : 6}>
                              <div className="pl-6 py-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Related Pages:</p>
                                <div className="space-y-1">
                                  {relatedPagesList.map((page, pageIdx) => (
                                    <div key={pageIdx} className="flex items-center justify-between text-sm">
                                      <a 
                                        href={page.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-brand-blue hover:underline flex items-center"
                                      >
                                        <span className="truncate max-w-xs">{page.pageTitle || getHostname(page.url)}</span>
                                        <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                                      </a>
                                      <div className="flex items-center space-x-2">
                                        <Badge variant="outline" className="text-xs">
                                          {page.pageType === 'product' ? 'Product' : 'Page'}
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
            </CollapsibleContent>
          </Collapsible>
        ))
      ) : (
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-brand-blue mb-4" />
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
