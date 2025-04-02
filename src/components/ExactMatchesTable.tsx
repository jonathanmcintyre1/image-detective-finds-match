
import React, { useState } from 'react';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { 
  ExternalLink, Download, Flag, Trash2, Star, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>URL</TableHead>
              <TableHead className="w-24 text-right">Confidence</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleMatches.map((match, index) => (
              <TableRow key={index} className="group hover:bg-gray-50">
                <TableCell className="p-2">
                  <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                    {match.imageUrl && (
                      <img 
                        src={match.imageUrl} 
                        alt="Matched image" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).onerror = null;
                          (e.target as HTMLImageElement).src = 'placeholder.svg';
                        }}
                      />
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
                  <Badge className={`${match.score >= 0.8 ? 'bg-brand-red' : 'bg-amber-500'} text-white`}>
                    {Math.round(match.score * 100)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end space-x-1 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Report">
                      <Flag className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Copy URL">
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

      {loadMoreVisible && (
        <div className="flex justify-center">
          <Button 
            onClick={loadMore} 
            variant="outline" 
            className="text-brand-blue border-brand-blue"
          >
            Show More Results
          </Button>
        </div>
      )}

      {matches.length === 0 && (
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No image matches found</p>
        </Card>
      )}
    </div>
  );
};
