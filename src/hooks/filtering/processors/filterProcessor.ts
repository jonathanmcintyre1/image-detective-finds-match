
import { MatchResult, FilteredData } from '@/types/results';
import { FilterOptions } from '@/components/FilterControls';
import { sortData } from '../utils/sortUtils';

/**
 * Processes and filters the results data based on filter options
 */
export const filterResults = (
  processedResults: MatchResult | null, 
  filterOptions: FilterOptions
): FilteredData | null => {
  if (!processedResults) return null;
  
  const minConfidence = filterOptions.minConfidence / 100;
  
  // Filter exact matches
  const filteredExactMatches = processedResults.visuallySimilarImages
    .filter(img => img.score >= 0.9)
    .filter(img => img.score >= minConfidence);
    
  // Filter partial matches  
  const filteredPartialMatches = processedResults.visuallySimilarImages
    .filter(img => img.score >= 0.7 && img.score < 0.9)
    .filter(img => img.score >= minConfidence);
    
  // Filter pages
  const filteredPages = processedResults.pagesWithMatchingImages
    .filter(page => !page.isSpam || filterOptions.showSpam)
    .filter(page => page.score >= minConfidence);
    
  // Further categorize pages by type
  const filteredProductPages = filteredPages.filter(page => page.pageType === 'product');
  const filteredCategoryPages = filteredPages.filter(page => page.pageType === 'category');
  const filteredSearchPages = filteredPages.filter(page => page.pageType === 'search');
  const filteredOtherPages = filteredPages.filter(page => 
    page.pageType !== 'product' && 
    page.pageType !== 'category' && 
    page.pageType !== 'search'
  );

  // Sort all filtered data
  return {
    exactMatches: sortData(filteredExactMatches, filterOptions),
    partialMatches: sortData(filteredPartialMatches, filterOptions),
    productPages: sortData(filteredProductPages, filterOptions),
    categoryPages: sortData(filteredCategoryPages, filterOptions),
    searchPages: sortData(filteredSearchPages, filterOptions),
    otherPages: sortData(filteredOtherPages, filterOptions),
    allPages: sortData(filteredPages, filterOptions)
  };
};
