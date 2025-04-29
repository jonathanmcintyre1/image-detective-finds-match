
import React from 'react';
import StatCardGrid from './StatCardGrid';
import MatchDistributionCard from './MatchDistributionCard';
import { TopDomainsCard } from './TopDomainsCard';
import { DashboardData } from '@/types/results';
import { FilterControls } from '../FilterControls';

interface DashboardLayoutProps {
  data: DashboardData;
  onDomainSelect?: (domain: string) => void;
  hideFilters?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ data, onDomainSelect, hideFilters = false }) => {
  if (!data) return null;
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-3 w-full">
        <StatCardGrid
          totalMatches={data.totalMatches}
          exactMatchesCount={data.exactMatches.length}
          partialMatchesCount={data.partialMatches.length}
          domainsCount={data.domainsCount}
          highestConfidence={data.highestConfidence}
        />
      </div>
      
      <div className="lg:col-span-2">
        <MatchDistributionCard
          marketplacesCount={data.marketplacesCount}
          ecommerceCount={data.ecommerceCount}
          socialMediaCount={data.socialMediaCount}
        />
      </div>
      
      <div className="lg:col-span-1">
        <TopDomainsCard
          domains={data.topDomains}
          onDomainSelect={onDomainSelect}
          hideFilters={hideFilters}
        />
      </div>
    </div>
  );
};

export default DashboardLayout;
