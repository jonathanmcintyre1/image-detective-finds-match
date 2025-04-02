
import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Image, FileText, Eye, Flag, Copy, ShoppingBag, Tag, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from 'sonner';

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
  pageType?: 'product' | 'category' | 'unknown';
  matchingImages?: {
    url: string;
    score: number;
    imageUrl?: string;
    platform?: string;
  }[];
}

interface PagesMatchTableProps {
  pages: WebPage[];
}

export const PagesMatchTable: React.FC<PagesMatchTableProps> = ({ pages }) => {
  const [visiblePages, setVisiblePages] = useState<WebPage[]>(pages.slice(0, 5));
  const [loadMoreVisible, setLoadMoreVisible] = useState(pages.length > 5);

  // Group pages by platform
  const groupedPages = visiblePages.reduce((acc, page) => {
    const platform = page.platform || 'unknown';
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(page);
    return acc;
  }, {} as Record<string, WebPage[]>);

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

  const loadMore = () => {
    const nextBatch = pages.slice(visiblePages.length, visiblePages.length + 5);
    setVisiblePages(prev => [...prev, ...nextBatch]);
    
    if (visiblePages.length + 5 >= pages.length) {
      setLoadMoreVisible(false);
    }
  };
  
  // Get page type icon
  const getPageTypeIcon = (pageType?: string) => {
    switch(pageType) {
      case 'product':
        return <ShoppingBag className="h-4 w-4 text-brand-blue" />;
      case 'category':
        return <Tag className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const handleReportClick = (url: string) => {
    toast.info(`Reporting ${getHostname(url)}`, {
      description: "This feature will be available soon"
    });
  };

  return (
    <div className="space-y-4">
      {Object.entries(groupedPages).length > 0 ? (
        Object.entries(groupedPages).map(([platform, platformPages]) => (
          <div key={platform} className="mb-6">
            <div className="flex items-center mb-2">
              <h3 className="text-base font-medium">{platform !== 'unknown' ? platform : 'Other Sources'}</h3>
              <Badge className="ml-2 bg-gray-200 text-gray-800">{platformPages.length}</Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-14"></TableHead>
                    <TableHead>Page</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-24">Type</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformPages.map((page, index) => (
                    <TableRow key={index} className="group hover:bg-gray-50">
                      <TableCell className="p-2">
                        <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">
                          {page.matchingImages && page.matchingImages.length > 0 ? (
                            <AspectRatio ratio={1 / 1} className="bg-muted">
                              <img 
                                src={page.matchingImages[0].imageUrl} 
                                alt={getWebsiteName(page.url, page.platform)}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = 
                                    `<div class="w-full h-full flex items-center justify-center bg-gray-200">
                                      ${getPageTypeIcon(page.pageType) ? getPageTypeIcon(page.pageType).toString() : ''}
                                    </div>`;
                                }}
                              />
                            </AspectRatio>
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
                          {platform !== 'unknown' ? platform : getHostname(page.url)}
                        </div>
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
                          <span className="ml-1 text-sm">
                            {page.pageType === 'product' ? 'Product' : 
                            page.pageType === 'category' ? 'Category' : 'Web Page'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end space-x-1 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            title="View Page"
                          >
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            title="Report Infringement"
                            onClick={() => handleReportClick(page.url)}
                          >
                            <Flag className="h-4 w-4 text-muted-foreground" />
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
            </div>
          </div>
        ))
      ) : (
        <Card className="p-6 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-brand-blue mb-4" />
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
    </div>
  );
};
