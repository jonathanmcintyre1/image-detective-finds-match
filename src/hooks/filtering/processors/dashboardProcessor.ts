
import { FilteredData, DashboardData } from '@/types/results';
import { getHostname, categorizeWebsite } from '@/utils/domainUtils';

/**
 * Processes filtered data to generate dashboard metrics and statistics
 */
export const createDashboardData = (filteredData: FilteredData | null): DashboardData | null => {
  if (!filteredData) return null;
  
  const exactMatchCount = filteredData.exactMatches.length;
  const partialMatchCount = filteredData.partialMatches.length;
  const totalMatchCount = exactMatchCount + partialMatchCount + 
    filteredData.productPages.length + filteredData.categoryPages.length +
    filteredData.searchPages.length + filteredData.otherPages.length;
  
  // Count unique domains
  const exactDomains = new Set(filteredData.exactMatches.map(m => getHostname(m.url)));
  const partialDomains = new Set(filteredData.partialMatches.map(m => getHostname(m.url)));
  const pageDomains = new Set(filteredData.allPages.map(p => getHostname(p.url)));
  
  const allDomains = new Set([...exactDomains, ...partialDomains, ...pageDomains]);
  
  // Count platform types
  let marketplacesCount = 0;
  let socialMediaCount = 0;
  let ecommerceCount = 0;
  
  // Create top domains list
  const domainStats = new Map<string, { count: number; type: string }>();
  
  // Process all matches to count domains and types
  const processMatchesDomainStats = (matches: any[]) => {
    matches.forEach(match => {
      const domain = getHostname(match.url);
      const type = categorizeWebsite(domain);
      
      if (!domainStats.has(domain)) {
        domainStats.set(domain, { count: 1, type });
      } else {
        const current = domainStats.get(domain)!;
        domainStats.set(domain, { count: current.count + 1, type: current.type });
      }
    });
  };
  
  processMatchesDomainStats(filteredData.exactMatches);
  processMatchesDomainStats(filteredData.partialMatches);
  processMatchesDomainStats(filteredData.allPages);
  
  // Count website types
  for (const [_, data] of domainStats) {
    if (data.type === 'marketplace') marketplacesCount++;
    if (data.type === 'social') socialMediaCount++;
    if (data.type === 'ecommerce') ecommerceCount++;
  }
  
  // Sort and slice top domains
  const topDomains = Array.from(domainStats.entries())
    .map(([domain, data]) => ({
      domain,
      count: data.count,
      type: data.type
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  
  // Find highest confidence score
  const confidenceScores = [
    ...filteredData.exactMatches.map(m => m.score),
    ...filteredData.partialMatches.map(m => m.score),
    ...filteredData.allPages.map(p => p.score)
  ];
  
  const highestConfidence = confidenceScores.length > 0 
    ? Math.max(...confidenceScores)
    : 0;
  
  return {
    totalMatches: totalMatchCount,
    exactMatches: filteredData.exactMatches,
    partialMatches: filteredData.partialMatches,
    domainsCount: allDomains.size,
    marketplacesCount,
    socialMediaCount,
    ecommerceCount,
    highestConfidence,
    topDomains
  };
};
