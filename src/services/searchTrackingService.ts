
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from 'react';

interface SearchRecord {
  id: string;
  created_at: string;
  image_hash: string;
  result_count: number;
  search_type: 'url' | 'file';
  image_type?: string;
}

interface SearchStats {
  totalSearches: number;
  searchesWithResults: number;
  searchesNoResults: number;
  avgResultsPerSearch: number;
}

// Define a proper interface for the RPC function return type
interface AverageSearchResult {
  average: number | null;
}

/**
 * Track an image search in the database
 */
export const trackImageSearch = async (
  image: File | string,
  resultCount: number
): Promise<void> => {
  try {
    // Generate a simple hash for the image
    let imageHash = '';
    let searchType: 'url' | 'file' = 'file';
    let imageType = '';
    
    if (typeof image === 'string') {
      // Handle URL
      imageHash = btoa(image).slice(0, 50);
      searchType = 'url';
    } else {
      // Handle File
      imageHash = btoa(image.name + image.size + image.lastModified).slice(0, 50);
      imageType = image.type;
    }
    
    // Insert search record
    const { error } = await supabase
      .from('searches')
      .insert({
        image_hash: imageHash,
        result_count: resultCount,
        search_type: searchType,
        image_type: imageType
      });
      
    if (error) {
      console.error('Error tracking search:', error);
    }
  } catch (err) {
    console.error('Failed to track search:', err);
  }
};

/**
 * Get statistics about image searches
 */
export const getSearchStats = async (): Promise<SearchStats> => {
  try {
    // Get total number of searches
    const { count: totalSearches } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true });
    
    // Get searches with results
    const { count: searchesWithResults } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .gt('result_count', 0);
    
    // Get searches with no results
    const { count: searchesNoResults } = await supabase
      .from('searches')
      .select('*', { count: 'exact', head: true })
      .eq('result_count', 0);

    // Get average results per search
    // Fix: Provide proper typing for the RPC call
    const { data, error } = await supabase
      .rpc<AverageSearchResult>('average_search_results', {});
    
    // Fix: Properly handle the case where data might be null or undefined
    const avgResultsPerSearch = data && data.average !== null ? data.average : 0;

    return {
      totalSearches: totalSearches || 0,
      searchesWithResults: searchesWithResults || 0,
      searchesNoResults: searchesNoResults || 0,
      avgResultsPerSearch
    };
  } catch (err) {
    console.error('Failed to get search stats:', err);
    return {
      totalSearches: 0,
      searchesWithResults: 0,
      searchesNoResults: 0,
      avgResultsPerSearch: 0
    };
  }
};

// Export for useSearchAnalytics hook
export const getSearchAnalytics = getSearchStats;

/**
 * Custom hook to get search statistics
 */
export const useSearchStats = () => {
  const [stats, setStats] = useState<SearchStats>({
    totalSearches: 0,
    searchesWithResults: 0,
    searchesNoResults: 0,
    avgResultsPerSearch: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const searchStats = await getSearchStats();
        setStats(searchStats);
      } catch (err: any) {
        setError(err);
        console.error('Failed to fetch search stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error
  };
};
