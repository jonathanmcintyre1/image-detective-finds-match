
import { useCallback } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

interface ExportOptions {
  includeEntities?: boolean;
  includeReviewStatus?: boolean;
  includeSaveStatus?: boolean;
  reviewedItems?: string[];
  savedItems?: string[];
}

export function useResultsExport() {
  // Function to get hostname from URL
  const getHostname = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Export to CSV
  const exportToCsv = useCallback((results: MatchResult, options: ExportOptions = {}) => {
    const {
      includeEntities = false,
      includeReviewStatus = false,
      includeSaveStatus = false,
      reviewedItems = [],
      savedItems = []
    } = options;

    try {
      // Create header row
      let headers = [
        'Match Type',
        'Domain',
        'URL',
        'Page Type',
        'Confidence',
        'Date Found'
      ];

      if (includeReviewStatus) {
        headers.push('Reviewed');
      }

      if (includeSaveStatus) {
        headers.push('Saved');
      }

      if (includeEntities) {
        headers.push('Related Entities');
      }

      let csvContent = headers.join(',') + '\n';

      // Process exact matches (visuallySimilarImages with high confidence)
      const exactMatches = results.visuallySimilarImages.filter(img => img.score >= 0.9);
      exactMatches.forEach(match => {
        let row = [
          'Exact Match',
          getHostname(match.url),
          `"${match.url}"`,
          'Image',
          `${(match.score * 100).toFixed(1)}%`,
          match.dateFound ? format(match.dateFound, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
        ];

        if (includeReviewStatus) {
          row.push(reviewedItems.includes(match.url) ? 'Yes' : 'No');
        }

        if (includeSaveStatus) {
          row.push(savedItems.includes(match.url) ? 'Yes' : 'No');
        }

        if (includeEntities) {
          const relatedEntities = results.webEntities
            .slice(0, 3)
            .map(entity => entity.description)
            .join('; ');
          row.push(`"${relatedEntities}"`);
        }

        csvContent += row.join(',') + '\n';
      });

      // Process partial matches
      const partialMatches = results.visuallySimilarImages.filter(img => img.score >= 0.7 && img.score < 0.9);
      partialMatches.forEach(match => {
        let row = [
          'Partial Match',
          getHostname(match.url),
          `"${match.url}"`,
          'Image',
          `${(match.score * 100).toFixed(1)}%`,
          match.dateFound ? format(match.dateFound, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
        ];

        if (includeReviewStatus) {
          row.push(reviewedItems.includes(match.url) ? 'Yes' : 'No');
        }

        if (includeSaveStatus) {
          row.push(savedItems.includes(match.url) ? 'Yes' : 'No');
        }

        if (includeEntities) {
          row.push('""'); // No specific entities for partial matches
        }

        csvContent += row.join(',') + '\n';
      });

      // Process pages with matching images
      results.pagesWithMatchingImages.forEach(page => {
        let row = [
          'Page with Image',
          getHostname(page.url),
          `"${page.url}"`,
          page.pageType || 'Unknown',
          `${(page.score * 100).toFixed(1)}%`,
          page.dateFound ? format(page.dateFound, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
        ];

        if (includeReviewStatus) {
          row.push(reviewedItems.includes(page.url) ? 'Yes' : 'No');
        }

        if (includeSaveStatus) {
          row.push(savedItems.includes(page.url) ? 'Yes' : 'No');
        }

        if (includeEntities) {
          row.push('""'); // No specific entities for pages
        }

        csvContent += row.join(',') + '\n';
      });

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `image-matches-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('CSV export completed', { 
        description: 'The data has been exported and downloaded' 
      });
      
      return true;
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export data', { 
        description: 'An error occurred while exporting the data' 
      });
      return false;
    }
  }, []);

  return { exportToCsv };
}

export default useResultsExport;
