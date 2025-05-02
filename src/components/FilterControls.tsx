
import React from 'react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  ArrowUpDown,
  Clock,
  Globe,
  Hash
} from 'lucide-react';

// Type definitions
export interface FilterOptions {
  sortBy: 'confidence' | 'date' | 'domain' | 'count';
  sortOrder: 'asc' | 'desc';
  matchType?: 'all' | 'exact' | 'partial';
  pageTypes?: string[];
  displayMode: 'grid' | 'list' | 'improved';
  minConfidence: number;
  showSpam: boolean;
  groupBy?: 'domain';
  activeFilters?: string[];
}

interface FilterControlsProps {
  options: FilterOptions;
  onOptionsChange: (newOptions: Partial<FilterOptions>) => void;
  onFilterClear: () => void;
  totalResults?: number;
  exactCount?: number;
  partialCount?: number;
  pageCount?: number;
  spamCount?: number;
}

export const FilterControls: React.FC<FilterControlsProps> = ({
  options,
  onOptionsChange
}) => {
  const handleSortChange = (value: string) => {
    onOptionsChange({
      ...options,
      sortBy: value as 'confidence' | 'date' | 'domain' | 'count'
    });
  };
  
  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={options.sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[160px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 text-white border-gray-700">
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
                <Hash className="mr-2 h-4 w-4" />
                <span>By Count</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default FilterControls;
