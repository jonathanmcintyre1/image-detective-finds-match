
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
import { Progress } from '@/components/ui/progress';
import { ExternalLink } from 'lucide-react';

interface WebEntity {
  entityId: string;
  score: number;
  description: string;
}

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

interface ResultsDisplayProps {
  results: MatchResult | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="space-y-8">
      {results.visuallySimilarImages.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Similar Images</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.visuallySimilarImages.map((image, index) => (
              <div key={index} className="border rounded-md overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-square bg-muted relative overflow-hidden">
                  <img 
                    src={image.imageUrl || image.url} 
                    alt={`Similar image ${index + 1}`}
                    className="object-cover w-full h-full"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/400x400/f5f5f5/aaaaaa?text=Image+Not+Available";
                    }}
                  />
                </div>
                <div className="p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Match Score</span>
                    <Badge variant={image.score > 0.7 ? "default" : "outline"}>
                      {Math.round(image.score * 100)}%
                    </Badge>
                  </div>
                  <Progress value={image.score * 100} className="h-1.5" />
                  <a 
                    href={image.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center mt-2 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Source
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {results.pagesWithMatchingImages.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Pages with Matching Images</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Page Title</TableHead>
                <TableHead>URL</TableHead>
                <TableHead className="text-right">Match Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.pagesWithMatchingImages.map((page, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{page.pageTitle || "Untitled Page"}</TableCell>
                  <TableCell>
                    <a 
                      href={page.url} 
                      className="text-primary hover:underline flex items-center"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {page.url.substring(0, 40)}{page.url.length > 40 ? '...' : ''}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={page.score > 0.7 ? "default" : "outline"}>
                      {Math.round(page.score * 100)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {results.webEntities.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Recognized Entities</h2>
          <div className="flex flex-wrap gap-2">
            {results.webEntities.map((entity, index) => (
              <Badge 
                key={index} 
                variant="outline"
                className={`text-sm px-3 py-1 ${entity.score > 0.8 ? 'bg-primary/10' : ''}`}
              >
                {entity.description}
                <span className="ml-1 opacity-60">{Math.round(entity.score * 100)}%</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {(!results.visuallySimilarImages.length && !results.pagesWithMatchingImages.length && !results.webEntities.length) && (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">No matches found</h2>
          <p className="text-muted-foreground">Try uploading a different image or URL</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
