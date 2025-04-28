
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  SortAsc, 
  SortDesc, 
  Calendar, 
  Globe, 
  BarChart2, 
  Sliders, 
  Filter, 
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';

export type FilterOptions = {
  sortBy: 'confidence' | 'date' | 'domain' | 'count';
  sortOrder: 'asc' | 'desc';
  confidence: number;
  showSpam: boolean;
  minConfidence: number;
  displayMode: 'list' | 'grid' | 'improved';
  groupBy: 'none' | 'domain' | 'type';
  activeFilters: string[];
}

interface FilterControlsProps {
  options: FilterOptions;
  onOptionsChange: (options: Partial<FilterOptions>) => void;
  totalResults: number;
  exactCount: number;
  partialCount: number;
  pageCount: number;
  spamCount?: number;
  onFilterClear?: () => void;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  options,
  onOptionsChange,
  totalResults,
  exactCount,
  partialCount,
  pageCount,
  spamCount = 0,
  onFilterClear
}) => {
  const isMobile = useIsMobile();
  
  const handleSortChange = (value: string) => {
    onOptionsChange({ sortBy: value as FilterOptions['sortBy'] });
  };
  
  const handleSortOrderToggle = () => {
    onOptionsChange({ sortOrder: options.sortOrder === 'asc' ? 'desc' : 'asc' });
  };
  
  const handleGroupByChange = (value: string) => {
    onOptionsChange({ groupBy: value as FilterOptions['groupBy'] });
  };
  
  const handleDisplayModeChange = (value: string) => {
    onOptionsChange({ displayMode: value as FilterOptions['displayMode'] });
  };
  
  const handleConfidenceChange = (value: string) => {
    onOptionsChange({ minConfidence: parseInt(value, 10) });
  };
  
  const handleSpamToggle = () => {
    onOptionsChange({ showSpam: !options.showSpam });
  };
  
  const activeFiltersCount = options.activeFilters?.length || 0;

  return (
    <div className="w-full bg-white rounded-lg shadow border p-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <div className="font-medium text-sm text-gray-700">Results: </div>
          <Badge variant="secondary" className="bg-gray-100">
            {totalResults}
          </Badge>
          
          {exactCount > 0 && (
            <Badge className="bg-brand-red text-white">
              {exactCount} Exact
            </Badge>
          )}
          
          {partialCount > 0 && (
            <Badge className="bg-amber-500 text-white">
              {partialCount} Partial
            </Badge>
          )}
          
          {pageCount > 0 && (
            <Badge className="bg-brand-blue text-white">
              {pageCount} Pages
            </Badge>
          )}
          
          {activeFiltersCount > 0 && (
            <Badge 
              variant="outline" 
              className="flex items-center gap-1 cursor-pointer hover:bg-gray-100"
              onClick={onFilterClear}
            >
              {activeFiltersCount} Filter{activeFiltersCount !== 1 ? 's' : ''}
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 whitespace-nowrap">Sort:</span>
            <Select value={options.sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="confidence">Confidence</SelectItem>
                  <SelectItem value="date">Date Found</SelectItem>
                  <SelectItem value="domain">Domain</SelectItem>
                  <SelectItem value="count"># of Matches</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleSortOrderToggle}
              title={options.sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
            >
              {options.sortOrder === 'asc' ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {!isMobile && <Separator orientation="vertical" className="h-6" />}
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Group:</span>
            <Select value={options.groupBy} onValueChange={handleGroupByChange}>
              <SelectTrigger className="h-8 w-[120px]">
                <SelectValue placeholder="Group by" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="domain">By Domain</SelectItem>
                  <SelectItem value="type">By Match Type</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          {!isMobile && <Separator orientation="vertical" className="h-6" />}
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">View:</span>
            <Select value={options.displayMode} onValueChange={handleDisplayModeChange}>
              <SelectTrigger className="h-8 w-[100px]">
                <SelectValue placeholder="View as" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="grid">Grid</SelectItem>
                  <SelectItem value="improved">Dashboard</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <div className="flex flex-col w-full">
                    <span className="text-sm font-medium mb-1">Min. Confidence</span>
                    <Select value={options.minConfidence.toString()} onValueChange={handleConfidenceChange}>
                      <SelectTrigger className="h-8 w-full">
                        <SelectValue placeholder="Minimum confidence" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="50">50% or higher</SelectItem>
                        <SelectItem value="70">70% or higher</SelectItem>
                        <SelectItem value="80">80% or higher</SelectItem>
                        <SelectItem value="90">90% or higher</SelectItem>
                        <SelectItem value="95">95% or higher</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSpamToggle}
                  className="flex items-center justify-between"
                >
                  <span>Show potential spam</span>
                  <div className={`w-4 h-4 border rounded ${options.showSpam ? 'bg-brand-blue border-brand-blue' : 'border-gray-400'} flex items-center justify-center`}>
                    {options.showSpam && <span className="text-white text-xs">✓</span>}
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {onFilterClear && (
                  <DropdownMenuItem onClick={onFilterClear} className="text-brand-red">
                    <X className="mr-2 h-4 w-4" />
                    <span>Clear all filters</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
