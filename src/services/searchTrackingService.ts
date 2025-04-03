
import { supabase } from '@/integrations/supabase/client';

/**
 * Interface for the average search result returned from the Supabase RPC function
 */
interface AverageSearchResult {
  average: number;
}

/**
 * Get search analytics data from the database
 * @returns Object containing search analytics data
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
    
    // Get searches with zero results
    const { count: searchesNoResults } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .eq('result_count', 0);

    // Get average results per search
    const { data, error } = await supabase
      .rpc<AverageSearchResult>('average_search_results');
    
    if (error) {
      console.error('Error getting average search results:', error);
      return {
        totalSearches: totalSearches || 0,
        searchesWithResults: searchesWithResults || 0,
        searchesNoResults: searchesNoResults || 0,
        avgResultsPerSearch: 0
      };
    }
    
    // Handle the case where data might be null or undefined
    const avgResultsPerSearch = data && data.average !== null 
      ? data.average 
      : 0;

    return {
      totalSearches: totalSearches || 0,
      searchesWithResults: searchesWithResults || 0,
      searchesNoResults: searchesNoResults || 0,
      avgResultsPerSearch
    };
  } catch (error) {
    console.error('Error getting search analytics:', error);
    return {
      totalSearches: 0,
      searchesWithResults: 0,
      searchesNoResults: 0,
      avgResultsPerSearch: 0
    };
  }
};

/**
 * Tracks an image search and its result count
 * @param image File or URL of the image being searched
 * @param resultCount Number of results found
 * @returns Object containing success status and total searches count
 */
export const trackImageSearch = async (image: File | string, resultCount: number) => {
  try {
    // Get image metadata
    let source_type = 'url';
    let file_name = '';
    let file_size = 0;
    let file_type = '';
    
    if (typeof image !== 'string') {
      source_type = 'upload';
      file_name = image.name;
      file_size = image.size;
      file_type = image.type;
    } else {
      file_name = image;
    }
    
    // Get user's browser info
    const userAgent = navigator.userAgent;
    const browserInfo = {
      userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
    };
    
    // Insert search record
    const { error } = await supabase
      .from('searches')
      .insert({
        source_type,
        file_name,
        file_size,
        file_type,
        result_count: resultCount,
        browser_info: browserInfo
      });
    
    if (error) {
      console.error('Error tracking search:', error);
      return { success: false };
    }
    
    // Get total search count
    const { count } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true });
    
    // Get searches with zero results
    const { count: zeroResultCount } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .eq('result_count', 0);

    // Get average results per search
    const { data } = await supabase
      .rpc<AverageSearchResult>('average_search_results');
    
    // Handle the case where data might be null or undefined
    const avgResultsPerSearch = data && data.average !== null 
      ? data.average 
      : 0;

    return {
      success: true,
      total_searches: count || 0,
      zero_result_searches: zeroResultCount || 0,
      avg_results_per_search: avgResultsPerSearch
    };
  } catch (error) {
    console.error('Error tracking search:', error);
    return { success: false };
  }
};
