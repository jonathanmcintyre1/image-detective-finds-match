
import React, { useState } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  ExternalLink, 
  Image, 
  FileText, 
  Trash2, 
  Star
} from 'lucide-react';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import { Card } from '@/components/ui/card';

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
}

interface DataTableProps {
  exactMatches: WebImage[];
  similarImages: WebImage[];
  pages: WebPage[];
}

const DataTable: React.FC<DataTableProps> = ({ exactMatches, similarImages, pages }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Combine and sort all matches to display
  const allMatches = [
    ...pages.map(page => ({
      type: 'page' as const,
      url: page.url,
      score: page.score,
      title: page.pageTitle,
      platform: page.platform
    })),
    ...exactMatches.map(img => ({
      type: 'exact' as const,
      url: img.url,
      score: img.score,
      title: 'Exact Image Match',
      imageUrl: img.imageUrl,
      platform: img.platform
    })),
    ...similarImages.map(img => ({
      type: 'similar' as const,
      url: img.url,
      score: img.score,
      title: 'Similar Image',
      imageUrl: img.imageUrl,
      platform: img.platform
    }))
  ].sort((a, b) => b.score - a.score);
  
  // Paginate matches
  const totalPages = Math.ceil(allMatches.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentMatches = allMatches.slice(startIndex, startIndex + itemsPerPage);
  
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
  
  const getMatchTypeColor = (type: string): string => {
    switch (type) {
      case 'exact': return 'bg-brand-red text-brand-light';
      case 'similar': return 'bg-brand-blue text-brand-light';
      case 'page': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const getMatchTypeBadge = (type: string): string => {
    switch (type) {
      case 'exact': return 'Exact Match';
      case 'similar': return 'Similar';
      case 'page': return 'Page';
      default: return 'Unknown';
    }
  };
  
  if (allMatches.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-lg font-medium">No matches found</p>
        <p className="text-sm text-muted-foreground mt-2">Your image appears to be unique</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader className="bg-brand-dark">
            <TableRow>
              <TableHead className="text-brand-light">Website</TableHead>
              <TableHead className="text-brand-light">Match Type</TableHead>
              <TableHead className="text-brand-light">URL</TableHead>
              <TableHead className="text-brand-light text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentMatches.map((item, index) => (
              <TableRow key={index} className="group hover:bg-gray-50">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gray-100 rounded">
                      {item.type === 'exact' || item.type === 'similar' ? (
                        <Image className="h-4 w-4 text-gray-500" />
                      ) : (
                        <FileText className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{getWebsiteName(item.url, item.platform)}</div>
                      <div className="text-xs text-muted-foreground">{item.title || getHostname(item.url)}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getMatchTypeColor(item.type)}`}>
                    {getMatchTypeBadge(item.type)}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-1">
                    {Math.round(item.score * 100)}% confidence
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-xs truncate text-sm text-brand-blue hover:underline">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                      {getHostname(item.url)}
                      <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                    </a>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end space-x-2 transition-opacity">
                    <button className="p-1 rounded hover:bg-gray-100" title="Save">
                      <Star className="h-4 w-4 text-gray-500" />
                    </button>
                    <button className="p-1 rounded hover:bg-gray-100" title="Delete">
                      <Trash2 className="h-4 w-4 text-gray-500" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <PaginationItem key={i}>
                  <PaginationLink
                    isActive={currentPage === pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            
            {totalPages > 5 && (
              <>
                <PaginationItem>
                  <PaginationLink>...</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink
                    isActive={currentPage === totalPages}
                    onClick={() => setCurrentPage(totalPages)}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      <div className="text-sm text-muted-foreground text-center">
        Showing {Math.min(allMatches.length, startIndex + 1)}-
        {Math.min(allMatches.length, startIndex + itemsPerPage)} of {allMatches.length} matches
      </div>
    </div>
  );
};

export default DataTable;
