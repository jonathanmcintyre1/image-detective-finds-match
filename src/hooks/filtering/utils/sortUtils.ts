
import { WebImage, WebPage } from '@/types/results';
import { FilterOptions } from '@/components/FilterControls';
import { getHostname } from '@/utils/domainUtils';

/**
 * Sorts data based on provided sort options
 */
export const sortData = <T extends { url: string; score: number; dateFound?: Date }>(
  data: T[], 
  options: FilterOptions
): T[] => {
  const { sortBy, sortOrder } = options;
  let sorted = [...data];
  
  switch(sortBy) {
    case "confidence":
      sorted = sorted.sort((a, b) => sortOrder === 'asc' ? a.score - b.score : b.score - a.score);
      break;
    case "date":
      sorted = sorted.sort((a, b) => {
        const dateA = a.dateFound || new Date();
        const dateB = b.dateFound || new Date();
        return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      });
      break;
    case "domain":
      sorted = sorted.sort((a, b) => {
        const domainA = getHostname(a.url);
        const domainB = getHostname(b.url);
        return sortOrder === 'asc' ? domainA.localeCompare(domainB) : domainB.localeCompare(domainA);
      });
      break;
    case "count":
      // Sort by number of matches from same domain
      sorted = sorted.sort((a, b) => {
        const hostnameA = getHostname(a.url);
        const hostnameB = getHostname(b.url);
        const countA = data.filter(m => getHostname(m.url) === hostnameA).length;
        const countB = data.filter(m => getHostname(m.url) === hostnameB).length;
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      });
      break;
  }
  
  return sorted;
};
