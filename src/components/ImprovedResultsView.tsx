
import React from 'react';

interface WebEntity {
  entityId: string;
  score: number;
  description: string;
}

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
  dateFound?: Date;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
  pageType?: 'product' | 'category' | 'search' | 'unknown';
  matchingImages?: WebImage[];
  dateFound?: Date;
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

interface ImprovedResultsViewProps {
  results: MatchResult;
}

const ImprovedResultsView: React.FC<ImprovedResultsViewProps> = ({ results }) => {
  // Simple implementation to avoid any rendering issues
  return (
    <div>
      <p className="text-muted-foreground text-center p-4">
        The improved results view is now integrated into the main display. Please use the "Dashboard" view option in the filter controls.
      </p>
    </div>
  );
};

export default ImprovedResultsView;
