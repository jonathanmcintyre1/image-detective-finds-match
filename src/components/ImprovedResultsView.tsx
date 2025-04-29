
import React from 'react';
import { WebEntity, WebImage, WebPage, MatchResult } from '@/types/results';

interface ImprovedResultsViewProps {
  results: MatchResult;
}

const ImprovedResultsView: React.FC<ImprovedResultsViewProps> = () => {
  return (
    <div className="text-muted-foreground text-center p-4">
      The improved results view is now integrated into the main display. 
      Please use the "Dashboard" view option in the filter controls.
    </div>
  );
};

export default ImprovedResultsView;
