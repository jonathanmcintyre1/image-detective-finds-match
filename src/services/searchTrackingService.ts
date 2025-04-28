
// Import statements
import { supabase } from '@/integrations/supabase/client';

/**
 * Track an image search in the database
 * 
 * @param image The image that was searched (File or URL)
 * @param resultsCount The number of results found
 */
export const trackImageSearch = async (image: File | string, resultsCount: number): Promise<void> => {
  try {
    // Get image metadata
    let imageType: string;
    let imageName: string | null = null;
    let imageSize: number | null = null;
    
    if (typeof image === 'string') {
      imageType = 'url';
      // Extract domain from URL
      try {
        const url = new URL(image);
        imageName = url.hostname;
      } catch (e) {
        imageName = 'invalid-url';
      }
    } else {
      imageType = 'file';
      imageName = image.name;
      imageSize = image.size;
    }
    
    // Insert search record into database
    const { error } = await supabase
      .from('searches')
      .insert({
        image_hash: imageName,
        result_count: resultsCount,
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error tracking search:', error);
    }
  } catch (error) {
    console.error('Error tracking search:', error);
  }
};

/**
 * Get search statistics
 * @returns Promise with search statistics
 */
export const getSearchStats = async (): Promise<{
  totalSearches: number;
  averageResults: number;
  searchesByType: { type: string; count: number }[];
}> => {
  try {
    // Get total search count
    const { count: totalSearches, error: countError } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    // Get average results count
    const { data: avgData, error: avgError } = await supabase
      .rpc('average_search_results');
    
    if (avgError) {
      throw avgError;
    }
    
    // Get searches by type
    const { data: typeData, error: typeError } = await supabase
      .from('searches')
      .select('image_hash, count');
    
    if (typeError) {
      throw typeError;
    }
    
    // Map the grouped data
    const searchesByType = typeData?.map(item => ({
      type: item.image_hash || 'unknown',
      count: parseInt(String(item.count) || '0', 10)
    })) || [];
    
    return {
      totalSearches: totalSearches || 0,
      averageResults: avgData && avgData[0] ? avgData[0] : 0,
      searchesByType
    };
  } catch (error) {
    console.error('Error getting search stats:', error);
    return {
      totalSearches: 0,
      averageResults: 0,
      searchesByType: []
    };
  }
};

/**
 * Get search analytics data
 * @returns Promise with search analytics data
 */
export const getSearchAnalytics = async (): Promise<{
  totalSearches: number;
  searchesWithResults: number;
  searchesNoResults: number;
  avgResultsPerSearch: number;
}> => {
  try {
    // Get total searches count
    const { count: totalSearches, error: countError } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }

    // Get searches with results
    const { count: searchesWithResults, error: withResultsError } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .gt('result_count', 0);
    
    if (withResultsError) {
      throw withResultsError;
    }

    // Get searches with no results
    const { count: searchesNoResults, error: noResultsError } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .eq('result_count', 0);
    
    if (noResultsError) {
      throw noResultsError;
    }

    // Get average results per search
    const { data: avgData, error: avgError } = await supabase
      .rpc('average_search_results');
    
    if (avgError) {
      throw avgError;
    }

    return {
      totalSearches: totalSearches || 0,
      searchesWithResults: searchesWithResults || 0,
      searchesNoResults: searchesNoResults || 0,
      avgResultsPerSearch: avgData && avgData[0] ? avgData[0] : 0
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
