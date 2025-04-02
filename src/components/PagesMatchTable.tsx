import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Image, FileText, Eye, Trash2, Star, Flag, Copy, ShoppingBag, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
  
  // Get thumbnail for a page
  const getThumbnailForPage = (page: WebPage): string => {
    // If the page has matching images, use the first one as thumbnail
    if (page.matchingImages && page.matchingImages.length > 0) {
      return page.matchingImages[0].imageUrl || '';
    }
    
    // Otherwise try to get favicon
    return `https://www.google.com/s2/favicons?domain=${page.url}&sz=128`;
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

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-14"></TableHead>
              <TableHead>Website / Page</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visiblePages.map((page, index) => (
              <TableRow key={index} className="group hover:bg-gray-50">
                <TableCell className="p-2">
                  <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    {page.matchingImages && page.matchingImages.length > 0 ? (
                      <img 
                        src={page.matchingImages[0].imageUrl} 
                        alt={getWebsiteName(page.url, page.platform)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = 
                            `<div class="w-full h-full flex items-center justify-center bg-gray-200">
                              ${getPageTypeIcon(page.pageType)}
                            </div>`;
                        }}
                      />
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
                    {getPageTypeIcon(page.pageType)}
                    <span className="ml-1">
                      {page.pageType === 'product' ? 'Product Page' : 
                       page.pageType === 'category' ? 'Category Page' : 'Web Page'}
                    </span>
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
                  {page.platform && (
                    <Badge className={getPlatformBadgeColor(page.platform)}>
                      {page.platform}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end space-x-1 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Page">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Report Infringement">
                      <Flag className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Copy URL">
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {loadMoreVisible && (
        <div className="flex justify-center">
          <Button 
            onClick={loadMore} 
            variant="outline"
            className="text-brand-blue border-brand-blue"
          >
            Load More Pages
          </Button>
        </div>
      )}

      {pages.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No pages with matching images found</p>
        </Card>
      )}
    </div>
  );
};
