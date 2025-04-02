
import React from 'react';
import DataTable from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle } from 'lucide-react';

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
  
  // Filter high confidence matches (score >= 0.7)
  const exactMatches = results.visuallySimilarImages.filter(img => img.score >= 0.85);
  const highConfidenceMatches = results.visuallySimilarImages.filter(img => img.score >= 0.7 && img.score < 0.85);
  
  // Filter out low confidence pages
  const relevantPages = results.pagesWithMatchingImages.filter(page => page.score >= 0.65);

  // Get total potential issues
  const totalIssues = exactMatches.length + highConfidenceMatches.length;

  return (
    <div className="space-y-8">
      {/* Summary Panel */}
      <div className="bg-white shadow-sm border rounded-lg p-6">
        <h2 className="text-xl font-bold uppercase mb-4 text-brand-dark">Analysis Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col border rounded-lg p-4 bg-brand-light">
            <span className="text-sm text-muted-foreground">Exact Matches</span>
            <span className="text-3xl font-bold text-brand-dark">{exactMatches.length}</span>
            {exactMatches.length > 0 && (
              <Badge className="mt-2 bg-brand-red text-brand-light w-fit">Potential Infringement</Badge>
            )}
          </div>
          
          <div className="flex flex-col border rounded-lg p-4 bg-brand-light">
            <span className="text-sm text-muted-foreground">Similar Images</span>
            <span className="text-3xl font-bold text-brand-dark">{highConfidenceMatches.length}</span>
            {highConfidenceMatches.length > 0 && (
              <Badge className="mt-2 bg-brand-blue text-brand-light w-fit">Review Recommended</Badge>
            )}
          </div>
          
          <div className="flex flex-col border rounded-lg p-4 bg-brand-light">
            <span className="text-sm text-muted-foreground">Websites Found</span>
            <span className="text-3xl font-bold text-brand-dark">{relevantPages.length}</span>
          </div>
        </div>
        
        {totalIssues > 0 && (
          <div className="mt-6 p-4 bg-brand-red/10 border border-brand-red/30 rounded-lg flex items-start">
            <AlertCircle className="text-brand-red h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-brand-dark">
                {totalIssues === 1 
                  ? "We found 1 potential unauthorized use of your image" 
                  : `We found ${totalIssues} potential unauthorized uses of your image`}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Review the results below and consider taking action if needed
              </p>
            </div>
          </div>
        )}
        
        {totalIssues === 0 && relevantPages.length === 0 && (
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

      {/* Data Tables */}
      {(exactMatches.length > 0 || relevantPages.length > 0) && (
        <DataTable 
          images={[...exactMatches, ...highConfidenceMatches]} 
          pages={relevantPages}
        />
      )}

      {/* Contextual Info */}
      {results.webEntities.length > 0 && (
        <div className="bg-white shadow-sm border rounded-lg p-6">
          <h2 className="text-xl uppercase font-bold mb-4 text-brand-dark">
            Content Analysis
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Our AI identified the following elements in your image:
          </p>
          <div className="flex flex-wrap gap-2">
            {results.webEntities
              .filter(entity => entity.score > 0.7)
              .sort((a, b) => b.score - a.score)
              .map((entity, index) => (
                <Badge 
                  key={index} 
                  variant="outline"
                  className={`text-sm px-3 py-1 ${entity.score > 0.8 ? 'bg-brand-blue/10' : ''}`}
                >
                  {entity.description}
                  <span className="ml-1 opacity-60">{Math.round(entity.score * 100)}%</span>
                </Badge>
              ))}
          </div>
        </div>
      )}

      {!exactMatches.length && !highConfidenceMatches.length && !relevantPages.length && (
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
