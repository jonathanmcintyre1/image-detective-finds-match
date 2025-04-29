
import { useState, useMemo } from 'react';
import { FilterOptions } from '@/components/FilterControls';
import { MatchResult, FilteredData, DashboardData } from '@/types/results';
import { processResults } from './processors/resultsProcessor';
import { filterResults } from './processors/filterProcessor';
import { createDashboardData } from './processors/dashboardProcessor';
import { calculateCounts } from './processors/countsProcessor';

export const useResultsFiltering = (
  results: MatchResult | null,
  today: Date = new Date()
) => {
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    sortBy: 'confidence',
    sortOrder: 'desc',
    confidence: 0.7,
    showSpam: false,
    minConfidence: 70,
    displayMode: 'list',
    groupBy: 'domain',
    activeFilters: []
  });
  
  // Process the raw data to add dates if missing and detect spam
  const processedResults = useMemo(() => 
    processResults(results, today), 
    [results, today]
  );
  
  // Filter and prepare the data based on filter options
  const filteredData: FilteredData | null = useMemo(() => 
    filterResults(processedResults, filterOptions), 
    [processedResults, filterOptions]
  );
  
  // Create dashboard data from filtered results
  const dashboardData: DashboardData | null = useMemo(() => 
    createDashboardData(filteredData), 
    [filteredData]
  );
  
  // Calculate count metrics
  const counts = useMemo(() => {
    const spamPagesCount = processedResults?.pagesWithMatchingImages.filter(p => p.isSpam).length || 0;
    return calculateCounts(filteredData, spamPagesCount);
  }, [filteredData, processedResults]);

  const handleFilterOptionsChange = (options: Partial<FilterOptions>) => {
    setFilterOptions(prev => ({
      ...prev,
      ...options
    }));
  };
  
  const handleFilterClear = () => {
    setFilterOptions({
      sortBy: 'confidence',
      sortOrder: 'desc',
      confidence: 0.7,
      showSpam: false,
      minConfidence: 70,
      displayMode: 'list',
      groupBy: 'domain',
      activeFilters: []
    });
  };

  return {
    filterOptions,
    handleFilterOptionsChange,
    handleFilterClear,
    filteredData,
    dashboardData,
    counts,
    processedResults
  };
};

export default useResultsFiltering;
