
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
import { ChevronDown, ChevronUp } from 'lucide-react';

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
  // State for collapsible sections
  const [pagesSectionOpen, setPagesSectionOpen] = useState(true);
  
  if (exactMatchCount + partialMatchCount + pageMatchCount === 0) {
    return <NoResultsView isProcessing={isProcessing} />;
  }

  return (
    <Tabs defaultValue="exact" className="w-full">
      <TabsList className="w-full mb-6">
        <TabsTrigger value="exact" className="flex-1">
          Exact Matches <Badge className="ml-2 bg-brand-red">{exactMatchCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="partial" className="flex-1">
          Similar Matches <Badge className="ml-2 bg-amber-500">{partialMatchCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="pages" className="flex-1">
          Web Pages <Badge className="ml-2 bg-brand-blue">{pageMatchCount}</Badge>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex-1">
          Analytics
        </TabsTrigger>
      </TabsList>
      
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
          <>
            <h3 className="font-medium text-lg text-left mb-4">Web Pages with Matching Images</h3>
            <Collapsible open={pagesSectionOpen} onOpenChange={setPagesSectionOpen} className="w-full">
              <div className="flex justify-end mb-2">
                <CollapsibleTrigger
                  className="flex items-center text-sm text-brand-blue hover:text-brand-dark transition-colors"
                >
                  {pagesSectionOpen ? (
                    <>
                      <span className="mr-1">Hide pages</span>
                      <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span className="mr-1">Show pages</span>
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <PagesMatchTable 
                  pages={filteredData.allPages} 
                  sortBy={filterOptions.sortBy} 
                  initialItemsToShow={DEFAULT_ITEMS_TO_SHOW} 
                />
              </CollapsibleContent>
            </Collapsible>
          </>
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
