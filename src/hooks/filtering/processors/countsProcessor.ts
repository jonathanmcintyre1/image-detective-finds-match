
import { FilteredData } from '@/types/results';

/**
 * Calculates various count statistics from filtered data
 */
export const calculateCounts = (
  filteredData: FilteredData | null, 
  spamPagesCount: number = 0
) => {
  if (!filteredData) return {
    exactMatchCount: 0,
    partialMatchCount: 0,
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
  const productPageCount = filteredData.productPages.length;
  const categoryPageCount = filteredData.categoryPages.length;
  const searchPageCount = filteredData.searchPages.length;
  const otherPageCount = filteredData.otherPages.length;
  const pageMatchCount = productPageCount + categoryPageCount + searchPageCount + otherPageCount;
  const totalMatchCount = exactMatchCount + partialMatchCount + pageMatchCount;
  
  return {
    exactMatchCount,
    partialMatchCount,
    productPageCount,
    categoryPageCount,
    searchPageCount,
    otherPageCount,
    pageMatchCount,
    totalMatchCount,
    spamPagesCount
  };
};
