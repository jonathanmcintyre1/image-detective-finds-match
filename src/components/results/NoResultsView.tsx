
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { SearchX } from 'lucide-react';

interface NoResultsViewProps {
  isProcessing: boolean;
  customMessage?: string;
}

const NoResultsView: React.FC<NoResultsViewProps> = ({ isProcessing, customMessage }) => {
  if (isProcessing) return null;
  
  return (
    <Card className="border shadow-sm">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-center">
          {customMessage || "No matches found"}
        </h3>
        <p className="text-muted-foreground text-center mt-2 max-w-md">
          Try adjusting your filters or try a different image.
        </p>
      </CardContent>
    </Card>
  );
};

export default NoResultsView;
