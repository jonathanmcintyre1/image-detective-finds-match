
import { MatchResult, WebImage, WebPage } from '@/types/results';
import { isLikelySpam } from '../utils/filterUtils';

/**
 * Processes raw results data to add dates and detect spam
 */
export const processResults = (
  results: MatchResult | null, 
  today: Date = new Date()
): MatchResult | null => {
  if (!results) return null;
  
  // Add dates if missing and detect spam
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
};
