
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, ClipboardList, CheckCircle, Star } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { FilterControls, FilterOptions } from '../FilterControls';

interface ResultsSummaryCardProps {
  totalMatchCount: number;
  exactMatchCount: number;
  partialMatchCount: number;
  pageMatchCount: number;
  spamPagesCount: number;
  filterOptions: FilterOptions;
  onFilterOptionsChange: (options: Partial<FilterOptions>) => void;
  onFilterClear: () => void;
  reviewedItems: string[];
  savedItems: string[];
  clearReviewed: () => void;
  clearSaved: () => void;
  handleExportCsv: () => void;
}

const ResultsSummaryCard: React.FC<ResultsSummaryCardProps> = ({
  totalMatchCount,
  exactMatchCount,
  partialMatchCount,
  pageMatchCount,
  spamPagesCount,
  filterOptions,
  onFilterOptionsChange,
  onFilterClear,
  reviewedItems,
  savedItems,
  clearReviewed,
  clearSaved,
  handleExportCsv
}) => {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white rounded-t-lg">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center">
            <CardTitle className="text-xl md:text-2xl">Image Search Results</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/20 border-white/10 text-white hover:bg-white/30">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Export Results</SheetTitle>
                  <SheetDescription>
                    Download your search results in different formats
                  </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-4">
                  <div className="flex flex-col gap-3">
                    <Button variant="secondary" onClick={handleExportCsv}>
                      <ClipboardList className="h-4 w-4 mr-2" />
                      Export as CSV
                    </Button>
                    <Button variant="outline" disabled>
                      <Download className="h-4 w-4 mr-2" />
                      Export as PDF
                      <Badge variant="secondary" className="ml-2">Coming soon</Badge>
                    </Button>
                  </div>
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium mb-2">Status tracking</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>Reviewed items</span>
                        </div>
                        <Badge variant="outline">{reviewedItems.length}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span>Saved items</span>
                        </div>
                        <Badge variant="outline">{savedItems.length}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        disabled={reviewedItems.length === 0} 
                        onClick={clearReviewed}
                      >
                        Clear reviewed
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        disabled={savedItems.length === 0}
                        onClick={clearSaved}
                      >
                        Clear saved
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        <FilterControls
          options={filterOptions}
          onOptionsChange={onFilterOptionsChange}
          totalResults={totalMatchCount}
          exactCount={exactMatchCount}
          partialCount={partialMatchCount}
          pageCount={pageMatchCount}
          spamCount={spamPagesCount}
          onFilterClear={onFilterClear} {/* This parameter name matches the FilterControlsProps interface */}
        />
      </CardContent>
    </Card>
  );
};

export default ResultsSummaryCard;
