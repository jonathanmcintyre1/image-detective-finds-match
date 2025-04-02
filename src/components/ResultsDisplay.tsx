
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, AlertCircle, Link as LinkIcon, 
  ShoppingBag, LayoutGrid, Shield, Filter, SlidersHorizontal 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExactMatchesTable } from './ExactMatchesTable';
import { PagesMatchTable } from './PagesMatchTable';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
  matchingImages?: WebImage[];
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
  const [platformFilter, setPlatformFilter] = useState<string | null>(null);
  
  if (!results) return null;
  
  // Filter results to only show high confidence matches (80% or higher)
  const exactMatches = results.visuallySimilarImages.filter(img => img.score >= 0.8);
  
  // Split pages by type
  const allRelevantPages = results.pagesWithMatchingImages.filter(page => page.score >= 0.7);
  const productPages = allRelevantPages.filter(page => page.pageType === 'product');
  const categoryPages = allRelevantPages.filter(page => page.pageType === 'category' || page.pageType === 'unknown');

  // Group matches by platform for insight
  const platformMap = new Map<string, number>();
  exactMatches.forEach(match => {
    const platform = match.platform || 'unknown';
    platformMap.set(platform, (platformMap.get(platform) || 0) + 1);
  });
  
  // Apply platform filter if set
  const filteredExactMatches = platformFilter 
    ? exactMatches.filter(match => (match.platform || 'unknown') === platformFilter)
    : exactMatches;

  const filteredProductPages = platformFilter
    ? productPages.filter(page => (page.platform || 'unknown') === platformFilter)
    : productPages;

  const filteredCategoryPages = platformFilter
    ? categoryPages.filter(page => (page.platform || 'unknown') === platformFilter)
    : categoryPages;

  // Get total potential issues
  const totalMatchCount = exactMatches.length + productPages.length + categoryPages.length;

  // Get unique platforms from all matches
  const uniquePlatforms = Array.from(
    new Set([
      ...exactMatches.map(m => m.platform || 'unknown'),
      ...productPages.map(p => p.platform || 'unknown'),
      ...categoryPages.map(p => p.platform || 'unknown')
    ])
  ).filter(p => p !== 'unknown');

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Image Search Results</CardTitle>
            </div>
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Search another image
            </Button>
          </div>
          <CardDescription className="text-white/80 mt-1">
            We've analyzed your image across the web
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <Badge className="text-white px-4 py-1 text-lg font-medium bg-brand-blue">
                {totalMatchCount}
              </Badge>
              <span className="font-medium text-lg">Total Matches Found</span>
            </div>
            
            {uniquePlatforms.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter by platform:</span>
                {uniquePlatforms.map(platform => (
                  <Badge 
                    key={platform} 
                    variant={platformFilter === platform ? "default" : "outline"}
                    className="cursor-pointer hover:bg-muted/80"
                    onClick={() => setPlatformFilter(platformFilter === platform ? null : platform)}
                  >
                    {platform}
                  </Badge>
                ))}
                {platformFilter && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setPlatformFilter(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>
            )}
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
        </CardContent>
      </Card>

      {/* Show Exact Matches Section */}
      {filteredExactMatches.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-brand-red/10 border-b">
            <div className="flex items-center">
              <Badge className="bg-brand-red text-white mr-2">{filteredExactMatches.length}</Badge>
              <CardTitle className="text-lg">Exact Image Matches</CardTitle>
              <span className="text-xs text-muted-foreground ml-2">(Confidence ≥ 80%)</span>
            </div>
            <CardDescription>
              These are direct copies of your image found online
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ExactMatchesTable 
              matches={filteredExactMatches}
              relatedPages={allRelevantPages} 
            />
          </CardContent>
        </Card>
      )}

      {/* Show Product Pages Section */}
      {filteredProductPages.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-brand-blue/10 border-b">
            <div className="flex items-center">
              <Badge className="bg-brand-blue text-white mr-2">{filteredProductPages.length}</Badge>
              <ShoppingBag className="h-4 w-4 mr-2 text-brand-blue" />
              <CardTitle className="text-lg">Product Pages with Your Image</CardTitle>
            </div>
            <CardDescription>
              These pages appear to be selling products that use your image
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Alert variant="default" className="mb-4 bg-blue-50 border-blue-200">
              <AlertTitle>Potential sales of your image</AlertTitle>
              <AlertDescription>
                These pages appear to be selling products that use your image.
              </AlertDescription>
            </Alert>
            <PagesMatchTable pages={filteredProductPages} />
          </CardContent>
        </Card>
      )}

      {/* Show Category/Other Pages Section */}
      {filteredCategoryPages.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-gray-50 border-b">
            <div className="flex items-center">
              <Badge className="bg-gray-500 text-white mr-2">{filteredCategoryPages.length}</Badge>
              <LayoutGrid className="h-4 w-4 mr-2 text-gray-500" />
              <CardTitle className="text-lg">Other Pages with Your Image</CardTitle>
            </div>
            <CardDescription>
              These pages may be using your image in blogs, galleries, or other contexts
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Alert variant="default" className="mb-4 bg-gray-50">
              <AlertTitle>Other websites using your image</AlertTitle>
              <AlertDescription>
                These pages may be using your image in blogs, galleries, or other contexts.
              </AlertDescription>
            </Alert>
            <PagesMatchTable pages={filteredCategoryPages} />
          </CardContent>
        </Card>
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
