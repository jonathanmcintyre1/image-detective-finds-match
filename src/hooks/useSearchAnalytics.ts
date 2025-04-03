
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
        setAnalytics({
          totalSearches: data.totalSearches,
          searchesWithResults: data.searchesWithResults,
          searchesWithoutResults: data.searchesNoResults, // Map to the correct property
          avgResultsPerSearch: data.avgResultsPerSearch,
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
