
import React from 'react';
import StatCard from './StatCard';
import { PieChart, Globe, ShoppingCart, BarChart } from 'lucide-react';
import { DashboardData } from '@/types/results';

interface StatCardGridProps {
  data: DashboardData;
}

const StatCardGrid: React.FC<StatCardGridProps> = ({ data }) => {
  // Ensure data is properly initialized with defaults to prevent errors
  const safeData = {
    totalMatches: data?.totalMatches || 0,
    domainsCount: data?.domainsCount || 0,
    marketplacesCount: data?.marketplacesCount || 0,
    highestConfidence: data?.highestConfidence || 0,
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <StatCard 
        title="Total Matches" 
        value={safeData.totalMatches} 
        icon={PieChart} 
      />
      <StatCard 
        title="Unique Domains" 
        value={safeData.domainsCount} 
        icon={Globe} 
      />
      <StatCard 
        title="Marketplaces" 
        value={safeData.marketplacesCount} 
        icon={ShoppingCart} 
      />
      <StatCard 
        title="Highest Match" 
        value={`${Math.round(safeData.highestConfidence * 100)}%`} 
        icon={BarChart}
        iconClassName="text-white"
        iconBgClassName="bg-brand-red" 
      />
    </div>
  );
};

export default StatCardGrid;
