
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ExternalLink, Copy, Image as ImageIcon, 
  AlertCircle, Filter, Grid, List,
  Calendar, Clock, ShoppingBag, FileText, Globe,
  Server, Shield, Sparkles, Info, HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface WebEntity {
  entityId: string;
  score: number;
  description: string;
}

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
  isSpam?: boolean;
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

interface ImprovedResultsViewProps {
  results: MatchResult | null;
}

// Function to get normalized domain from URL
const getNormalizedDomain = (url: string): string => {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. and subdomain prefixes
    let domain = hostname.replace(/^www\./i, '');
    
    // Handle special cases for CDNs and known platforms
    if (domain.includes('cloudfront.net') || 
        domain.includes('amazonaws.com') || 
        domain.includes('s3.') || 
        domain.includes('cdn.')) {
      return 'CDN Hosted';
    }
    
    // Extract main domain for common services
    if (domain.includes('instagram') || domain.includes('cdninstagram') || domain.includes('fbcdn') || domain.includes('lookaside')) {
      return 'Instagram';
    } else if (domain.includes('facebook') || domain.includes('fbcdn')) {
      return 'Facebook';
    } else if (domain.includes('pinterest') || domain.includes('pinimg')) {
      return 'Pinterest';
    } else if (domain.includes('twitter') || domain.includes('twimg')) {
      return 'Twitter';
    } else if (domain.includes('youtube') || domain.includes('ytimg')) {
      return 'YouTube';
    } else if (domain.includes('amazon')) {
      return 'Amazon';
    } else if (domain.includes('ebay')) {
      return 'eBay';
    } else if (domain.includes('etsy')) {
      return 'Etsy';
    } else if (domain.includes('shopify')) {
      return 'Shopify';
    } else if (domain.includes('walmart')) {
      return 'Walmart';
    }
    
    // Extract main domain part for others (e.g., example.com from subdomain.example.com)
    const parts = domain.split('.');
    if (parts.length > 2) {
      domain = parts.slice(-2).join('.');
    }
    
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch (error) {
    return 'Unknown';
  }
};

// Get badge color class based on domain
const getDomainColorClass = (domain: string): string => {
  const normalizedDomain = domain.toLowerCase();
  
  if (normalizedDomain.includes('amazon')) return 'domain-amazon';
  if (normalizedDomain.includes('ebay')) return 'domain-ebay';
  if (normalizedDomain.includes('etsy')) return 'domain-etsy';
  if (normalizedDomain.includes('pinterest')) return 'domain-pinterest';
  if (normalizedDomain.includes('instagram')) return 'domain-instagram';
  if (normalizedDomain.includes('facebook')) return 'domain-facebook';
  if (normalizedDomain.includes('twitter')) return 'domain-twitter';
  if (normalizedDomain.includes('youtube')) return 'domain-youtube';
  if (normalizedDomain.includes('shopify')) return 'domain-shopify';
  if (normalizedDomain.includes('walmart')) return 'domain-walmart';
  if (normalizedDomain.includes('cdn')) return 'domain-cdn';
  
  return 'domain-unknown';
};

// Get an appropriate icon for the match type
const getMatchTypeIcon = (type: 'exact' | 'partial' | 'page', pageType?: string) => {
  if (type === 'page') {
    switch(pageType) {
      case 'product': return <ShoppingBag className="w-4 h-4" />;
      case 'category': return <FileText className="w-4 h-4" />;
      case 'search': return <Globe className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  }
  return type === 'exact' ? 
    <Shield className="w-4 h-4" /> : 
    <Sparkles className="w-4 h-4" />;
};

// Format the date in a readable way
const formatDate = (date?: Date): string => {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  
  return format(date, 'MMM d, yyyy');
};

// Component to handle image loading with fallback
const ImageWithFallback = ({ src, domain }: { src?: string, domain: string }) => {
  const [hasError, setHasError] = useState(!src);
  
  if (hasError || !src) {
    return (
      <div className="image-unavailable w-full h-full flex items-center justify-center bg-gray-200">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-xs text-gray-500">Preview Unavailable</span>
        </div>
      </div>
    );
  }
  
  return (
    <img 
      src={src} 
      alt={`Match from ${domain}`} 
      className="result-image w-full h-full object-cover"
      onError={() => setHasError(true)}
      loading="lazy"
    />
  );
};

// Result Card Component
const ResultCard = ({ 
  item, 
  type, 
  onClick 
}: { 
  item: WebImage | WebPage, 
  type: 'exact' | 'partial' | 'page',
  onClick: () => void
}) => {
  const domain = getNormalizedDomain('url' in item ? item.url : '');
  const domainClass = getDomainColorClass(domain);
  const date = 'dateFound' in item ? item.dateFound : undefined;
  const score = item.score;
  const pageType = 'pageType' in item ? item.pageType : undefined;
  const imageUrl = 'imageUrl' in item ? item.imageUrl : undefined;
  const title = 'pageTitle' in item ? item.pageTitle : domain;
  
  return (
    <div className="result-card cursor-pointer" onClick={onClick}>
      <div className="relative">
        <Badge className={`domain-badge ${domainClass}`}>
          {domain}
        </Badge>
        <Badge className={`match-percentage ${score >= 0.9 ? 'bg-red-500' : 'bg-amber-500'} text-white`}>
          {Math.round(score * 100)}%
        </Badge>
        <div className="h-48 w-full overflow-hidden">
          <ImageWithFallback src={imageUrl || ('url' in item ? item.url : '')} domain={domain} />
        </div>
      </div>
      <div className="p-3 bg-gray-100">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center">
            {getMatchTypeIcon(type, pageType)}
            <span className="text-xs font-medium ml-1">
              {type === 'exact' ? 'Exact Match' : 
               type === 'partial' ? 'Partial Match' : 
               pageType === 'product' ? 'Product' :
               pageType === 'category' ? 'Category' :
               pageType === 'search' ? 'Search' : 'Page'}
            </span>
          </div>
          <div className="text-xs text-gray-500 flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatDate(date)}
          </div>
        </div>
        <h3 className="text-sm font-medium text-gray-800 truncate" title={title}>
          {title}
        </h3>
        <div className="flex justify-between items-center mt-2">
          <Button 
            variant="ghost" 
            size="compact" 
            className="p-1 h-7 w-7" 
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText('url' in item ? item.url : '');
              toast.success("URL copied to clipboard");
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button 
            variant="neutral" 
            size="compact" 
            className="text-xs"
            asChild
            onClick={(e) => e.stopPropagation()}
          >
            <a href={'url' in item ? item.url : ''} target="_blank" rel="noopener noreferrer">
              View <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
};

// Result Detail Popover
const ResultDetail = ({ 
  item, 
  type, 
  onClose 
}: { 
  item: WebImage | WebPage, 
  type: 'exact' | 'partial' | 'page',
  onClose: () => void
}) => {
  const domain = getNormalizedDomain('url' in item ? item.url : '');
  const score = item.score;
  const date = 'dateFound' in item ? item.dateFound : undefined;
  const pageType = 'pageType' in item ? item.pageType : undefined;
  const imageUrl = 'imageUrl' in item ? item.imageUrl : undefined;
  const title = 'pageTitle' in item ? item.pageTitle : domain;
  const matchingImages = 'matchingImages' in item ? item.matchingImages : [];
  
  return (
    <div className="p-4 max-w-2xl mx-auto bg-white rounded-lg shadow-lg border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800 flex items-center">
          {getMatchTypeIcon(type, pageType)}
          <span className="ml-2">
            {type === 'exact' ? 'Exact Match' : 
             type === 'partial' ? 'Partial Match' : 
             pageType === 'product' ? 'Product Page' :
             pageType === 'category' ? 'Category Page' :
             pageType === 'search' ? 'Search Page' : 'Web Page'}
          </span>
        </h2>
        <Badge className={score >= 0.9 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}>
          {Math.round(score * 100)}% Match
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <div className="rounded-lg overflow-hidden border bg-gray-200 h-64 w-full">
            <ImageWithFallback src={imageUrl || ('url' in item ? item.url : '')} domain={domain} />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Source</h3>
            <p className="text-base">{domain}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Title</h3>
            <p className="text-base">{title || 'No title available'}</p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">Found</h3>
            <p className="text-base flex items-center">
              <Calendar className="h-4 w-4 mr-1 text-gray-400" />
              {date ? format(date, 'MMMM d, yyyy') : 'Unknown date'}
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500">URL</h3>
            <a 
              href={'url' in item ? item.url : ''} 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline text-sm break-all flex items-start"
            >
              <span className="inline-block">{'url' in item ? item.url : ''}</span>
              <ExternalLink className="h-4 w-4 ml-1 flex-shrink-0" />
            </a>
          </div>
        </div>
      </div>
      
      {type === 'page' && matchingImages && matchingImages.length > 0 && (
        <div className="mt-6">
          <h3 className="text-base font-medium mb-2">Images on this page ({matchingImages.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {matchingImages.map((img, idx) => (
              <div key={idx} className="relative rounded-md overflow-hidden border h-24">
                <ImageWithFallback src={img.imageUrl || img.url} domain={domain} />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1">
                  {Math.round(img.score * 100)}% Match
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="neutral" onClick={onClose}>
          Close
        </Button>
        <Button 
          variant="action"
          asChild
        >
          <a href={'url' in item ? item.url : ''} target="_blank" rel="noopener noreferrer">
            Visit Source <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
};

// Empty Results Component
const EmptyResults = () => (
  <div className="text-center py-12">
    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
      <ImageIcon className="h-8 w-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-medium text-gray-800">No matches found</h3>
    <p className="text-sm text-gray-500 mt-1">We couldn't find any matches for your image with confidence ≥ 70%</p>
  </div>
);

// Loading Skeleton
const LoadingSkeleton = () => (
  <div className="result-grid">
    {Array.from({ length: 8 }).map((_, idx) => (
      <div key={idx} className="result-card">
        <div className="skeleton-loader h-48 w-full"></div>
        <div className="p-3">
          <div className="skeleton-loader h-4 w-1/3 mb-2"></div>
          <div className="skeleton-loader h-4 w-full mb-2"></div>
          <div className="skeleton-loader h-8 w-full mt-3"></div>
        </div>
      </div>
    ))}
  </div>
);

const ImprovedResultsView: React.FC<ImprovedResultsViewProps> = ({ results }) => {
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'exact' | 'partial' | 'pages'>('all');
  const [selectedItem, setSelectedItem] = useState<{item: WebImage | WebPage, type: 'exact' | 'partial' | 'page'} | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const observerTarget = useRef<HTMLDivElement>(null);
  
  // Group items by domain
  const groupedItems = useMemo(() => {
    if (!results) return {};
    
    const groups: Record<string, Array<{item: WebImage | WebPage, type: 'exact' | 'partial' | 'page'}>> = {};
    
    // Process exact matches (score >= 0.9)
    results.visuallySimilarImages
      .filter(img => img.score >= 0.9)
      .forEach(img => {
        const domain = getNormalizedDomain(img.url);
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push({ item: img, type: 'exact' as const });
      });
    
    // Process partial matches (score >= 0.7 and < 0.9)
    results.visuallySimilarImages
      .filter(img => img.score >= 0.7 && img.score < 0.9)
      .forEach(img => {
        const domain = getNormalizedDomain(img.url);
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push({ item: img, type: 'partial' as const });
      });
    
    // Process pages (non-spam)
    results.pagesWithMatchingImages
      .filter(page => !page.isSpam)
      .forEach(page => {
        const domain = getNormalizedDomain(page.url);
        if (!groups[domain]) groups[domain] = [];
        groups[domain].push({ item: page, type: 'page' as const });
      });
    
    return groups;
  }, [results]);
  
  // Get items based on filter
  const getFilteredItems = () => {
    if (!results) return [];
    
    let items: Array<{item: WebImage | WebPage, type: 'exact' | 'partial' | 'page'}> = [];
    
    // Exact matches (score >= 0.9)
    if (filter === 'all' || filter === 'exact') {
      const exactMatches = results.visuallySimilarImages
        .filter(img => img.score >= 0.9)
        .map(img => ({ item: img, type: 'exact' as const }));
      items = [...items, ...exactMatches];
    }
    
    // Partial matches (score >= 0.7 and < 0.9)
    if (filter === 'all' || filter === 'partial') {
      const partialMatches = results.visuallySimilarImages
        .filter(img => img.score >= 0.7 && img.score < 0.9)
        .map(img => ({ item: img, type: 'partial' as const }));
      items = [...items, ...partialMatches];
    }
    
    // Pages
    if (filter === 'all' || filter === 'pages') {
      const pageMatches = results.pagesWithMatchingImages
        .filter(page => !page.isSpam)
        .map(page => ({ item: page, type: 'page' as const }));
      items = [...items, ...pageMatches];
    }
    
    return items;
  };
  
  // Get domain-grouped filtered items
  const displayGroups = useMemo(() => {
    const allItems = getFilteredItems();
    
    // Group by domain
    const groups: Record<string, Array<{item: WebImage | WebPage, type: 'exact' | 'partial' | 'page'}>> = {};
    
    allItems.forEach(item => {
      const domain = getNormalizedDomain('url' in item.item ? item.item.url : '');
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(item);
    });
    
    // Convert to array and sort by most matches
    return Object.entries(groups)
      .map(([domain, items]) => ({ domain, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [results, filter]);
  
  const handleItemClick = (item: WebImage | WebPage, type: 'exact' | 'partial' | 'page') => {
    setSelectedItem({ item, type });
    setIsDetailOpen(true);
  };
  
  const closeDetail = () => {
    setIsDetailOpen(false);
    setTimeout(() => setSelectedItem(null), 300);
  };
  
  // Filter counts for badges
  const exactCount = results?.visuallySimilarImages.filter(img => img.score >= 0.9).length || 0;
  const partialCount = results?.visuallySimilarImages.filter(img => img.score >= 0.7 && img.score < 0.9).length || 0;
  const pagesCount = results?.pagesWithMatchingImages.filter(page => !page.isSpam).length || 0;
  const totalCount = exactCount + partialCount + pagesCount;
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="bg-white px-3 py-1 flex gap-1 items-center">
            <Filter className="h-4 w-4" />
            <span>Filter:</span>
          </Badge>
          <Tabs 
            value={filter} 
            onValueChange={(value) => setFilter(value as 'all' | 'exact' | 'partial' | 'pages')}
            className="w-auto"
          >
            <TabsList>
              <TabsTrigger value="all" className="flex items-center">
                All
                <Badge className="ml-1 bg-gray-700 text-white">{totalCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="exact" className="flex items-center">
                Exact
                <Badge className="ml-1 bg-red-500 text-white">{exactCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="partial" className="flex items-center">
                Partial
                <Badge className="ml-1 bg-amber-500 text-white">{partialCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pages" className="flex items-center">
                Pages
                <Badge className="ml-1 bg-blue-500 text-white">{pagesCount}</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewType === 'grid' ? 'default' : 'outline'} 
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setViewType('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grid View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={viewType === 'list' ? 'default' : 'outline'} 
                  size="sm"
                  className="h-9 w-9 p-0"
                  onClick={() => setViewType('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>List View</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h3 className="font-semibold">About Match Results</h3>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Badge className="bg-red-500 text-white mr-2">90%+</Badge>
                          <span>Exact matches - Nearly identical to your image</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Badge className="bg-amber-500 text-white mr-2">70-89%</Badge>
                          <span>Partial matches - Partially matching your image</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Badge className="bg-blue-500 text-white mr-2">Pages</Badge>
                          <span>Web pages containing your image</span>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </TooltipTrigger>
              <TooltipContent>
                <p>Help</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        displayGroups.length > 0 ? (
          <div className="space-y-6">
            {displayGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="border rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-200 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge className={`${getDomainColorClass(group.domain)} mr-2`}>
                        {group.items.length}
                      </Badge>
                      <h3 className="text-base font-medium">{group.domain}</h3>
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  {viewType === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {group.items.map((item, idx) => (
                        <ResultCard 
                          key={idx}
                          item={item.item} 
                          type={item.type} 
                          onClick={() => handleItemClick(item.item, item.type)} 
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {group.items.map((item, idx) => (
                        <Card 
                          key={idx} 
                          className="cursor-pointer"
                          onClick={() => handleItemClick(item.item, item.type)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-200 flex-shrink-0">
                                <ImageWithFallback 
                                  src={'imageUrl' in item.item ? item.item.imageUrl : ('url' in item.item ? item.item.url : undefined)} 
                                  domain={getNormalizedDomain('url' in item.item ? item.item.url : '')} 
                                />
                              </div>
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <Badge className={item.item.score >= 0.9 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'}>
                                    {Math.round(item.item.score * 100)}%
                                  </Badge>
                                </div>
                                <h3 className="font-medium truncate">
                                  {'pageTitle' in item.item ? item.item.pageTitle : 'Image Match'}
                                </h3>
                                <div className="flex items-center justify-between mt-1">
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    {getMatchTypeIcon(item.type, 'pageType' in item.item ? item.item.pageType : undefined)}
                                    <span className="ml-1">
                                      {item.type === 'exact' ? 'Exact Match' : 
                                      item.type === 'partial' ? 'Partial Match' : 
                                      'pageType' in item.item && item.item.pageType === 'product' ? 'Product' :
                                      'pageType' in item.item && item.item.pageType === 'category' ? 'Category' :
                                      'pageType' in item.item && item.item.pageType === 'search' ? 'Search' : 'Page'}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {formatDate('dateFound' in item.item ? item.item.dateFound : undefined)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {/* Observer element for infinite scrolling */}
            <div ref={observerTarget} className="h-1" />
          </div>
        ) : (
          <EmptyResults />
        )
      )}
      
      {/* Detail View Dialog */}
      {selectedItem && (
        <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${isDetailOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className={`w-full max-w-3xl transition-transform duration-300 ${isDetailOpen ? 'translate-y-0' : 'translate-y-8'}`} onClick={(e) => e.stopPropagation()}>
            <ResultDetail 
              item={selectedItem.item} 
              type={selectedItem.type} 
              onClose={closeDetail} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImprovedResultsView;
