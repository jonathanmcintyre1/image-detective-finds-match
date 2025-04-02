
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, AlertCircle, Link as LinkIcon, ShoppingBag, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExactMatchesTable } from './ExactMatchesTable';
import { PagesMatchTable } from './PagesMatchTable';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  pageType?: 'product' | 'category' | 'unknown';
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
  
  // Filter results to only show high confidence matches (80% or higher)
  const exactMatches = results.visuallySimilarImages.filter(img => img.score >= 0.8);
  
  // Split pages by type
  const allRelevantPages = results.pagesWithMatchingImages.filter(page => page.score >= 0.7);
  const productPages = allRelevantPages.filter(page => page.pageType === 'product');
  const categoryPages = allRelevantPages.filter(page => page.pageType === 'category' || page.pageType === 'unknown');

  // Get total potential issues
  const totalMatchCount = exactMatches.length + productPages.length + categoryPages.length;

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

      {/* Show Exact Matches Section */}
      {exactMatches.length > 0 && (
        <div className="bg-white shadow-sm border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-brand-dark flex items-center">
            <Badge className="bg-brand-red text-white mr-2">{exactMatches.length}</Badge>
            Exact Image Matches
            <span className="text-xs text-muted-foreground ml-2">(Confidence ≥ 80%)</span>
          </h3>
          <ExactMatchesTable matches={exactMatches} />
        </div>
      )}

      {/* Show Product Pages Section */}
      {productPages.length > 0 && (
        <div className="bg-white shadow-sm border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-brand-dark flex items-center">
            <Badge className="bg-brand-blue text-white mr-2">{productPages.length}</Badge>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Product Pages with Your Image
          </h3>
          <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
            <AlertTitle>Potential sales of your image</AlertTitle>
            <AlertDescription>
              These pages appear to be selling products that use your image.
            </AlertDescription>
          </Alert>
          <PagesMatchTable pages={productPages} />
        </div>
      )}

      {/* Show Category/Other Pages Section */}
      {categoryPages.length > 0 && (
        <div className="bg-white shadow-sm border rounded-lg p-6">
          <h3 className="text-lg font-bold mb-4 text-brand-dark flex items-center">
            <Badge className="bg-gray-500 text-white mr-2">{categoryPages.length}</Badge>
            <LayoutGrid className="h-4 w-4 mr-2" />
            Other Pages with Your Image
          </h3>
          <Alert variant="default" className="mb-4 bg-gray-50">
            <AlertTitle>Other websites using your image</AlertTitle>
            <AlertDescription>
              These pages may be using your image in blogs, galleries, or other contexts.
            </AlertDescription>
          </Alert>
          <PagesMatchTable pages={categoryPages} />
        </div>
      )}

      {!exactMatches.length && !productPages.length && !categoryPages.length && (
        <div className="text-center py-12 bg-white shadow-sm border rounded-lg">
          <AlertTriangle className="h-16 w-16 text-brand-blue mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No high-confidence matches found</h2>
          <p className="text-muted-foreground">Your image appears to be unique or we couldn't find any similar images with confidence score ≥ 80%</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
