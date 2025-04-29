
import React from 'react';
import { ExactMatchesTable } from '../ExactMatchesTable';
import { PagesMatchTable } from '../PagesMatchTable';
import { Badge } from '@/components/ui/badge';
import ResultsGrid from '../ResultsGrid';
import ResultsDashboard from '../ResultsDashboard';
import { AlertOctagon, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

const DEFAULT_ITEMS_TO_SHOW = 8;

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
    <div className="space-y-6">
      <ResultsDashboard 
        data={dashboardData}
        onDomainSelect={onDomainSelect}
      />
      
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-brand-red/10 border-b">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Badge className="bg-brand-red text-white mr-2">{exactMatchCount}</Badge>
              <CardTitle className="text-lg">High Priority Matches</CardTitle>
            </div>
          </div>
          <CardDescription>
            These are direct copies of your image that require immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {exactMatchCount > 0 ? (
            <ExactMatchesTable 
              matches={filteredData.exactMatches}
              relatedPages={filteredData.allPages} 
              sortBy={filterOptions.sortBy}
              initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
            />
          ) : (
            <div className="p-6 text-center">
              <AlertCircle className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-muted-foreground">No high priority matches found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderListView = () => (
    <div>
      {exactMatchCount > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium flex items-center mb-3">
            <Badge className="bg-brand-red text-white mr-2">{exactMatchCount}</Badge>
            Exact Matches
          </h3>
          <ExactMatchesTable 
            matches={filteredData.exactMatches}
            relatedPages={filteredData.allPages} 
            sortBy={filterOptions.sortBy}
            initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
            compact
          />
        </div>
      )}
      
      {partialMatchCount > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium flex items-center mb-3">
            <Badge className="bg-amber-500 text-white mr-2">{partialMatchCount}</Badge>
            Partial Matches
          </h3>
          <ExactMatchesTable 
            matches={filteredData.partialMatches}
            relatedPages={filteredData.allPages} 
            sortBy={filterOptions.sortBy}
            initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
            compact
          />
        </div>
      )}
      
      {productPageCount > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium flex items-center mb-3">
            <Badge className="bg-brand-blue text-white mr-2">{productPageCount}</Badge>
            Product Pages
          </h3>
          <PagesMatchTable pages={filteredData.productPages} sortBy={filterOptions.sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
        </div>
      )}
      
      {categoryPageCount > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium flex items-center mb-3">
            <Badge className="bg-green-500 text-white mr-2">{categoryPageCount}</Badge>
            Category Pages
          </h3>
          <PagesMatchTable pages={filteredData.categoryPages} sortBy={filterOptions.sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
        </div>
      )}
      
      {searchPageCount > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium flex items-center mb-3">
            <Badge className="bg-purple-500 text-white mr-2">{searchPageCount}</Badge>
            Search Results Pages
          </h3>
          <PagesMatchTable pages={filteredData.searchPages} sortBy={filterOptions.sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
        </div>
      )}
      
      {otherPageCount > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-medium flex items-center mb-3">
            <Badge className="bg-gray-500 text-white mr-2">{otherPageCount}</Badge>
            Other Pages
          </h3>
          <PagesMatchTable pages={filteredData.otherPages} sortBy={filterOptions.sortBy} initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} compact />
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (filterOptions.displayMode === 'grid') {
      return renderGridView();
    } else if (filterOptions.displayMode === 'improved') {
      return renderImprovedView();
    } else {
      return renderListView();
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
