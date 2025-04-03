import { supabase } from "@/integrations/supabase/client";

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

interface AverageSearchResult {
  average: number;
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
    // Fix: Use a proper typing for the RPC call
    const { data: averageData, error } = await supabase
      .rpc<null, AverageSearchResult>('average_search_results');
    
    // Fix: Handle the case where data might be null or undefined
    const avgResultsPerSearch = averageData && typeof averageData.average === 'number' ? averageData.average : 0;

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

/**
 * Custom hook to get search statistics
 */
export const useSearchStats = () => {
  const [stats, setStats] = React.useState<SearchStats>({
    totalSearches: 0,
    searchesWithResults: 0,
    searchesNoResults: 0,
    avgResultsPerSearch: 0
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
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
