
import React from 'react';
import StatCard from './StatCard';
import { PieChart, Globe, ShoppingCart, BarChart } from 'lucide-react';

interface StatCardGridProps {
  totalMatches: number;
  exactMatchesCount: number;
  partialMatchesCount: number;
  domainsCount: number;
  highestConfidence: number;
}

const StatCardGrid: React.FC<StatCardGridProps> = ({
  totalMatches,
  exactMatchesCount,
  partialMatchesCount,
  domainsCount,
  highestConfidence
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard 
        title="Total Matches" 
        value={totalMatches} 
        icon={PieChart} 
      />
      <StatCard 
        title="Unique Domains" 
        value={domainsCount} 
        icon={Globe} 
      />
      <StatCard 
        title="Marketplaces" 
        value={exactMatchesCount} 
        icon={ShoppingCart} 
      />
      <StatCard 
        title="Highest Match" 
        value={`${Math.round(highestConfidence * 100)}%`} 
        icon={BarChart}
        iconClassName="text-white"
        iconBgClassName="bg-brand-red" 
      />
    </div>
  );
};

export default StatCardGrid;
