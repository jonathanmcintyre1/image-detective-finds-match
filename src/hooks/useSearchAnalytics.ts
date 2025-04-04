
import { useState, useEffect } from 'react';
import { getSearchAnalytics } from '@/services/searchTrackingService';

interface SearchAnalytics {
  totalSearches: number;
  searchesWithResults: number;
  searchesWithoutResults: number;
  avgResultsPerSearch: number;
  isLoading: boolean;
  error: Error | null;
  searchesByDay: { date: string; count: number; }[];
}

export function useSearchAnalytics() {
  const [analytics, setAnalytics] = useState<SearchAnalytics>({
    totalSearches: 0,
    searchesWithResults: 0,
    searchesWithoutResults: 0,
    avgResultsPerSearch: 0,
    isLoading: true,
    error: null,
    searchesByDay: []
  });

  useEffect(() => {
    let isMounted = true;
    
    async function fetchAnalytics() {
      try {
        const data = await getSearchAnalytics();
        
        // Only update state if component is still mounted
        if (isMounted) {
          setAnalytics({
            totalSearches: data.totalSearches,
            searchesWithResults: data.searchesWithResults || 0,
            searchesWithoutResults: data.searchesWithoutResults || 0,
            avgResultsPerSearch: data.avgResultsPerSearch || 0,
            searchesByDay: data.searchesByDay,
            isLoading: false,
            error: null
          });
        }
      } catch (error) {
        // Only update state if component is still mounted
        if (isMounted) {
          console.error("Error fetching analytics:", error);
          setAnalytics(prev => ({
            ...prev,
            isLoading: false,
            error: error as Error
          }));
        }
      }
    }

    fetchAnalytics();
    
    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
    };
  }, []);

  return analytics;
}
