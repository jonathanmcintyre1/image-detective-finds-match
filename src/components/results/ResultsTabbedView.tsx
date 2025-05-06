
import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ExactMatchesTable } from '../ExactMatchesTable';
import { PagesMatchTable } from '../PagesMatchTable';
import ResultsDashboard from '../ResultsDashboard';
import { WebImage, WebPage, DashboardData } from '@/types/results';
import { FilterOptions } from '../FilterControls';
import NoResultsView from './NoResultsView';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Expand, MinusSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ResultsTabbedViewProps {
  filterOptions: FilterOptions;
  exactMatchCount: number;
  partialMatchCount: number;
  similarMatchCount: number;
  pageMatchCount: number;
  filteredData: {
    exactMatches: WebImage[];
    partialMatches: WebImage[];
    similarMatches: WebImage[];
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
  similarMatchCount,
  pageMatchCount,
  filteredData,
  dashboardData,
  isProcessing,
  onDomainSelect
}) => {
  // State for collapsible sections - default to expanded (open)
  const [pagesSectionOpen, setPagesSectionOpen] = useState(true);
  const [tabsCompressed, setTabsCompressed] = useState(false);
  
  if (exactMatchCount + partialMatchCount + similarMatchCount + pageMatchCount === 0) {
    return <NoResultsView isProcessing={isProcessing} />;
  }

  return (
    <Tabs defaultValue="exact" className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className={`${tabsCompressed ? 'w-auto' : 'w-full'} mb-2`}>
          <TabsTrigger value="exact" className={`${tabsCompressed ? '' : 'flex-1'}`}>
            Exact Matches <Badge className="ml-2 bg-brand-red">{exactMatchCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="partial" className={`${tabsCompressed ? '' : 'flex-1'}`}>
            Partial Matches <Badge className="ml-2 bg-purple-500">{partialMatchCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="similar" className={`${tabsCompressed ? '' : 'flex-1'}`}>
            Similar Matches <Badge className="ml-2 bg-amber-500">{similarMatchCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pages" className={`${tabsCompressed ? '' : 'flex-1'}`}>
            Web Pages <Badge className="ml-2 bg-brand-blue">{pageMatchCount}</Badge>
          </TabsTrigger>
          <TabsTrigger value="analytics" className={`${tabsCompressed ? '' : 'flex-1'}`}>
            Analytics
          </TabsTrigger>
        </TabsList>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setTabsCompressed(!tabsCompressed)}
          className="ml-2"
          title={tabsCompressed ? "Expand tabs" : "Compress tabs"}
        >
          {tabsCompressed ? (
            <Expand className="h-4 w-4" />
          ) : (
            <MinusSquare className="h-4 w-4" />
          )}
        </Button>
      </div>
      
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
            customMessage="No partial matches found" 
          />
        )}
      </TabsContent>

      <TabsContent value="similar" className="pt-2">
        {similarMatchCount > 0 ? (
          <ExactMatchesTable 
            matches={filteredData.similarMatches}
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
      
      <TabsContent value="analytics" className="pt-2">
        <ResultsDashboard 
          data={dashboardData}
          onDomainSelect={onDomainSelect}
          hideFilters={true}
        />
      </TabsContent>
    </Tabs>
  );
};

export default ResultsTabbedView;
