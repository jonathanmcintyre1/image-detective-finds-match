
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface NoResultsViewProps {
  isProcessing: boolean;
}

const NoResultsView: React.FC<NoResultsViewProps> = ({ isProcessing }) => {
  if (isProcessing) return null;
  
  return (
    <div className="text-center py-12 bg-white shadow-sm border rounded-lg">
      <AlertCircle className="h-16 w-16 text-brand-blue mx-auto mb-4" />
      <h2 className="text-xl font-medium mb-2">No matches found</h2>
      <p className="text-muted-foreground">Your image appears to be unique or we couldn't find any matches with your current filter settings</p>
    </div>
  );
};

export default NoResultsView;
