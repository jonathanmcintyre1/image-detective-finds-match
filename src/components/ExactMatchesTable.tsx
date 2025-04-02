
import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Download, Flag, Copy, Star, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from 'sonner';

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
}

interface ExactMatchesTableProps {
  matches: WebImage[];
}

export const ExactMatchesTable: React.FC<ExactMatchesTableProps> = ({ matches }) => {
  const [visibleMatches, setVisibleMatches] = useState<WebImage[]>(matches.slice(0, 5));
  const [loadMoreVisible, setLoadMoreVisible] = useState(matches.length > 5);

  // Group matches by platform
  const groupedMatches = visibleMatches.reduce((acc, match) => {
    const platform = match.platform || 'unknown';
    if (!acc[platform]) acc[platform] = [];
    acc[platform].push(match);
    return acc;
  }, {} as Record<string, WebImage[]>);

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

  const loadMore = () => {
    const nextBatch = matches.slice(visibleMatches.length, visibleMatches.length + 5);
    setVisibleMatches(prev => [...prev, ...nextBatch]);
    
    if (visibleMatches.length + 5 >= matches.length) {
      setLoadMoreVisible(false);
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
      {Object.entries(groupedMatches).length > 0 ? (
        Object.entries(groupedMatches).map(([platform, platformMatches]) => (
          <div key={platform} className="mb-6">
            <div className="flex items-center mb-2">
              <h3 className="text-base font-medium">{platform !== 'unknown' ? platform : 'Other Sources'}</h3>
              <Badge className="ml-2 bg-gray-200 text-gray-800">{platformMatches.length}</Badge>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="w-16">Image</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead className="w-24 text-right">Confidence</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {platformMatches.map((match, index) => (
                    <TableRow key={index} className="group hover:bg-gray-50">
                      <TableCell className="p-2">
                        <div className="w-14 h-14 bg-gray-100 rounded overflow-hidden">
                          {match.imageUrl && (
                            <AspectRatio ratio={1 / 1} className="bg-muted">
                              <img 
                                src={match.imageUrl} 
                                alt="Matched image" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).onerror = null;
                                  (e.target as HTMLImageElement).src = 'placeholder.svg';
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
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate text-sm text-brand-blue hover:underline">
                          <a href={match.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                            {getHostname(match.url)}
                            <ExternalLink className="ml-1 h-3 w-3 inline flex-shrink-0" />
                          </a>
                        </div>
                      </TableCell>
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
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Save">
                            <Star className="h-4 w-4 text-muted-foreground" />
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
          <p className="text-muted-foreground">No exact image matches found</p>
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
    </div>
  );
};
