
import React from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Image, Shield, AlertTriangle } from 'lucide-react';

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
  images: WebImage[];
  pages: WebPage[];
}

const DataTable: React.FC<DataTableProps> = ({ images, pages }) => {
  // Combine and sort data by score
  const combinedData = [
    ...images.map(img => ({
      type: 'image' as const,
      url: img.url,
      score: img.score,
      imageUrl: img.imageUrl,
      title: '',
      platform: img.platform
    })),
    ...pages.map(page => ({
      type: 'page' as const,
      url: page.url,
      score: page.score,
      imageUrl: '',
      title: page.pageTitle,
      platform: page.platform
    }))
  ].sort((a, b) => b.score - a.score);

  // Function to get hostname from URL
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  // Get platform badge color
  const getPlatformColor = (platform: string | undefined) => {
    if (!platform) return "secondary";
    
    switch(platform) {
      case 'Amazon': return "destructive";
      case 'AliExpress': return "destructive";
      case 'Etsy': return "default";
      case 'eBay': return "destructive";
      case 'Walmart': return "default";
      case 'Shopify Store': return "default";
      case 'CDN Hosted': return "secondary";
      default: return "secondary";
    }
  };

  if (combinedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">No exact matches found</p>
        <p className="text-sm text-muted-foreground">Your image appears to be unique or we couldn't find any similar images.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl uppercase font-bold flex items-center text-brand-dark">
        <Shield className="mr-2 h-5 w-5 text-brand-blue" />
        Potential Image Matches ({combinedData.length})
      </h2>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-brand-dark">
            <TableRow>
              <TableHead className="text-brand-light">Preview</TableHead>
              <TableHead className="text-brand-light">Type</TableHead>
              <TableHead className="text-brand-light">Source</TableHead>
              <TableHead className="text-brand-light">Platform</TableHead>
              <TableHead className="text-brand-light text-right">Match Score</TableHead>
              <TableHead className="text-brand-light text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {combinedData.map((item, index) => (
              <TableRow key={index} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                <TableCell className="w-20">
                  {item.type === 'image' && item.imageUrl ? (
                    <div className="aspect-square w-16 h-16 rounded border overflow-hidden bg-gray-100">
                      <img 
                        src={item.imageUrl} 
                        alt="Match preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = "https://placehold.co/400x400/f5f5f5/aaaaaa?text=No+Preview";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="aspect-square w-16 h-16 rounded border overflow-hidden bg-gray-100 flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={item.type === 'image' ? "default" : "outline"}
                    className="bg-brand-blue text-brand-light"
                  >
                    {item.type === 'image' ? 'Image' : 'Page'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm truncate max-w-[200px]">
                      {item.type === 'page' && item.title ? item.title : getHostname(item.url)}
                    </span>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-brand-blue hover:underline flex items-center mt-1"
                    >
                      View Source
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  {item.platform ? (
                    <Badge 
                      variant="outline"
                      className={`bg-${getPlatformColor(item.platform)}/10`}
                    >
                      {item.platform}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Unknown</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-col items-end">
                    <span className="font-medium">{Math.round(item.score * 100)}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-brand-blue h-1.5 rounded-full" 
                        style={{ width: `${Math.round(item.score * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <button className="text-xs bg-brand-dark text-brand-light px-2 py-1 rounded hover:bg-opacity-80 transition-colors">
                    Report
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default DataTable;
