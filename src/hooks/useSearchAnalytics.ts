
import { useState, useEffect } from 'react';
import { getSearchAnalytics } from '@/services/searchTrackingService';

interface SearchAnalytics {
  totalSearches: number;
  searchesWithResults: number;
  searchesWithoutResults: number;
  avgResultsPerSearch: number;
  isLoading: boolean;
  error: Error | null;
}

export function useSearchAnalytics() {
  const [analytics, setAnalytics] = useState<SearchAnalytics>({
    totalSearches: 0,
    searchesWithResults: 0,
    searchesWithoutResults: 0,
    avgResultsPerSearch: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await getSearchAnalytics();
        
        // Calculate searches with results
        const searchesWithResults = data.total_searches - data.zero_result_searches;
        
        setAnalytics({
          totalSearches: data.total_searches,
          searchesWithResults: searchesWithResults,
          searchesWithoutResults: data.zero_result_searches,
          avgResultsPerSearch: data.avg_results_per_search,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setAnalytics(prev => ({
          ...prev,
          isLoading: false,
          error: error as Error
        }));
      }
    }

    fetchAnalytics();
  }, []);

  return analytics;
}
