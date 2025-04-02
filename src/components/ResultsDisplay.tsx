
import React from 'react';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
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
  
  // Adjusted thresholds - lowering them to show more matches
  const exactMatches = results.visuallySimilarImages.filter(img => img.score >= 0.7);
  const similarImages = results.visuallySimilarImages.filter(img => img.score >= 0.5 && img.score < 0.7);
  const relevantPages = results.pagesWithMatchingImages;

  // Get total potential issues
  const totalIssues = exactMatches.length + similarImages.length;
  const totalMatchCount = relevantPages.length + exactMatches.length + similarImages.length;

  return (
    <div className="space-y-8">
      <div className="bg-white shadow-sm border rounded-lg p-6">
        <h2 className="text-xl font-bold uppercase mb-4 text-brand-dark">We've found your image on the web</h2>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Badge className="text-brand-light px-4 py-1 text-lg font-medium bg-brand-blue">
              {totalMatchCount}
            </Badge>
            <span className="font-medium text-lg">Total Matches Found</span>
          </div>
          
          <Button variant="outline" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Search another image
          </Button>
        </div>
        
        {totalMatchCount === 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <AlertCircle className="text-green-500 h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-brand-dark">No matches found</p>
              <p className="text-sm text-muted-foreground mt-1">
                We couldn't find any significant matches for your image
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Data Tables - Main component that shows all the matches */}
      {(exactMatches.length > 0 || similarImages.length > 0 || relevantPages.length > 0) && (
        <DataTable 
          exactMatches={exactMatches}
          similarImages={similarImages}
          pages={relevantPages}
        />
      )}

      {!exactMatches.length && !similarImages.length && !relevantPages.length && (
        <div className="text-center py-12 bg-white shadow-sm border rounded-lg">
          <AlertTriangle className="h-16 w-16 text-brand-blue mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No matches found</h2>
          <p className="text-muted-foreground">Your image appears to be unique or we couldn't find any similar images</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
