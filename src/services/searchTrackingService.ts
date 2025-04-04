
import { supabase } from "@/integrations/supabase/client";

interface SearchLogEntry {
  id?: number;
  image_hash: string;
  search_time: string;
  results_count: number;
}

interface SearchAnalytics {
  totalSearches: number;
  searchesWithResults: number;
  searchesWithoutResults: number;
  avgResultsPerSearch: number;
  searchesByDay: {
    date: string;
    count: number;
  }[];
}

/**
 * Generates a simple hash for an image to use as an identifier
 */
const generateImageHash = async (image: File | string): Promise<string> => {
  let hashSource = '';
  
  if (typeof image === 'string') {
    // If image is a URL, use the URL as the hash source
    hashSource = image;
  } else {
    // If image is a File, use filename and last modified date
    hashSource = `${image.name}-${image.lastModified}`;
  }
  
  // Create a simple hash
  let hash = 0;
  for (let i = 0; i < hashSource.length; i++) {
    const char = hashSource.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash).toString(16);
};

/**
 * Records a search in the database
 */
export const trackImageSearch = async (image: File | string, resultsCount: number): Promise<void> => {
  try {
    // Generate a unique identifier for the image
    const imageHash = await generateImageHash(image);
    
    // Record the search in Supabase
    const { error } = await supabase
      .from('searches')
      .insert({
        image_hash: imageHash,
        created_at: new Date().toISOString(),
        result_count: resultsCount
      });
    
    if (error) {
      console.error('Error recording search:', error);
    }
  } catch (err) {
    console.error('Failed to track search:', err);
    // Don't throw error to prevent affecting user experience
  }
};

/**
 * Retrieves analytics data for searches
 */
export const getSearchAnalytics = async (): Promise<SearchAnalytics> => {
  try {
    // Get total number of searches
    const { data: totalData, error: totalError } = await supabase
      .from('searches')
      .select('id', { count: 'exact' });
    
    if (totalError) {
      console.error('Error fetching total searches:', totalError);
      return { 
        totalSearches: 0, 
        searchesWithResults: 0, 
        searchesWithoutResults: 0,
        avgResultsPerSearch: 0, 
        searchesByDay: [] 
      };
    }

    // Get searches with and without results
    const { data: withResultsData, error: withResultsError } = await supabase
      .from('searches')
      .select('id')
      .gt('result_count', 0)
      .count();

    const searchesWithResults = withResultsData || 0;
    
    // Count searches with no results
    const { data: noResultsData, error: noResultsError } = await supabase
      .from('searches')
      .select('id')
      .eq('result_count', 0)
      .count();
      
    const searchesWithoutResults = noResultsData || 0;
    
    // Get average number of results
    const { data: avgData, error: avgError } = await supabase
      .rpc('average_search_results');
    
    if (avgError) {
      console.error('Error fetching average results:', avgError);
    }
    
    // Get searches by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: dayData, error: dayError } = await supabase
      .from('searches')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString());
    
    if (dayError) {
      console.error('Error fetching searches by day:', dayError);
      return { 
        totalSearches: totalData?.length || 0, 
        searchesWithResults: searchesWithResults as number,
        searchesWithoutResults: searchesWithoutResults as number,
        avgResultsPerSearch: avgData !== null ? Number(avgData) : 0,
        searchesByDay: [] 
      };
    }
    
    // Process day data
    const searchesByDay: { [key: string]: number } = {};
    if (dayData) {
      dayData.forEach(item => {
        const date = new Date(item.created_at || '').toISOString().split('T')[0];
        searchesByDay[date] = (searchesByDay[date] || 0) + 1;
      });
    }
    
    // Convert to array format
    const searchesByDayArray = Object.keys(searchesByDay).map(date => ({
      date,
      count: searchesByDay[date]
    }));
    
    return {
      totalSearches: totalData?.length || 0,
      searchesWithResults: searchesWithResults as number,
      searchesWithoutResults: searchesWithoutResults as number,
      avgResultsPerSearch: avgData !== null ? Number(avgData) : 0,
      searchesByDay: searchesByDayArray
    };
  } catch (err) {
    console.error('Failed to get search analytics:', err);
    return { 
      totalSearches: 0, 
      searchesWithResults: 0, 
      searchesWithoutResults: 0, 
      avgResultsPerSearch: 0, 
      searchesByDay: [] 
    };
  }
};
