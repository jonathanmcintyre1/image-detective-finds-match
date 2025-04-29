
import React from 'react';
import StatCardGrid from './StatCardGrid';
import MatchDistributionCard from './MatchDistributionCard';
import TopDomainsCard from './TopDomainsCard';
import { DashboardData } from '@/types/results';

interface DashboardLayoutProps {
  data: DashboardData;
  onDomainSelect?: (domain: string) => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ data, onDomainSelect }) => {
  // Safely calculate percentages with null checks and default values
  const exactMatchPercentage = data.totalMatches > 0 
    ? Math.round((data.exactMatches.length / data.totalMatches) * 100) 
    : 0;
    
  const partialMatchPercentage = data.totalMatches > 0 
    ? Math.round((data.partialMatches.length / data.totalMatches) * 100) 
    : 0;
  
  const marketplacePercentage = data.domainsCount > 0 
    ? Math.round((data.marketplacesCount / data.domainsCount) * 100) 
    : 0;
    
  const socialMediaPercentage = data.domainsCount > 0 
    ? Math.round((data.socialMediaCount / data.domainsCount) * 100) 
    : 0;
    
  const ecommercePercentage = data.domainsCount > 0 
    ? Math.round((data.ecommerceCount / data.domainsCount) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      <StatCardGrid data={data} />
      <div className="grid md:grid-cols-3 gap-4">
        <MatchDistributionCard 
          exactMatchCount={data.exactMatches.length}
          exactMatchPercentage={exactMatchPercentage}
          partialMatchCount={data.partialMatches.length}
          partialMatchPercentage={partialMatchPercentage}
          marketplacePercentage={marketplacePercentage}
          socialMediaPercentage={socialMediaPercentage}
          ecommercePercentage={ecommercePercentage}
        />
        <TopDomainsCard 
          topDomains={data.topDomains} 
          onDomainSelect={onDomainSelect} 
        />
      </div>
    </div>
  );
};

export default DashboardLayout;
