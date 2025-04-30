
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  SlidersHorizontal, 
  Check, 
  X, 
  Grid, 
  LayoutGrid,
  ArrowUpDown,
  Clock,
  Globe
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Type definitions
export interface FilterOptions {
  sortBy: 'confidence' | 'date' | 'domain' | 'count';
  matchType: 'all' | 'exact' | 'partial';
  pageTypes: string[];
  displayMode: 'grid' | 'list' | 'improved';
  minConfidence: number;
  showSpam: boolean;
}

interface FilterControlsProps {
  options: FilterOptions;
  onOptionsChange: (newOptions: FilterOptions) => void;
  onClear: () => void;
  reviewedItems?: string[];
  savedItems?: string[];
  clearReviewed?: () => void;
  clearSaved?: () => void;
}

// Helper for displaying count badges
const CountBadge = ({ count }: { count: number }) => {
  if (count === 0) return null;
  return (
    <Badge variant="outline" className="ml-2 bg-gray-100">
      {count}
    </Badge>
  );
};

export const FilterControls: React.FC<FilterControlsProps> = ({
  options,
  onOptionsChange,
  onClear,
  reviewedItems = [],
  savedItems = [],
  clearReviewed,
  clearSaved
}) => {
  const handleSortChange = (value: string) => {
    onOptionsChange({
      ...options,
      sortBy: value as 'confidence' | 'date' | 'domain' | 'count'
    });
  };
  
  const handleMatchTypeChange = (value: string) => {
    onOptionsChange({
      ...options,
      matchType: value as 'all' | 'exact' | 'partial'
    });
  };
  
  const handleDisplayModeChange = (value: string) => {
    onOptionsChange({
      ...options, 
      displayMode: value as 'grid' | 'list' | 'improved'
    });
  };
  
  const toggleSpamFilter = () => {
    onOptionsChange({
      ...options,
      showSpam: !options.showSpam
    });
  };
  
  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Match Type</h4>
                <Select 
                  value={options.matchType} 
                  onValueChange={handleMatchTypeChange}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Match Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#333333]"> {/* Updated background color */}
                    <SelectItem value="all">All Matches</SelectItem>
                    <SelectItem value="exact">Exact Matches Only</SelectItem>
                    <SelectItem value="partial">Similar Matches Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Display Options</h4>
                <div className="flex items-center justify-between">
                  <Label htmlFor="show-spam" className="text-sm">
                    Show potential spam
                  </Label>
                  <Switch 
                    id="show-spam" 
                    checked={options.showSpam}
                    onCheckedChange={toggleSpamFilter}
                  />
                </div>
              </div>

              {(reviewedItems.length > 0 || savedItems.length > 0) && (
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="font-medium text-sm">Tracked Items</h4>
                  
                  {reviewedItems.length > 0 && clearReviewed && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center">
                        Reviewed items
                        <CountBadge count={reviewedItems.length} />
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={clearReviewed}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                  
                  {savedItems.length > 0 && clearSaved && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm flex items-center">
                        Saved items
                        <CountBadge count={savedItems.length} />
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="h-7 text-xs"
                        onClick={clearSaved}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full" 
                onClick={onClear}
              >
                Reset All Filters
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <Select value={options.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#333333]"> {/* Updated background color */}
            <SelectItem value="confidence">
              <div className="flex items-center">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                <span>By Confidence</span>
              </div>
            </SelectItem>
            <SelectItem value="date">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <span>By Date</span>
              </div>
            </SelectItem>
            <SelectItem value="domain">
              <div className="flex items-center">
                <Globe className="mr-2 h-4 w-4" />
                <span>By Domain</span>
              </div>
            </SelectItem>
            <SelectItem value="count">
              <div className="flex items-center">
                <Badge className="mr-2 h-4 w-4 flex items-center justify-center">
                  <Check className="h-3 w-3" />
                </Badge>
                <span>By Count</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* View mode toggle - grid vs list */}
      <div className="flex items-center border rounded-md">
        <Button
          variant={options.displayMode === 'grid' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 px-2 rounded-l-md rounded-r-none"
          onClick={() => handleDisplayModeChange('grid')}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={options.displayMode !== 'grid' ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 px-2 rounded-l-none rounded-r-md"
          onClick={() => handleDisplayModeChange('improved')}
        >
          <LayoutGrid className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FilterControls;
