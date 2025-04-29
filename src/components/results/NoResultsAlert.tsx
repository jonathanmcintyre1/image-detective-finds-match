
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert } from '@/components/ui/alert';

interface NoResultsAlertProps {
  totalMatchCount: number;
}

const NoResultsAlert: React.FC<NoResultsAlertProps> = ({ totalMatchCount }) => {
  if (totalMatchCount > 0) return null;
  
  return (
    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
      <AlertCircle className="text-green-500 h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-medium text-brand-dark">No matches found</p>
        <p className="text-sm text-muted-foreground mt-1">
          We couldn't find any significant matches for your image
        </p>
      </div>
    </div>
  );
};

export default NoResultsAlert;
