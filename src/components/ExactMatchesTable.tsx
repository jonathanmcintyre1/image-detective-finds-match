
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Copy, ChevronDown, ChevronUp,
  Clock, Calendar, Server, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from 'sonner';
import ImageModal from './ImageModal';
import { format } from 'date-fns';
import { getHostname, getWebsiteName, isCdnUrl, getCdnInfo } from '@/utils/domainUtils';

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
  dateFound?: Date;
  pageUrl?: string;
  pageTitle?: string;
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

export const ExactMatchesTable: React.FC<ExactMatchesTableProps> = ({ 
  matches, 
  relatedPages = [],
  sortBy = 'confidence',
  compact = false,
  initialItemsToShow = 5
}) => {
  const [visibleMatches, setVisibleMatches] = useState<WebImage[]>(matches.slice(0, initialItemsToShow));
  const [loadMoreVisible, setLoadMoreVisible] = useState(matches.length > initialItemsToShow);
  const [selectedImage, setSelectedImage] = useState<WebImage | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});

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

  // Group matches strictly by domain for display
  const groupedMatches = useMemo(() => {
    // Create a map to group matches by domain
    const domainMap = new Map<string, WebImage[]>();
    
    sortedMatches.forEach(match => {
      const domain = getHostname(match.url);
      
      if (!domainMap.has(domain)) {
        domainMap.set(domain, [match]);
      } else {
        domainMap.get(domain)?.push(match);
      }
    });
    
    // Convert the map to an array for rendering
    return Array.from(domainMap.entries()).map(([domain, images]) => ({
      domain,
      images,
      count: images.length,
      platform: images[0]?.platform || getWebsiteName(domain)
    }));
  }, [sortedMatches]);

  // Update visible matches when sorting changes
  useEffect(() => {
    // Initialize all domains as expanded
    const initialExpandState: Record<string, boolean> = {};
    groupedMatches.forEach(group => {
      initialExpandState[group.domain] = true;
    });
    setExpandedDomains(initialExpandState);
    
    setLoadMoreVisible(groupedMatches.length > initialItemsToShow);
  }, [groupedMatches, initialItemsToShow]);

  const visibleGroups = useMemo(() => {
    return groupedMatches.slice(0, visibleMatches.length);
  }, [groupedMatches, visibleMatches.length]);

  const loadMore = () => {
    const newVisibleCount = Math.min(visibleMatches.length + initialItemsToShow, sortedMatches.length);
    setVisibleMatches(sortedMatches.slice(0, newVisibleCount));
    
    if (newVisibleCount >= sortedMatches.length) {
      setLoadMoreVisible(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleImageClick = (image: WebImage) => {
    setSelectedImage(image);
    setModalOpen(true);
  };

  const toggleDomainExpand = (domain: string) => {
    setExpandedDomains(prev => ({
      ...prev,
      [domain]: !prev[domain]
    }));
  };

  // Find associated page for an image URL
  const findPageForImage = (imageUrl: string): WebPage | undefined => {
    return relatedPages.find(page => 
      page.matchingImages?.some(img => 
        img.url === imageUrl || img.imageUrl === imageUrl
      )
    );
  };

  return (
    <div className="space-y-4">
      {groupedMatches.length > 0 ? (
        <>
          {visibleGroups.map((group, groupIndex) => (
            <Collapsible 
              key={`${group.domain}-${groupIndex}`}
              open={expandedDomains[group.domain] ?? true}
              onOpenChange={() => toggleDomainExpand(group.domain)}
              className="border rounded-lg overflow-hidden mb-4 shadow-sm"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer hover:bg-gray-100">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-gray-200 text-gray-800">{group.count}</Badge>
                    <h3 className="text-base font-medium">{group.platform}</h3>
                    <div className="flex items-center">
                      <span className="text-sm text-muted-foreground">({group.domain})</span>
                    </div>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <span className="text-sm mr-2">
                      {expandedDomains[group.domain] ? 'Hide images' : 'Show images'}
                    </span>
                    {expandedDomains[group.domain] ? (
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
                        <TableHead className="w-16 text-left">Image</TableHead>
                        <TableHead className="w-1/5 text-left">Website</TableHead>
                        <TableHead className="w-1/5 text-left">URL</TableHead>
                        <TableHead className="w-1/5 text-left">Found On</TableHead>
                        {!compact && <TableHead className="w-1/5 text-left">Date</TableHead>}
                        <TableHead className="w-24 text-center">Score</TableHead>
                        <TableHead className="w-20 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.images.map((match, index) => {
                        const isImageFromCdn = isCdnUrl(match.url);
                        const cdnInfo = isImageFromCdn ? getCdnInfo(match.url) : null;
                        const actualWebsite = match.platform || getWebsiteName(match.url);
                        const associatedPage = match.pageUrl ? { url: match.pageUrl, pageTitle: match.pageTitle } : findPageForImage(match.url);
                        
                        return (
                          <TableRow key={`${group.domain}-image-${index}`} className="group hover:bg-gray-50">
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
                            <TableCell className="text-left">
                              <div className="font-medium flex items-center">
                                {actualWebsite}
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
                            </TableCell>
                            <TableCell className="text-left">
                              <div className="max-w-xs truncate text-sm text-brand-blue hover:underline">
                                <a href={match.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                  {getHostname(match.url)}
                                  <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                                </a>
                              </div>
                            </TableCell>
                            <TableCell className="text-left">
                              {associatedPage ? (
                                <div>
                                  <div className="flex items-center text-sm text-brand-blue hover:underline">
                                    <FileText className="h-3 w-3 mr-1 text-gray-400" />
                                    <a href={associatedPage.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[200px]">
                                      {associatedPage.pageTitle || "Web Page"}
                                    </a>
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                    {getHostname(associatedPage.url)}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Direct image URL</span>
                              )}
                            </TableCell>
                            {!compact && (
                              <TableCell className="text-left">
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  {match.dateFound 
                                    ? format(match.dateFound, 'MMM d, yyyy')
                                    : format(new Date(), 'MMM d, yyyy')}
                                </div>
                              </TableCell>
                            )}
                            <TableCell className="text-center">
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
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </>
      ) : (
        <Card className="p-6 text-center">
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
