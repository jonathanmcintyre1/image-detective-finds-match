
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, AlertCircle, Link as LinkIcon, 
  ShoppingBag, LayoutGrid, Shield, Filter, SlidersHorizontal,
  Check, Clock, Download, Globe, Ban, Tag, FileWarning
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
  dateFound?: Date; // Added date found
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
  pageType?: 'product' | 'category' | 'unknown';
  matchingImages?: WebImage[];
  dateFound?: Date; // Added date found
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
  const [authorizedDomains, setAuthorizedDomains] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'confidence' | 'date' | 'domain'>('confidence');
  const [today] = useState(new Date());
  
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
  
  // Filter results to only show high confidence matches (80% or higher)
  const exactMatches = processedResults.visuallySimilarImages.filter(img => img.score >= 0.8);
  
  // Similar matches (medium confidence: 60-80%)
  const similarMatches = processedResults.visuallySimilarImages.filter(img => img.score >= 0.6 && img.score < 0.8);
  
  // Split pages by type
  const allRelevantPages = processedResults.pagesWithMatchingImages.filter(page => page.score >= 0.6);
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

  const filteredSimilarMatches = platformFilter 
    ? similarMatches.filter(match => (match.platform || 'unknown') === platformFilter)
    : similarMatches;

  const filteredProductPages = platformFilter
    ? productPages.filter(page => (page.platform || 'unknown') === platformFilter)
    : productPages;

  const filteredCategoryPages = platformFilter
    ? categoryPages.filter(page => (page.platform || 'unknown') === platformFilter)
    : categoryPages;

  // Filter out authorized domains if needed
  const filterAuthorizedDomains = (items: WebImage[] | WebPage[]): (WebImage | WebPage)[] => {
    if (!authorizedDomains.length) return items;
    
    return items.filter(item => {
      try {
        const hostname = new URL(item.url).hostname;
        return !authorizedDomains.some(domain => hostname.includes(domain));
      } catch {
        return true;
      }
    });
  };

  // Final filtered lists
  const finalExactMatches = filterAuthorizedDomains(filteredExactMatches) as WebImage[];
  const finalSimilarMatches = filterAuthorizedDomains(filteredSimilarMatches) as WebImage[];
  const finalProductPages = filterAuthorizedDomains(filteredProductPages) as WebPage[];
  const finalCategoryPages = filterAuthorizedDomains(filteredCategoryPages) as WebPage[];

  // Get total potential issues
  const exactMatchCount = finalExactMatches.length;
  const similarMatchCount = finalSimilarMatches.length;
  const pageMatchCount = finalProductPages.length + finalCategoryPages.length;
  const totalMatchCount = exactMatchCount + similarMatchCount + pageMatchCount;

  // Helper for exports
  const exportResults = (type: 'csv' | 'pdf') => {
    if (type === 'csv') {
      // Create CSV content
      let csvContent = "Type,Domain,URL,Confidence,Date Found\n";
      
      // Add exact matches
      finalExactMatches.forEach(match => {
        const domain = new URL(match.url).hostname;
        csvContent += `Exact Match,${domain},${match.url},${(match.score * 100).toFixed(1)}%,${format(match.dateFound || new Date(), 'yyyy-MM-dd')}\n`;
      });
      
      // Add product pages
      finalProductPages.forEach(page => {
        const domain = new URL(page.url).hostname;
        csvContent += `Product Page,${domain},${page.url},${(page.score * 100).toFixed(1)}%,${format(page.dateFound || new Date(), 'yyyy-MM-dd')}\n`;
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

  // Get unique platforms from all matches
  const uniquePlatforms = Array.from(
    new Set([
      ...exactMatches.map(m => m.platform || 'unknown'),
      ...similarMatches.map(m => m.platform || 'unknown'),
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
                  <span className="text-xl font-bold text-amber-500">{similarMatchCount}</span>
                  <span className="text-xs text-muted-foreground">Similar</span>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <span className="text-xl font-bold text-brand-blue">{finalProductPages.length}</span>
                  <span className="text-xs text-muted-foreground">Products</span>
                </div>
              </div>
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
          
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2 mt-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select 
                className="text-sm border rounded-md px-2 py-1"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'confidence' | 'date' | 'domain')}
              >
                <option value="confidence">Confidence</option>
                <option value="date">Date Found</option>
                <option value="domain">Domain</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-8"
                onClick={() => setAuthorizedDomains(prev => 
                  prev.length ? [] : ['amazon.com', 'ebay.com', 'etsy.com']
                )}
              >
                {authorizedDomains.length ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Show All
                  </>
                ) : (
                  <>
                    <Ban className="h-3 w-3 mr-1" />
                    Hide Authorized
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-8"
              >
                <Globe className="h-3 w-3 mr-1" />
                Manage Whitelist
              </Button>
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
        <Tabs defaultValue="exact" className="w-full">
          <TabsList className="w-full justify-start mb-4 bg-gray-100">
            <TabsTrigger value="exact" className="relative">
              Exact Matches
              {finalExactMatches.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-brand-red text-white h-5 min-w-5 flex items-center justify-center p-0">
                  {finalExactMatches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="similar" className="relative">
              Similar Matches
              {finalSimilarMatches.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white h-5 min-w-5 flex items-center justify-center p-0">
                  {finalSimilarMatches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="products" className="relative">
              Product Pages
              {finalProductPages.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-brand-blue text-white h-5 min-w-5 flex items-center justify-center p-0">
                  {finalProductPages.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All Results</TabsTrigger>
          </TabsList>

          <TabsContent value="exact" className="m-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-brand-red/10 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge className="bg-brand-red text-white mr-2">{finalExactMatches.length}</Badge>
                    <CardTitle className="text-lg">Exact Image Matches</CardTitle>
                    <span className="text-xs text-muted-foreground ml-2">(Confidence ≥ 80%)</span>
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
                  matches={finalExactMatches}
                  relatedPages={allRelevantPages} 
                  sortBy={sortBy}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="similar" className="m-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-amber-500/10 border-b">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Badge className="bg-amber-500 text-white mr-2">{finalSimilarMatches.length}</Badge>
                    <CardTitle className="text-lg">Similar Image Matches</CardTitle>
                    <span className="text-xs text-muted-foreground ml-2">(Confidence 60-80%)</span>
                  </div>
                  <Alert variant="warning" className="w-auto py-1 h-9 px-3 bg-amber-50 border-amber-200 text-amber-700">
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
                  matches={finalSimilarMatches}
                  relatedPages={allRelevantPages} 
                  sortBy={sortBy}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="m-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-brand-blue/10 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge className="bg-brand-blue text-white mr-2">{finalProductPages.length}</Badge>
                    <ShoppingBag className="h-4 w-4 mr-2 text-brand-blue" />
                    <CardTitle className="text-lg">Products Using Your Image</CardTitle>
                  </div>
                  <Alert variant="default" className="w-auto py-1 h-9 px-3 bg-blue-50 border-blue-200 text-blue-700">
                    <ShoppingBag className="h-4 w-4" />
                    <AlertDescription className="ml-2">
                      Products using your images
                    </AlertDescription>
                  </Alert>
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
                <PagesMatchTable pages={finalProductPages} sortBy={sortBy} />
              </CardContent>
            </Card>
          </TabsContent>

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
                {finalExactMatches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-brand-red text-white mr-2">{finalExactMatches.length}</Badge>
                      Exact Matches
                    </h3>
                    <ExactMatchesTable 
                      matches={finalExactMatches}
                      relatedPages={allRelevantPages} 
                      sortBy={sortBy}
                      compact
                    />
                  </div>
                )}
                
                {finalSimilarMatches.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-amber-500 text-white mr-2">{finalSimilarMatches.length}</Badge>
                      Similar Matches
                    </h3>
                    <ExactMatchesTable 
                      matches={finalSimilarMatches}
                      relatedPages={allRelevantPages} 
                      sortBy={sortBy}
                      compact
                    />
                  </div>
                )}
                
                {finalProductPages.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-brand-blue text-white mr-2">{finalProductPages.length}</Badge>
                      Product Pages
                    </h3>
                    <PagesMatchTable pages={finalProductPages} sortBy={sortBy} compact />
                  </div>
                )}
                
                {finalCategoryPages.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-gray-500 text-white mr-2">{finalCategoryPages.length}</Badge>
                      Other Pages
                    </h3>
                    <PagesMatchTable pages={finalCategoryPages} sortBy={sortBy} compact />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!totalMatchCount && (
        <div className="text-center py-12 bg-white shadow-sm border rounded-lg">
          <FileWarning className="h-16 w-16 text-brand-blue mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No matches found</h2>
          <p className="text-muted-foreground">Your image appears to be unique or we couldn't find any similar images with confidence score ≥ 60%</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
