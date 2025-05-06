import { useState, useMemo } from 'react';
import { FilterOptions } from '@/components/FilterControls';
import { MatchResult, FilteredData, DashboardData, WebImage, WebPage } from '@/types/results';
import { getHostname, categorizeWebsite } from '@/utils/domainUtils';
import { normalizeUrl } from '@/services/googleVisionService';

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

export const useResultsFiltering = (
  results: MatchResult | null,
  today: Date = new Date()
) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: 'confidence',
    sortOrder: 'desc',
    showSpam: false,
    minConfidence: 65,
    displayMode: 'list',
    groupBy: 'domain',
    activeFilters: []
  });
  
  // Process the raw data to add dates if missing and detect spam
  const processedResults = useMemo(() => {
    if (!results) return null;
    
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
  
  // Filter and sort functions
  const sortData = <T extends { url: string; score: number; dateFound?: Date }>(data: T[], options: FilterOptions): T[] => {
    const { sortBy, sortOrder } = options;
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

  // Filter and prepare the data based on filter options
  const filteredData: FilteredData | null = useMemo(() => {
    if (!processedResults) return null;
    
    const minConfidence = filterOptions.minConfidence / 100;
    
    // Update match categories with new thresholds:
    // Exact matches: >= 0.9 (90%)
    // Partial matches: >= 0.7 and < 0.9 (70-90%) - Updated from 0.75 to 0.7
    // Similar matches: >= 0.65 and < 0.7 (65-70%) - Updated upper bound from 0.75 to 0.7
    const filteredExactMatches = processedResults.visuallySimilarImages
      .filter(img => img.score >= 0.9)
      .filter(img => img.score >= minConfidence);
      
    const filteredPartialMatches = processedResults.visuallySimilarImages
      .filter(img => img.score >= 0.7 && img.score < 0.9) 
      .filter(img => img.score >= minConfidence);
      
    const filteredSimilarMatches = processedResults.visuallySimilarImages
      .filter(img => img.score >= 0.65 && img.score < 0.7) 
      .filter(img => img.score >= minConfidence);
    
    console.log("Filtered matches counts:", {
      exact: filteredExactMatches.length,
      partial: filteredPartialMatches.length,
      similar: filteredSimilarMatches.length
    });
      
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

    return {
      exactMatches: sortData(filteredExactMatches, filterOptions),
      partialMatches: sortData(filteredPartialMatches, filterOptions),
      similarMatches: sortData(filteredSimilarMatches, filterOptions),
      productPages: sortData(filteredProductPages, filterOptions),
      categoryPages: sortData(filteredCategoryPages, filterOptions),
      searchPages: sortData(filteredSearchPages, filterOptions),
      otherPages: sortData(filteredOtherPages, filterOptions),
      allPages: sortData(filteredPages, filterOptions)
    };
  }, [processedResults, filterOptions]);
  
  // Create dashboard data
  const dashboardData: DashboardData | null = useMemo(() => {
    if (!filteredData) return null;
    
    const exactMatchCount = filteredData.exactMatches.length;
    const partialMatchCount = filteredData.partialMatches.length;
    const similarMatchCount = filteredData.similarMatches.length;
    const totalMatchCount = exactMatchCount + partialMatchCount + similarMatchCount + 
      filteredData.productPages.length + filteredData.categoryPages.length +
      filteredData.searchPages.length + filteredData.otherPages.length;
    
    // Count unique domains
    const exactDomains = new Set(filteredData.exactMatches.map(m => getHostname(m.url)));
    const partialDomains = new Set(filteredData.partialMatches.map(m => getHostname(m.url)));
    const similarDomains = new Set(filteredData.similarMatches.map(m => getHostname(m.url)));
    const pageDomains = new Set(filteredData.allPages.map(p => getHostname(p.url)));
    
    const allDomains = new Set([...exactDomains, ...partialDomains, ...similarDomains, ...pageDomains]);
    
    // Count platform types
    let marketplacesCount = 0;
    let socialMediaCount = 0;
    let ecommerceCount = 0;
    
    // Create top domains list
    const domainStats = new Map<string, { count: number; type: string }>();
    
    // Process all matches to count domains and types
    const processMatchesDomainStats = (matches: WebImage[] | WebPage[]) => {
      matches.forEach(match => {
        const domain = getHostname(match.url);
        const type = categorizeWebsite(domain);
        
        if (!domainStats.has(domain)) {
          domainStats.set(domain, { count: 1, type });
        } else {
          const current = domainStats.get(domain)!;
          domainStats.set(domain, { count: current.count + 1, type: current.type });
        }
      });
    };
    
    processMatchesDomainStats(filteredData.exactMatches);
    processMatchesDomainStats(filteredData.partialMatches);
    processMatchesDomainStats(filteredData.similarMatches);
    processMatchesDomainStats(filteredData.allPages);
    
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
    const confidenceScores = [
      ...filteredData.exactMatches.map(m => m.score),
      ...filteredData.partialMatches.map(m => m.score),
      ...filteredData.similarMatches.map(m => m.score),
      ...filteredData.allPages.map(p => p.score)
    ];
    
    const highestConfidence = confidenceScores.length > 0 
      ? Math.max(...confidenceScores)
      : 0;
    
    return {
      totalMatches: totalMatchCount,
      exactMatches: filteredData.exactMatches,
      partialMatches: filteredData.partialMatches,
      similarMatches: filteredData.similarMatches,
      domainsCount: allDomains.size,
      marketplacesCount,
      socialMediaCount,
      ecommerceCount,
      highestConfidence,
      topDomains
    };
  }, [filteredData]);
  
  // Count variables
  const counts = useMemo(() => {
    if (!filteredData) return {
      exactMatchCount: 0,
      partialMatchCount: 0,
      similarMatchCount: 0,
      productPageCount: 0,
      categoryPageCount: 0,
      searchPageCount: 0,
      otherPageCount: 0,
      pageMatchCount: 0,
      totalMatchCount: 0,
      spamPagesCount: 0
    };
    
    const exactMatchCount = filteredData.exactMatches.length;
    const partialMatchCount = filteredData.partialMatches.length;
    const similarMatchCount = filteredData.similarMatches.length;
    const productPageCount = filteredData.productPages.length;
    const categoryPageCount = filteredData.categoryPages.length;
    const searchPageCount = filteredData.searchPages.length;
    const otherPageCount = filteredData.otherPages.length;
    const pageMatchCount = productPageCount + categoryPageCount + searchPageCount + otherPageCount;
    const totalMatchCount = exactMatchCount + partialMatchCount + similarMatchCount + pageMatchCount;
    
    const spamPagesCount = processedResults?.pagesWithMatchingImages.filter(p => p.isSpam).length || 0;
    
    return {
      exactMatchCount,
      partialMatchCount,
      similarMatchCount,
      productPageCount,
      categoryPageCount,
      searchPageCount,
      otherPageCount,
      pageMatchCount,
      totalMatchCount,
      spamPagesCount
    };
  }, [filteredData, processedResults]);

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
      showSpam: false,
      minConfidence: 65,
      displayMode: 'list',
      groupBy: 'domain',
      activeFilters: []
    });
  };

  return {
    filterOptions,
    handleFilterOptionsChange,
    handleFilterClear,
    filteredData,
    dashboardData,
    counts,
    processedResults
  };
};

export default useResultsFiltering;
