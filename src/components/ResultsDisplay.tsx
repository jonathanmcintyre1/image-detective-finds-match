
import React, { useState } from 'react';
import { toast } from 'sonner';
import { MatchResult } from '@/types/results';
import useItemTracking from '@/hooks/useItemTracking';
import useResultsExport from '@/hooks/useResultsExport';
import useResultsFiltering from '@/hooks/useResultsFiltering';
import ResultsSummaryCard from './results/ResultsSummaryCard';
import ResultsContent from './results/ResultsContent';
import LoadingContent from './results/LoadingContent';
import NoResultsAlert from './results/NoResultsAlert';

interface ResultsDisplayProps {
  results: MatchResult | null;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const [today] = useState(new Date());
  const { exportToCsv } = useResultsExport();
  
  // Use our custom hooks for tracking reviewed and saved items
  const { 
    items: reviewedItems, 
    toggleItem: toggleReviewed,
    clearItems: clearReviewed
  } = useItemTracking({ localStorageKey: 'reviewed_items' });
  
  const { 
    items: savedItems, 
    toggleItem: toggleSaved,
    clearItems: clearSaved
  } = useItemTracking({ localStorageKey: 'saved_items' });
  
  const {
    filterOptions,
    handleFilterOptionsChange,
    handleFilterClear,
    filteredData,
    dashboardData,
    counts,
    processedResults
  } = useResultsFiltering(results, today);

  if (!results) return null;

  // Destructure counts for easier access
  const {
    exactMatchCount,
    partialMatchCount,
    similarMatchCount,
    productPageCount,
    categoryPageCount,
    searchPageCount,
    otherPageCount,
    pageMatchCount,
    totalMatchCount,
    spamPagesCount
  } = counts;
  
  const handleExportCsv = () => {
    if (!processedResults) return;
    
    exportToCsv(processedResults, {
      includeReviewStatus: true,
      includeSaveStatus: true,
      reviewedItems,
      savedItems
    });
  };

  const handleDomainSelect = (domain: string) => {
    toast.info(`Filtering for domain: ${domain}`, {
      description: "Results filtered to show only matches from this domain"
    });
    
    // This would be implemented to filter by domain
    // Not fully implemented in this iteration
  };

  return (
    <div className="space-y-8 max-w-90 mx-auto">
      <ResultsSummaryCard
        totalMatchCount={totalMatchCount}
        exactMatchCount={exactMatchCount}
        partialMatchCount={partialMatchCount}
        similarMatchCount={similarMatchCount}
        pageMatchCount={pageMatchCount}
        spamPagesCount={spamPagesCount}
        filterOptions={filterOptions}
        onFilterOptionsChange={handleFilterOptionsChange}
        onFilterClear={handleFilterClear}
        reviewedItems={reviewedItems}
        savedItems={savedItems}
        clearReviewed={clearReviewed}
        clearSaved={clearSaved}
        handleExportCsv={handleExportCsv}
      />
      
      <div className="w-full">
        <LoadingContent isProcessing={false} />
        
        {filteredData && (
          <>
            <NoResultsAlert totalMatchCount={totalMatchCount} />
            
            <ResultsContent
              filterOptions={filterOptions}
              totalMatchCount={totalMatchCount}
              exactMatchCount={exactMatchCount}
              partialMatchCount={partialMatchCount}
              similarMatchCount={similarMatchCount}
              productPageCount={productPageCount}
              categoryPageCount={categoryPageCount}
              searchPageCount={searchPageCount}
              otherPageCount={otherPageCount}
              spamPagesCount={spamPagesCount}
              filteredData={filteredData}
              dashboardData={dashboardData!}
              onDomainSelect={handleDomainSelect}
              reviewedItems={reviewedItems}
              savedItems={savedItems}
              toggleReviewed={toggleReviewed}
              toggleSaved={toggleSaved}
              isProcessing={false}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ResultsDisplay;
