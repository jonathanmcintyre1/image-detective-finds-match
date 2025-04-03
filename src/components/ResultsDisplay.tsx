
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, AlertCircle, Link as LinkIcon, 
  ShoppingBag, FileText, Shield, Clock, Download, Globe, Tag
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';
import { trackImageSearch } from '@/services/searchTrackingService';

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
  dateFound?: Date;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
  pageType?: 'product' | 'category' | 'search' | 'unknown';
  matchingImages?: WebImage[];
  dateFound?: Date;
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

interface ResultsDisplayProps {
  results: MatchResult | null;
  searchedImage?: string | File;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results, searchedImage }) => {
  const [sortBy, setSortBy] = useState<'confidence' | 'date' | 'domain' | 'count'>('confidence');
  const [today] = useState(new Date());
  
  // Track search in Supabase when results are displayed
  React.useEffect(() => {
    if (results && searchedImage) {
      const totalResults = (results.visuallySimilarImages?.length || 0) + 
                          (results.pagesWithMatchingImages?.length || 0);
      trackImageSearch(searchedImage, totalResults);
    }
  }, [results, searchedImage]);
  
  if (!results) return null;
  
  // Add mock dates if not provided (in a real app, these would come from the API)
  const processedResults = {
    ...results,
    visuallySimilarImages: results.visuallySimilarImages.map(img => ({
      ...img,
      dateFound: img.dateFound || new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    })),
    pagesWithMatchingImages: results.pagesWithMatchingImages.map(page => ({
      ...page,
      dateFound: page.dateFound || new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
    }))
  };
  
  // Split matches by score: exact matches (95%+) vs partial matches (60-95%)
  const exactMatches = processedResults.visuallySimilarImages.filter(img => img.score >= 0.95);
  const partialMatches = processedResults.visuallySimilarImages.filter(img => img.score >= 0.6 && img.score < 0.95);
  
  // Split pages by type
  const allRelevantPages = processedResults.pagesWithMatchingImages.filter(page => page.score >= 0.6);
  const productPages = allRelevantPages.filter(page => page.pageType === 'product');
  const categoryPages = allRelevantPages.filter(page => page.pageType === 'category');
  const searchPages = allRelevantPages.filter(page => page.pageType === 'search');
  const otherPages = allRelevantPages.filter(page => 
    page.pageType !== 'product' && 
    page.pageType !== 'category' && 
    page.pageType !== 'search'
  );

  // Get total potential issues
  const exactMatchCount = exactMatches.length;
  const partialMatchCount = partialMatches.length;
  const productPageCount = productPages.length;
  const categoryPageCount = categoryPages.length;
  const searchPageCount = searchPages.length;
  const otherPageCount = otherPages.length;
  const pageMatchCount = productPageCount + categoryPageCount + searchPageCount + otherPageCount;
  const totalMatchCount = exactMatchCount + partialMatchCount + pageMatchCount;

  // Helper for exports
  const exportResults = (type: 'csv' | 'pdf') => {
    if (type === 'csv') {
      // Create CSV content
      let csvContent = "Match Type,Domain,URL,Page Type,Confidence,Date Found\n";
      
      // Add exact matches
      exactMatches.forEach(match => {
        let domain = "";
        try {
          domain = new URL(match.url).hostname;
        } catch (e) {
          domain = "Unknown";
        }
        csvContent += `Exact Match,${domain},${match.url},Image,${(match.score * 100).toFixed(1)}%,${format(match.dateFound || new Date(), 'yyyy-MM-dd')}\n`;
      });
      
      // Add partial matches
      partialMatches.forEach(match => {
        let domain = "";
        try {
          domain = new URL(match.url).hostname;
        } catch (e) {
          domain = "Unknown";
        }
        csvContent += `Partial Match,${domain},${match.url},Image,${(match.score * 100).toFixed(1)}%,${format(match.dateFound || new Date(), 'yyyy-MM-dd')}\n`;
      });
      
      // Add all pages
      allRelevantPages.forEach(page => {
        let domain = "";
        try {
          domain = new URL(page.url).hostname;
        } catch (e) {
          domain = "Unknown";
        }
        csvContent += `Page with Image,${domain},${page.url},${page.pageType || 'Unknown'},${(page.score * 100).toFixed(1)}%,${format(page.dateFound || new Date(), 'yyyy-MM-dd')}\n`;
      });

      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `image-matches-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.click();
      URL.revokeObjectURL(url);
    } else {
      alert('PDF export coming soon');
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Image Search Results</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="bg-white/20 border-white/10 text-white hover:bg-white/30" onClick={() => exportResults('csv')}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Button variant="secondary" size="sm" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Search another image
              </Button>
            </div>
          </div>
          <CardDescription className="text-white/80 mt-1">
            Found {totalMatchCount} potential matches for your image
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                <div className="flex flex-col items-center justify-center px-4 py-2 bg-red-50 border border-red-100 rounded-lg">
                  <span className="text-xl font-bold text-brand-red">{exactMatchCount}</span>
                  <span className="text-xs text-muted-foreground">Exact</span>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg">
                  <span className="text-xl font-bold text-amber-500">{partialMatchCount}</span>
                  <span className="text-xs text-muted-foreground">Partial</span>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <span className="text-xl font-bold text-brand-blue">{pageMatchCount}</span>
                  <span className="text-xs text-muted-foreground">Pages</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select 
                className="text-sm border rounded-md px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'confidence' | 'date' | 'domain' | 'count')}
              >
                <option value="confidence">Confidence</option>
                <option value="date">Date Found</option>
                <option value="domain">Domain</option>
                <option value="count"># of Matches</option>
              </select>
            </div>
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

      {totalMatchCount > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start mb-4 bg-gray-100">
            <TabsTrigger value="all" className="relative">
              All Results
              {totalMatchCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-gray-500 text-white h-5 min-w-5 flex items-center justify-center p-0">
                  {totalMatchCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="exact" className="relative">
              Exact Matches
              {exactMatchCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-brand-red text-white h-5 min-w-5 flex items-center justify-center p-0">
                  {exactMatchCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="partial" className="relative">
              Partial Matches
              {partialMatchCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white h-5 min-w-5 flex items-center justify-center p-0">
                  {partialMatchCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="pages" className="relative">
              Pages with Image
              {pageMatchCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-brand-blue text-white h-5 min-w-5 flex items-center justify-center p-0">
                  {pageMatchCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="m-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center">
                  <Badge className="bg-gray-500 text-white mr-2">{totalMatchCount}</Badge>
                  <CardTitle className="text-lg">All Results</CardTitle>
                </div>
                <CardDescription>
                  Complete list of all matches for your image
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {exactMatchCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-brand-red text-white mr-2">{exactMatchCount}</Badge>
                      Exact Matches (95-100% match)
                    </h3>
                    <ExactMatchesTable 
                      matches={exactMatches}
                      relatedPages={allRelevantPages} 
                      sortBy={sortBy}
                      compact
                    />
                  </div>
                )}
                
                {partialMatchCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-amber-500 text-white mr-2">{partialMatchCount}</Badge>
                      Partial Matches (60-95% match)
                    </h3>
                    <ExactMatchesTable 
                      matches={partialMatches}
                      relatedPages={allRelevantPages} 
                      sortBy={sortBy}
                      compact
                    />
                  </div>
                )}
                
                {categoryPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-green-500 text-white mr-2">{categoryPageCount}</Badge>
                      <Tag className="h-4 w-4 mr-2" />
                      Ecommerce Category Pages
                    </h3>
                    <PagesMatchTable pages={categoryPages} sortBy={sortBy} compact />
                  </div>
                )}
                
                {productPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-brand-blue text-white mr-2">{productPageCount}</Badge>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Product Pages
                    </h3>
                    <PagesMatchTable pages={productPages} sortBy={sortBy} compact />
                  </div>
                )}
                
                {searchPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-purple-500 text-white mr-2">{searchPageCount}</Badge>
                      <Globe className="h-4 w-4 mr-2" />
                      Search Results Pages
                    </h3>
                    <PagesMatchTable pages={searchPages} sortBy={sortBy} compact />
                  </div>
                )}
                
                {otherPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-gray-500 text-white mr-2">{otherPageCount}</Badge>
                      <FileText className="h-4 w-4 mr-2" />
                      Other Pages
                    </h3>
                    <PagesMatchTable pages={otherPages} sortBy={sortBy} compact />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="exact" className="m-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-brand-red/10 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge className="bg-brand-red text-white mr-2">{exactMatchCount}</Badge>
                    <CardTitle className="text-lg">Exact Image Matches</CardTitle>
                    <span className="text-xs text-muted-foreground ml-2">(Confidence ≥ 95%)</span>
                  </div>
                  <Alert variant="destructive" className="w-auto py-1 h-9 px-3">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      High risk of infringement
                    </AlertDescription>
                  </Alert>
                </div>
                <CardDescription>
                  These are direct copies of your image found online
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ExactMatchesTable 
                  matches={exactMatches}
                  relatedPages={allRelevantPages} 
                  sortBy={sortBy}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="partial" className="m-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-amber-500/10 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge className="bg-amber-500 text-white mr-2">{partialMatchCount}</Badge>
                    <CardTitle className="text-lg">Partial Image Matches</CardTitle>
                    <span className="text-xs text-muted-foreground ml-2">(Confidence 60-95%)</span>
                  </div>
                  <Alert variant="default" className="w-auto py-1 h-9 px-3 bg-amber-50 border-amber-200 text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      Potential derivative works
                    </AlertDescription>
                  </Alert>
                </div>
                <CardDescription>
                  These images appear visually similar to yours
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <ExactMatchesTable 
                  matches={partialMatches}
                  relatedPages={allRelevantPages} 
                  sortBy={sortBy}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pages" className="m-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-brand-blue/10 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className="bg-brand-blue text-white mr-2">{pageMatchCount}</Badge>
                    <CardTitle className="text-lg">Pages with Image</CardTitle>
                  </div>
                </div>
                <CardDescription>
                  Webpages showing your image, categorized by page type
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {categoryPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-green-500 text-white mr-2">{categoryPageCount}</Badge>
                      <Tag className="h-4 w-4 mr-2" />
                      Ecommerce Category Pages
                    </h3>
                    <PagesMatchTable pages={categoryPages} sortBy={sortBy} />
                  </div>
                )}
                
                {productPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-brand-blue text-white mr-2">{productPageCount}</Badge>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Product Pages
                    </h3>
                    <PagesMatchTable pages={productPages} sortBy={sortBy} />
                  </div>
                )}
                
                {searchPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-purple-500 text-white mr-2">{searchPageCount}</Badge>
                      <Globe className="h-4 w-4 mr-2" />
                      Search Results Pages
                    </h3>
                    <PagesMatchTable pages={searchPages} sortBy={sortBy} />
                  </div>
                )}
                
                {otherPageCount > 0 && (
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-gray-500 text-white mr-2">{otherPageCount}</Badge>
                      <FileText className="h-4 w-4 mr-2" />
                      Other Pages
                    </h3>
                    <PagesMatchTable pages={otherPages} sortBy={sortBy} />
                  </div>
                )}
                
                {pageMatchCount === 0 && (
                  <div className="p-6 text-center bg-gray-50 rounded-lg border border-dashed">
                    <FileText className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-muted-foreground">No pages containing your image were found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {totalMatchCount === 0 && (
        <div className="text-center py-12 bg-white shadow-sm border rounded-lg">
          <FileText className="h-16 w-16 text-brand-blue mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No matches found</h2>
          <p className="text-muted-foreground">Your image appears to be unique or we couldn't find any similar images with confidence score ≥ 60%</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
