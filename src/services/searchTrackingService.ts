
import { supabase } from '@/integrations/supabase/client';
import { createHash } from 'crypto-js/sha256';

/**
 * Track an image search in Supabase
 * @param imageUrl URL or local hash of the image that was searched
 * @param resultCount Number of results found
 * @returns Promise<void>
 */
export const trackImageSearch = async (
  imageData: string | File, 
  resultCount: number
): Promise<void> => {
  try {
    // Generate a simple hash for the image
    let imageHash = '';
    
    if (typeof imageData === 'string') {
      // For URL-based images, use the URL as the hash
      imageHash = createHash(imageData).toString();
    } else if (imageData instanceof File) {
      // For file-based images, use the file name and size as the hash
      imageHash = createHash(`${imageData.name}-${imageData.size}-${Date.now()}`).toString();
    }
    
    // Save the search to Supabase
    await supabase.from('searches').insert({
      image_hash: imageHash,
      result_count: resultCount
    });
    
    console.log('Image search tracked successfully');
  } catch (error) {
    console.error('Error tracking image search:', error);
  }
};

// Define interface for the average results type
interface AverageSearchResult {
  average: number;
}

/**
 * Get analytics about recent searches
 * @returns Promise with search analytics
 */
export const getSearchAnalytics = async () => {
  try {
    // Get total search count
    const { count: totalSearches } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true });

    // Get searches with results
    const { count: searchesWithResults } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .gt('result_count', 0);

    // Get searches without results
    const { count: searchesWithoutResults } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .eq('result_count', 0);

    // Get average results per search
    // Fix: Properly type the RPC call with both input and output types
    const { data } = await supabase
      .rpc<void, { average: number }>('average_search_results');

    // Fix: Handle the case where data might be null or empty
    const avgResultsPerSearch = data && data.average !== undefined ? data.average : 0;

    return {
      totalSearches,
      searchesWithResults,
      searchesWithoutResults,
      avgResultsPerSearch
    };
  } catch (error) {
    console.error('Error getting search analytics:', error);
    return {
      totalSearches: 0,
      searchesWithResults: 0,
      searchesWithoutResults: 0,
      avgResultsPerSearch: 0
    };
  }
};
