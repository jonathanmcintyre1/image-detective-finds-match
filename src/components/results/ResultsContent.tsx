
import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ResultsGrid from '../ResultsGrid';
import ResultsTabbedView from './ResultsTabbedView';
import { FilterOptions } from '../FilterControls';
import { WebImage, WebPage } from '@/types/results';
import NoResultsView from './NoResultsView';

interface ResultsContentProps {
  filterOptions: FilterOptions;
  totalMatchCount: number;
  exactMatchCount: number;
  partialMatchCount: number;
  productPageCount: number;
  categoryPageCount: number;
  searchPageCount: number;
  otherPageCount: number;
  spamPagesCount: number;
  filteredData: {
    exactMatches: WebImage[];
    partialMatches: WebImage[];
    productPages: WebPage[];
    categoryPages: WebPage[];
    searchPages: WebPage[];
    otherPages: WebPage[];
    allPages: WebPage[];
  };
  dashboardData: {
    totalMatches: number;
    exactMatches: WebImage[];
    partialMatches: WebImage[];
    domainsCount: number;
    marketplacesCount: number;
    socialMediaCount: number;
    ecommerceCount: number;
    highestConfidence: number;
    topDomains: { domain: string; count: number; type: string }[];
  };
  onDomainSelect: (domain: string) => void;
  reviewedItems: string[];
  savedItems: string[];
  toggleReviewed: (url: string) => void;
  toggleSaved: (url: string) => void;
  isProcessing: boolean;
}

const ResultsContent: React.FC<ResultsContentProps> = ({
  filterOptions,
  totalMatchCount,
  exactMatchCount,
  partialMatchCount,
  productPageCount,
  categoryPageCount,
  searchPageCount,
  otherPageCount,
  spamPagesCount,
  filteredData,
  dashboardData,
  onDomainSelect,
  reviewedItems,
  savedItems,
  toggleReviewed,
  toggleSaved,
  isProcessing
}) => {
  if (totalMatchCount === 0) {
    return <NoResultsView isProcessing={isProcessing} />;
  }

  const pageMatchCount = productPageCount + categoryPageCount + searchPageCount + otherPageCount;

  const renderGridView = () => (
    <div className="space-y-6">
      <ResultsGrid 
        matches={[...filteredData.exactMatches, ...filteredData.partialMatches]}
        onMarkAsReviewed={toggleReviewed}
        onToggleSave={toggleSaved}
        reviewedItems={reviewedItems}
        savedItems={savedItems}
      />
    </div>
  );

  const renderImprovedView = () => (
    <ResultsTabbedView
      filterOptions={filterOptions}
      exactMatchCount={exactMatchCount}
      partialMatchCount={partialMatchCount}
      pageMatchCount={pageMatchCount}
      filteredData={{
        exactMatches: filteredData.exactMatches,
        partialMatches: filteredData.partialMatches,
        allPages: filteredData.allPages
      }}
      dashboardData={dashboardData}
      isProcessing={isProcessing}
      onDomainSelect={onDomainSelect}
    />
  );

  const renderContent = () => {
    if (filterOptions.displayMode === 'grid') {
      return renderGridView();
    } else {
      // Both 'improved' and 'list' modes now use the tabbed view
      return renderImprovedView();
    }
  };

  const renderSpamWarning = () => {
    if (!filterOptions.showSpam || spamPagesCount <= 0) return null;
    
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
        <AlertOctagon className="text-red-500 h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium text-red-600">Showing potential spam results</p>
          <p className="text-sm text-muted-foreground mt-1">
            {spamPagesCount} results were identified as potential spam but are being shown due to your filter settings
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-4">
      {renderContent()}
      {renderSpamWarning()}
    </div>
  );
};

export default ResultsContent;
