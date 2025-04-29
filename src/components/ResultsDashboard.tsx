
import React from 'react';
import { DashboardData } from '@/types/results';
import DashboardLayout from './dashboard/DashboardLayout';

interface ResultsDashboardProps {
  data: DashboardData;
  onDomainSelect?: (domain: string) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  data, 
  onDomainSelect 
}) => {
  // Ensure data is properly initialized with defaults to prevent errors
  const safeData = {
    totalMatches: data?.totalMatches || 0,
    exactMatches: data?.exactMatches || [],
    partialMatches: data?.partialMatches || [],
    domainsCount: data?.domainsCount || 0,
    marketplacesCount: data?.marketplacesCount || 0,
    socialMediaCount: data?.socialMediaCount || 0,
    ecommerceCount: data?.ecommerceCount || 0,
    highestConfidence: data?.highestConfidence || 0,
    topDomains: data?.topDomains || []
  };
  
  return <DashboardLayout data={safeData} onDomainSelect={onDomainSelect} />;
};

export default ResultsDashboard;
