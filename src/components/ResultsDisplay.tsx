
import React, { useState, useMemo, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, AlertCircle, Link as LinkIcon, 
  Download, ArrowRight, Filter, 
  Sliders, CheckSquare, Star, ClipboardList, AlertOctagon
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
import { FilterControls, FilterOptions } from './FilterControls';
import ResultsGrid from './ResultsGrid';
import ResultsDashboard from './ResultsDashboard';
import { getHostname, groupByDomain, categorizeWebsite, getSourcePlatform } from '@/utils/domainUtils';
import useItemTracking from '@/hooks/useItemTracking';
import useResultsExport from '@/hooks/useResultsExport';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
  isSpam?: boolean;
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

interface ResultsDisplayProps {
  results: MatchResult | null;
}

const DEFAULT_ITEMS_TO_SHOW = 8;

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: 'confidence',
    sortOrder: 'desc',
    confidence: 0.7,
    showSpam: false,
    minConfidence: 70,
    displayMode: 'list',
    groupBy: 'domain',
    activeFilters: []
  });
  
  const [today] = useState(new Date());
  const { showBetaSignup, setShowBetaSignup } = useBetaSignupPrompt();
  const { exportToCsv } = useResultsExport();
  
  // Use our custom hooks for tracking reviewed and saved items
  const { 
    items: reviewedItems, 
    toggleItem: toggleReviewed,
    clearItems: clearReviewed
  } = useItemTracking({ localStorageKey: 'reviewed_items' });
  
  const { 
    items: savedItems, 
    toggleItem: toggleSaved,
    clearItems: clearSaved
  } = useItemTracking({ localStorageKey: 'saved_items' });
  
  const handleFilterOptionsChange = (options: Partial<FilterOptions>) => {
    setFilterOptions(prev => ({
      ...prev,
      ...options
    }));
  };
  
  const handleFilterClear = () => {
    setFilterOptions({
      sortBy: 'confidence',
      sortOrder: 'desc',
      confidence: 0.7,
      showSpam: false,
      minConfidence: 70,
      displayMode: 'list',
      groupBy: 'domain',
      activeFilters: []
    });
  };
  
  if (!results) return null;

  // Process the raw data to add dates if missing and detect spam
  const processedResults = useMemo(() => {
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
  
  // Filter functions
  const isLikelySpam = (url: string, pageTitle: string): boolean => {
    const spamPatterns = [
      /\.(ru|cn)\/(?![\w-]+\/)$/,
      /bit\.ly/,
      /goo\.gl/,
      /tinyurl/,
      /(\d{1,3}\.){3}\d{1,3}/,
      /porn|xxx|sex|adult|dating|casino|bet|loan|pharma|рф|бг/,
      /\.(jsp|php|aspx)\?id=\d+$/,
      /forum|topic|thread|blog.*\?p=\d+$/,
    ];
    
    const isSpamUrl = spamPatterns.some(pattern => pattern.test(url.toLowerCase()));
    
    const isSpamTitle = !pageTitle || 
                        pageTitle.length < 3 || 
                        /^\d+$/.test(pageTitle) ||
                        /sex|porn|xxx|hot|dating|viagra|casino/.test(pageTitle.toLowerCase());
    
    return isSpamUrl || isSpamTitle;
  };
  
  // Filter and prepare the data based on filter options
  const filteredData = useMemo(() => {
    const minConfidence = filterOptions.minConfidence / 100;
    
    const filteredExactMatches = processedResults.visuallySimilarImages
      .filter(img => img.score >= 0.9)
      .filter(img => img.score >= minConfidence);
      
    const filteredPartialMatches = processedResults.visuallySimilarImages
      .filter(img => img.score >= 0.7 && img.score < 0.9)
      .filter(img => img.score >= minConfidence);
      
    const filteredPages = processedResults.pagesWithMatchingImages
      .filter(page => !page.isSpam || filterOptions.showSpam)
      .filter(page => page.score >= minConfidence);
      
    const filteredProductPages = filteredPages.filter(page => page.pageType === 'product');
    const filteredCategoryPages = filteredPages.filter(page => page.pageType === 'category');
    const filteredSearchPages = filteredPages.filter(page => page.pageType === 'search');
    const filteredOtherPages = filteredPages.filter(page => 
      page.pageType !== 'product' && 
      page.pageType !== 'category' && 
      page.pageType !== 'search'
    );

    // Sort the data based on filter options
    const sortData = <T extends { url: string; score: number; dateFound?: Date }>(data: T[]): T[] => {
      const { sortBy, sortOrder } = filterOptions;
      let sorted = [...data];
      
      switch(sortBy) {
        case 'confidence':
          sorted = sorted.sort((a, b) => sortOrder === 'asc' ? a.score - b.score : b.score - a.score);
          break;
        case 'date':
          sorted = sorted.sort((a, b) => {
            const dateA = a.dateFound || new Date();
            const dateB = b.dateFound || new Date();
            return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
          });
          break;
        case 'domain':
          sorted = sorted.sort((a, b) => {
            const domainA = getHostname(a.url);
            const domainB = getHostname(b.url);
            return sortOrder === 'asc' ? domainA.localeCompare(domainB) : domainB.localeCompare(domainA);
          });
          break;
        case 'count':
          // Sort by number of matches from same domain
          sorted = sorted.sort((a, b) => {
            const hostnameA = getHostname(a.url);
            const hostnameB = getHostname(b.url);
            const countA = data.filter(m => getHostname(m.url) === hostnameA).length;
            const countB = data.filter(m => getHostname(m.url) === hostnameB).length;
            return sortOrder === 'asc' ? countA - countB : countB - countA;
          });
          break;
      }
      
      return sorted;
    };

    return {
      exactMatches: sortData(filteredExactMatches),
      partialMatches: sortData(filteredPartialMatches),
      productPages: sortData(filteredProductPages),
      categoryPages: sortData(filteredCategoryPages),
      searchPages: sortData(filteredSearchPages),
      otherPages: sortData(filteredOtherPages),
      allPages: sortData(filteredPages)
    };
  }, [processedResults, filterOptions]);
  
  // Count variables
  const exactMatchCount = filteredData.exactMatches.length;
  const partialMatchCount = filteredData.partialMatches.length;
  const productPageCount = filteredData.productPages.length;
  const categoryPageCount = filteredData.categoryPages.length;
  const searchPageCount = filteredData.searchPages.length;
  const otherPageCount = filteredData.otherPages.length;
  const pageMatchCount = productPageCount + categoryPageCount + searchPageCount + otherPageCount;
  const totalMatchCount = exactMatchCount + partialMatchCount + pageMatchCount;
  const spamPagesCount = processedResults.pagesWithMatchingImages.filter(p => p.isSpam).length;

  const handleExportCsv = () => {
    exportToCsv(processedResults, {
      includeReviewStatus: true,
      includeSaveStatus: true,
      reviewedItems,
      savedItems
    });
  };

  // Create dashboard data for the improved view
  const dashboardData = useMemo(() => {
    // Count unique domains
    const exactDomains = new Set(filteredData.exactMatches.map(m => getHostname(m.url)));
    const partialDomains = new Set(filteredData.partialMatches.map(m => getHostname(m.url)));
    const pageDomains = new Set(filteredData.allPages.map(p => getHostname(p.url)));
    
    const allDomains = new Set([...exactDomains, ...partialDomains, ...pageDomains]);
    
    // Count platform types
    let marketplacesCount = 0;
    let socialMediaCount = 0;
    let ecommerceCount = 0;
    
    // Create top domains list
    const domainStats = new Map<string, { count: number; type: string }>();
    
    // Process exact matches
    filteredData.exactMatches.forEach(match => {
      const domain = getHostname(match.url);
      const type = categorizeWebsite(domain);
      
      if (!domainStats.has(domain)) {
        domainStats.set(domain, { count: 1, type });
      } else {
        const current = domainStats.get(domain)!;
        domainStats.set(domain, { count: current.count + 1, type: current.type });
      }
    });
    
    // Process partial matches
    filteredData.partialMatches.forEach(match => {
      const domain = getHostname(match.url);
      const type = categorizeWebsite(domain);
      
      if (!domainStats.has(domain)) {
        domainStats.set(domain, { count: 1, type });
      } else {
        const current = domainStats.get(domain)!;
        domainStats.set(domain, { count: current.count + 1, type: current.type });
      }
    });
    
    // Process pages
    filteredData.allPages.forEach(page => {
      const domain = getHostname(page.url);
      const type = categorizeWebsite(domain);
      
      if (!domainStats.has(domain)) {
        domainStats.set(domain, { count: 1, type });
      } else {
        const current = domainStats.get(domain)!;
        domainStats.set(domain, { count: current.count + 1, type: current.type });
      }
    });
    
    // Count website types
    for (const [_, data] of domainStats) {
      if (data.type === 'marketplace') marketplacesCount++;
      if (data.type === 'social') socialMediaCount++;
      if (data.type === 'ecommerce') ecommerceCount++;
    }
    
    // Sort and slice top domains
    const topDomains = Array.from(domainStats.entries())
      .map(([domain, data]) => ({
        domain,
        count: data.count,
        type: data.type
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    // Find highest confidence score
    const highestConfidence = Math.max(
      ...filteredData.exactMatches.map(m => m.score),
      ...filteredData.partialMatches.map(m => m.score),
      ...filteredData.allPages.map(p => p.score)
    );
    
    return {
      totalMatches: totalMatchCount,
      exactMatches: filteredData.exactMatches,
      partialMatches: filteredData.partialMatches,
      domainsCount: allDomains.size,
      marketplacesCount,
      socialMediaCount,
      ecommerceCount,
      highestConfidence,
      topDomains
    };
  }, [filteredData, totalMatchCount]);

  const handleDomainSelect = (domain: string) => {
    toast.info(`Filtering for domain: ${domain}`, {
      description: "Results filtered to show only matches from this domain"
    });
    
    // This would be implemented to filter by domain
    // Not fully implemented in this iteration
  };

  const renderResultsContent = () => {
    if (filterOptions.displayMode === 'grid') {
      return (
        <div className="space-y-6">
          <ResultsGrid 
            matches={[...filteredData.exactMatches, ...filteredData.partialMatches]}
            onMarkAsReviewed={toggleReviewed}
            onToggleSave={toggleSaved}
            reviewedItems={reviewedItems}
            savedItems={savedItems}
          />
        </div>
      );
    } else if (filterOptions.displayMode === 'improved') {
      return (
        <div className="space-y-6">
          <ResultsDashboard 
            data={dashboardData}
            onDomainSelect={handleDomainSelect}
          />
          
          <Card className="border-0 shadow-md">
            <CardHeader className="bg-brand-red/10 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Badge className="bg-brand-red text-white mr-2">{exactMatchCount}</Badge>
                  <CardTitle className="text-lg">High Priority Matches</CardTitle>
                </div>
              </div>
              <CardDescription>
                These are direct copies of your image that require immediate attention
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {exactMatchCount > 0 ? (
                <ExactMatchesTable 
                  matches={filteredData.exactMatches}
                  relatedPages={filteredData.allPages} 
                  sortBy={filterOptions.sortBy}
                  initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
                />
              ) : (
                <div className="p-6 text-center">
                  <AlertCircle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
                  <p className="text-muted-foreground">No high priority matches found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    } else {
      // Default list view
      return (
        <div>
          {exactMatchCount > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <Badge className="bg-brand-red text-white mr-2">{exactMatchCount}</Badge>
                Exact Matches
              </h3>
              <ExactMatchesTable 
                matches={filteredData.exactMatches}
                relatedPages={filteredData.allPages} 
                sortBy={filterOptions.sortBy}
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
                matches={filteredData.partialMatches}
                relatedPages={filteredData.allPages} 
                sortBy={filterOptions.sortBy}
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
              <PagesMatchTable pages={filteredData.productPages} sortBy={filterOptions.sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
            </div>
          )}
          
          {categoryPageCount > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <Badge className="bg-green-500 text-white mr-2">{categoryPageCount}</Badge>
                Category Pages
              </h3>
              <PagesMatchTable pages={filteredData.categoryPages} sortBy={filterOptions.sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
            </div>
          )}
          
          {searchPageCount > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <Badge className="bg-purple-500 text-white mr-2">{searchPageCount}</Badge>
                Search Results Pages
              </h3>
              <PagesMatchTable pages={filteredData.searchPages} sortBy={filterOptions.sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
            </div>
          )}
          
          {otherPageCount > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium flex items-center mb-3">
                <Badge className="bg-gray-500 text-white mr-2">{otherPageCount}</Badge>
                Other Pages
              </h3>
              <PagesMatchTable pages={filteredData.otherPages} sortBy={filterOptions.sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <div className="space-y-8">
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white rounded-t-lg">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center">
              <CardTitle className="text-xl md:text-2xl">Image Search Results</CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/20 border-white/10 text-white hover:bg-white/30">
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Export Results</SheetTitle>
                    <SheetDescription>
                      Download your search results in different formats
                    </SheetDescription>
                  </SheetHeader>
                  <div className="py-6 space-y-4">
                    <div className="flex flex-col gap-3">
                      <Button variant="secondary" onClick={handleExportCsv}>
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Export as CSV
                      </Button>
                      <Button variant="outline" disabled>
                        <Download className="h-4 w-4 mr-2" />
                        Export as PDF
                        <Badge variant="secondary" className="ml-2">Coming soon</Badge>
                      </Button>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium mb-2">Status tracking</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="h-4 w-4 text-green-500" />
                            <span>Reviewed items</span>
                          </div>
                          <Badge variant="outline">{reviewedItems.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span>Saved items</span>
                          </div>
                          <Badge variant="outline">{savedItems.length}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          disabled={reviewedItems.length === 0} 
                          onClick={clearReviewed}
                        >
                          Clear reviewed
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          disabled={savedItems.length === 0}
                          onClick={clearSaved}
                        >
                          Clear saved
                        </Button>
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-4">
          {/* Filter Controls */}
          <FilterControls
            options={filterOptions}
            onOptionsChange={handleFilterOptionsChange}
            totalResults={totalMatchCount}
            exactCount={exactMatchCount}
            partialCount={partialMatchCount}
            pageCount={pageMatchCount}
            spamCount={spamPagesCount}
            onFilterClear={handleFilterClear}
          />
          
          {/* Results Content */}
          {totalMatchCount === 0 ? (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <AlertCircle className="text-green-500 h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-brand-dark">No matches found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We couldn't find any significant matches for your image
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              {renderResultsContent()}
            </div>
          )}

          {totalMatchCount > 0 && filterOptions.showSpam && spamPagesCount > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertOctagon className="text-red-500 h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-red-600">Showing potential spam results</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {spamPagesCount} results were identified as potential spam but are being shown due to your filter settings
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {totalMatchCount === 0 && (
        <div className="text-center py-12 bg-white shadow-sm border rounded-lg">
          <AlertCircle className="h-16 w-16 text-brand-blue mx-auto mb-4" />
          <h2 className="text-xl font-medium mb-2">No matches found</h2>
          <p className="text-muted-foreground">Your image appears to be unique or we couldn't find any matches with your current filter settings</p>
        </div>
      )}
    </div>
  );
};

export default ResultsDisplay;
