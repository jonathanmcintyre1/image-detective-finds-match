
import React from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ExactMatchesTable } from '../ExactMatchesTable';
import { PagesMatchTable } from '../PagesMatchTable';
import ResultsDashboard from '../ResultsDashboard';
import { WebImage, WebPage, DashboardData } from '@/types/results';
import { FilterOptions } from '../FilterControls';
import NoResultsView from './NoResultsView';

interface ResultsTabbedViewProps {
  filterOptions: FilterOptions;
  exactMatchCount: number;
  partialMatchCount: number;
  pageMatchCount: number;
  filteredData: {
    exactMatches: WebImage[];
    partialMatches: WebImage[];
    allPages: WebPage[];
  };
  dashboardData: DashboardData;
  isProcessing: boolean;
  onDomainSelect: (domain: string) => void;
}

const DEFAULT_ITEMS_TO_SHOW = 10;

const ResultsTabbedView: React.FC<ResultsTabbedViewProps> = ({
  filterOptions,
  exactMatchCount,
  partialMatchCount,
  pageMatchCount,
  filteredData,
  dashboardData,
  isProcessing,
  onDomainSelect
}) => {
  if (exactMatchCount + partialMatchCount + pageMatchCount === 0) {
    return <NoResultsView isProcessing={isProcessing} />;
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="overview" className="flex-1">
          Overview
        </TabsTrigger>
        <TabsTrigger value="exact" className="flex-1">
          Exact Matches <Badge className="ml-2 bg-brand-red">{exactMatchCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="partial" className="flex-1">
          Similar Matches <Badge className="ml-2 bg-amber-500">{partialMatchCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="pages" className="flex-1">
          Web Pages <Badge className="ml-2 bg-brand-blue">{pageMatchCount}</Badge>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="pt-2">
        <ResultsDashboard 
          data={dashboardData}
          onDomainSelect={onDomainSelect}
        />
      </TabsContent>
      
      <TabsContent value="exact" className="pt-2">
        {exactMatchCount > 0 ? (
          <ExactMatchesTable 
            matches={filteredData.exactMatches}
            relatedPages={filteredData.allPages} 
            sortBy={filterOptions.sortBy}
            initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
          />
        ) : (
          <NoResultsView 
            isProcessing={false} 
            customMessage="No exact matches found" 
          />
        )}
      </TabsContent>
      
      <TabsContent value="partial" className="pt-2">
        {partialMatchCount > 0 ? (
          <ExactMatchesTable 
            matches={filteredData.partialMatches}
            relatedPages={filteredData.allPages} 
            sortBy={filterOptions.sortBy}
            initialItemsToShow={DEFAULT_ITEMS_TO_SHOW}
          />
        ) : (
          <NoResultsView 
            isProcessing={false} 
            customMessage="No similar matches found" 
          />
        )}
      </TabsContent>
      
      <TabsContent value="pages" className="pt-2">
        {pageMatchCount > 0 ? (
          <PagesMatchTable 
            pages={filteredData.allPages} 
            sortBy={filterOptions.sortBy} 
            initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} 
          />
        ) : (
          <NoResultsView 
            isProcessing={false} 
            customMessage="No web pages with matching images found" 
          />
        )}
      </TabsContent>
    </Tabs>
  );
};

export default ResultsTabbedView;
