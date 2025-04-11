
import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, AlertCircle, Link as LinkIcon, 
  ShoppingBag, FileText, Clock, Download, Globe, Image as ImageIcon,
  Shield, ShieldAlert, Eye
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
import { useBetaSignupPrompt } from '@/hooks/useBetaSignupPrompt';
import { toast } from 'sonner';

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
}

const DEFAULT_ITEMS_TO_SHOW = 8; // Show more items by default

const isLikelySpam = (url: string, pageTitle: string): boolean => {
  // List of spam patterns
  const spamPatterns = [
    /\.(ru|cn)\/(?![\w-]+\/)$/, // Russian or Chinese TLDs with no path
    /bit\.ly/,         // URL shorteners
    /goo\.gl/,
    /tinyurl/,
    /(\d{1,3}\.){3}\d{1,3}/, // IP addresses
    /porn|xxx|sex|adult|dating|casino|bet|loan|pharma|рф|бг/, // Known spam keywords
    /\.(jsp|php|aspx)\?id=\d+$/, // Typical spam URL patterns
    /forum|topic|thread|blog.*\?p=\d+$/, // Forum spam
  ];
  
  // Check if URL matches any spam pattern
  const isSpamUrl = spamPatterns.some(pattern => pattern.test(url.toLowerCase()));
  
  // Check if title is suspicious (very short, numeric, empty, or contains spam words)
  const isSpamTitle = !pageTitle || 
                      pageTitle.length < 3 || 
                      /^\d+$/.test(pageTitle) ||
                      /sex|porn|xxx|hot|dating|viagra|casino/.test(pageTitle.toLowerCase());
  
  return isSpamUrl || isSpamTitle;
};

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [sortBy, setSortBy] = useState<'confidence' | 'date' | 'domain' | 'count'>('confidence');
  const [today] = useState(new Date());
  const { showBetaSignup, setShowBetaSignup } = useBetaSignupPrompt();
  const [showSpamResults, setShowSpamResults] = useState(false);
  
  if (!results) return null;

  // Using useMemo to prevent unnecessary recalculations
  const processedResults = useMemo(() => {
    // Process all results first
    const processedData = {
      ...results,
      visuallySimilarImages: results.visuallySimilarImages.map(img => ({
        ...img,
        dateFound: img.dateFound || new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000)
      })),
      pagesWithMatchingImages: results.pagesWithMatchingImages.map(page => ({
        ...page,
        dateFound: page.dateFound || new Date(today.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
        isSpam: isLikelySpam(page.url, page.pageTitle)
      }))
    };
    
    return processedData;
  }, [results, today]);
  
  // Get legitimate and spam pages separately
  const legitimatePages = useMemo(() => 
    processedResults.pagesWithMatchingImages.filter((page: any) => !page.isSpam),
    [processedResults.pagesWithMatchingImages]
  );
  
  const spamPages = useMemo(() => 
    processedResults.pagesWithMatchingImages.filter((page: any) => page.isSpam),
    [processedResults.pagesWithMatchingImages]
  );
  
  // Only use legitimate pages for normal display
  const displayPages = showSpamResults ? processedResults.pagesWithMatchingImages : legitimatePages;
  
  // Using useMemo for all derived values to avoid recalculations during renders
  const exactMatches = useMemo(() => 
    processedResults.visuallySimilarImages.filter(img => img.score >= 0.9),
    [processedResults.visuallySimilarImages]
  );
  
  const partialMatches = useMemo(() => 
    processedResults.visuallySimilarImages.filter(img => img.score >= 0.7 && img.score < 0.9),
    [processedResults.visuallySimilarImages]
  );
  
  const allRelevantPages = useMemo(() => 
    displayPages
      .filter(page => page.score >= 0.6)
      .filter(page => page.matchingImages && page.matchingImages.length > 0),
    [displayPages]
  );
  
  const productPages = useMemo(() => 
    allRelevantPages.filter(page => page.pageType === 'product'),
    [allRelevantPages]
  );
  
  const categoryPages = useMemo(() => 
    allRelevantPages.filter(page => page.pageType === 'category'),
    [allRelevantPages]
  );
  
  const searchPages = useMemo(() => 
    allRelevantPages.filter(page => page.pageType === 'search'),
    [allRelevantPages]
  );
  
  const otherPages = useMemo(() => 
    allRelevantPages.filter(page => 
      page.pageType !== 'product' && 
      page.pageType !== 'category' && 
      page.pageType !== 'search'
    ),
    [allRelevantPages]
  );

  // Count calculations
  const exactMatchCount = exactMatches.length;
  const partialMatchCount = partialMatches.length;
  const productPageCount = productPages.length;
  const categoryPageCount = categoryPages.length;
  const searchPageCount = searchPages.length;
  const otherPageCount = otherPages.length;
  const pageMatchCount = productPageCount + categoryPageCount + searchPageCount + otherPageCount;
  const totalMatchCount = exactMatchCount + partialMatchCount + pageMatchCount;
  const spamPagesCount = spamPages.length;

  const toggleSpamResults = () => {
    setShowSpamResults(!showSpamResults);
    
    if (!showSpamResults && spamPagesCount > 0) {
      toast.info(`Showing ${spamPagesCount} potential spam results`, {
        description: "These results were filtered out due to suspicious content"
      });
    }
  };

  const exportResults = (type: 'csv' | 'pdf') => {
    // Check if user has signed up for beta
    const hasSeenBetaSignup = localStorage.getItem('seen_beta_signup');
    
    if (!hasSeenBetaSignup) {
      setShowBetaSignup(true);
      toast.info("Sign up for our beta to export results", {
        description: "Join our beta program to unlock export functionality"
      });
      return;
    }
    
    if (type === 'csv') {
      let csvContent = "Match Type,Domain,URL,Page Type,Confidence,Date Found\n";
      
      exactMatches.forEach(match => {
        let domain = "";
        try {
          domain = new URL(match.url).hostname;
        } catch (e) {
          domain = "Unknown";
        }
        csvContent += `Exact Match,${domain},${match.url},Image,${(match.score * 100).toFixed(1)}%,${format(match.dateFound || new Date(), 'yyyy-MM-dd')}\n`;
      });
      
      partialMatches.forEach(match => {
        let domain = "";
        try {
          domain = new URL(match.url).hostname;
        } catch (e) {
          domain = "Unknown";
        }
        csvContent += `Partial Match,${domain},${match.url},Image,${(match.score * 100).toFixed(1)}%,${format(match.dateFound || new Date(), 'yyyy-MM-dd')}\n`;
      });
      
      allRelevantPages.forEach(page => {
        let domain = "";
        try {
          domain = new URL(page.url).hostname;
        } catch (e) {
          domain = "Unknown";
        }
        csvContent += `Page with Image,${domain},${page.url},${page.pageType || 'Unknown'},${(page.score * 100).toFixed(1)}%,${format(page.dateFound || new Date(), 'yyyy-MM-dd')}\n`;
      });

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

  const scrollToImageUpload = () => {
    const uploadElement = document.querySelector('[data-upload-section]');
    if (uploadElement) {
      uploadElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white rounded-t-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <CardTitle>Image Search Results</CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="bg-white/20 border-white/10 text-white hover:bg-white/30" onClick={() => exportResults('csv')}>
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
              <Button variant="secondary" size="sm" className="flex items-center gap-2" onClick={scrollToImageUpload}>
                <LinkIcon className="h-4 w-4" />
                Search another image
              </Button>
            </div>
          </div>
          <CardDescription className="text-white/80 mt-1">
            Found {totalMatchCount} potential matches for your image
            {spamPagesCount > 0 && (
              <button 
                onClick={toggleSpamResults}
                className="ml-3 text-xs underline hover:text-white transition-colors flex items-center"
              >
                <Eye className="h-3 w-3 mr-1" />
                {showSpamResults ? "Hide" : "View"} Potential Spam Results ({spamPagesCount})
              </button>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center flex-wrap gap-2">
              <div className="flex flex-wrap gap-2">
                <div className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
                  <span className="text-xl font-bold text-brand-red">{exactMatchCount}</span>
                  <span className="text-xs text-muted-foreground">Exact</span>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
                  <span className="text-xl font-bold text-amber-500">{partialMatchCount}</span>
                  <span className="text-xs text-muted-foreground">Partial</span>
                </div>
                <div className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
                  <span className="text-xl font-bold text-brand-blue">{pageMatchCount}</span>
                  <span className="text-xs text-muted-foreground">Pages</span>
                </div>
                {showSpamResults && spamPagesCount > 0 && (
                  <div className="flex flex-col items-center justify-center px-4 py-2 bg-gradient-to-b from-red-50 to-red-100 border border-red-200 rounded-lg shadow-sm">
                    <span className="text-xl font-bold text-red-500">{spamPagesCount}</span>
                    <span className="text-xs text-muted-foreground">Spam</span>
                  </div>
                )}
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
          
          {showSpamResults && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <ShieldAlert className="text-red-500 h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-600">Showing potential spam results</p>
                <p className="text-sm text-muted-foreground mt-1">
                  These results were filtered out due to suspicious patterns or content
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 bg-white text-red-600 border-red-200 hover:bg-red-50"
                  onClick={toggleSpamResults}
                >
                  Hide Spam Results
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {totalMatchCount > 0 && (
        <Tabs defaultValue="all" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="w-full h-auto justify-start mb-4 bg-gray-100 p-1.5">
              <TabsTrigger value="all" className="relative px-6 py-2">
                All Results
                <Badge className="ml-2 bg-[#333] text-white">
                  {totalMatchCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="exact" className="relative px-6 py-2">
                Exact Matches
                <Badge className="ml-2 bg-brand-red text-white">
                  {exactMatchCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="partial" className="relative px-6 py-2">
                Partial Matches
                <Badge className="ml-2 bg-amber-500 text-white">
                  {partialMatchCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pages" className="relative px-6 py-2">
                Pages with Image
                <Badge className="ml-2 bg-brand-blue text-white">
                  {pageMatchCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="m-0">
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center">
                  <Badge className="bg-[#333] text-white mr-2">{totalMatchCount}</Badge>
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
                      Exact Matches
                    </h3>
                    <ExactMatchesTable 
                      matches={exactMatches}
                      relatedPages={allRelevantPages} 
                      sortBy={sortBy}
                      initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
                      compact
                    />
                  </div>
                )}
                
                {partialMatchCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-amber-500 text-white mr-2">{partialMatchCount}</Badge>
                      Partial Matches
                    </h3>
                    <ExactMatchesTable 
                      matches={partialMatches}
                      relatedPages={allRelevantPages} 
                      sortBy={sortBy}
                      initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
                      compact
                    />
                  </div>
                )}
                
                {productPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-brand-blue text-white mr-2">{productPageCount}</Badge>
                      Product Pages
                    </h3>
                    <PagesMatchTable pages={productPages} sortBy={sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
                  </div>
                )}
                
                {categoryPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-green-500 text-white mr-2">{categoryPageCount}</Badge>
                      Category Pages
                    </h3>
                    <PagesMatchTable pages={categoryPages} sortBy={sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
                  </div>
                )}
                
                {searchPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-purple-500 text-white mr-2">{searchPageCount}</Badge>
                      Search Results Pages
                    </h3>
                    <PagesMatchTable pages={searchPages} sortBy={sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
                  </div>
                )}
                
                {otherPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-gray-500 text-white mr-2">{otherPageCount}</Badge>
                      Other Pages
                    </h3>
                    <PagesMatchTable pages={otherPages} sortBy={sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
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
                    <span className="text-xs text-muted-foreground ml-2">(Confidence ≥ 90%)</span>
                  </div>
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
                  initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
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
                    <span className="text-xs text-muted-foreground ml-2">(Confidence 70-90%)</span>
                  </div>
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
                  initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
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
                    <ShoppingBag className="h-4 w-4 mr-2 text-brand-blue" />
                    <CardTitle className="text-lg">Pages with Image</CardTitle>
                  </div>
                </div>
                <CardDescription>
                  Webpages showing your image, categorized by page type
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {productPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-brand-blue text-white mr-2">{productPageCount}</Badge>
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Product Pages
                    </h3>
                    <PagesMatchTable pages={productPages} sortBy={sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} />
                  </div>
                )}
                
                {categoryPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-green-500 text-white mr-2">{categoryPageCount}</Badge>
                      <FileText className="h-4 w-4 mr-2" />
                      Category Pages
                    </h3>
                    <PagesMatchTable pages={categoryPages} sortBy={sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} />
                  </div>
                )}
                
                {searchPageCount > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-purple-500 text-white mr-2">{searchPageCount}</Badge>
                      <Globe className="h-4 w-4 mr-2" />
                      Search Results Pages
                    </h3>
                    <PagesMatchTable pages={searchPages} sortBy={sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} />
                  </div>
                )}
                
                {otherPageCount > 0 && (
                  <div>
                    <h3 className="text-lg font-medium flex items-center mb-3">
                      <Badge className="bg-gray-500 text-white mr-2">{otherPageCount}</Badge>
                      <FileText className="h-4 w-4 mr-2" />
                      Other Pages
                    </h3>
                    <PagesMatchTable pages={otherPages} sortBy={sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} />
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
          <p className="text-muted-foreground">Your image appears to be unique or we couldn't find any similar images with confidence score ≥ 70%</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
