
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  PieChart, 
  BarChart, 
  MonitorSmartphone, 
  Building, 
  ShoppingCart, 
  Globe
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
}

interface DashboardData {
  totalMatches: number;
  exactMatches: WebImage[];
  partialMatches: WebImage[];
  domainsCount: number;
  marketplacesCount: number;
  socialMediaCount: number;
  ecommerceCount: number;
  highestConfidence: number;
  topDomains: { domain: string; count: number; type: string }[];
}

interface ResultsDashboardProps {
  data: DashboardData;
  onDomainSelect?: (domain: string) => void;
}

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ 
  data, 
  onDomainSelect 
}) => {
  const isMobile = useIsMobile();
  const cardClass = isMobile ? "p-3" : "p-4";

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
  
  // Safely calculate percentages with null checks and default values
  const exactMatchPercentage = safeData.totalMatches > 0 
    ? Math.round((safeData.exactMatches.length / safeData.totalMatches) * 100) 
    : 0;
    
  const partialMatchPercentage = safeData.totalMatches > 0 
    ? Math.round((safeData.partialMatches.length / safeData.totalMatches) * 100) 
    : 0;
  
  const marketplacePercentage = safeData.domainsCount > 0 
    ? Math.round((safeData.marketplacesCount / safeData.domainsCount) * 100) 
    : 0;
    
  const socialMediaPercentage = safeData.domainsCount > 0 
    ? Math.round((safeData.socialMediaCount / safeData.domainsCount) * 100) 
    : 0;
    
  const ecommercePercentage = safeData.domainsCount > 0 
    ? Math.round((safeData.ecommerceCount / safeData.domainsCount) * 100) 
    : 0;
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="shadow-sm">
          <CardContent className={`${cardClass} flex items-center justify-between`}>
            <div>
              <div className="text-sm text-muted-foreground">Total Matches</div>
              <div className="text-2xl font-bold">{safeData.totalMatches}</div>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
              <PieChart className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className={`${cardClass} flex items-center justify-between`}>
            <div>
              <div className="text-sm text-muted-foreground">Unique Domains</div>
              <div className="text-2xl font-bold">{safeData.domainsCount}</div>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Globe className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className={`${cardClass} flex items-center justify-between`}>
            <div>
              <div className="text-sm text-muted-foreground">Marketplaces</div>
              <div className="text-2xl font-bold">{safeData.marketplacesCount}</div>
            </div>
            <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className={`${cardClass} flex items-center justify-between`}>
            <div>
              <div className="text-sm text-muted-foreground">Highest Match</div>
              <div className="text-2xl font-bold">{Math.round(safeData.highestConfidence * 100)}%</div>
            </div>
            <div className="h-10 w-10 bg-brand-red rounded-full flex items-center justify-center">
              <BarChart className="h-5 w-5 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Match Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm">Exact Matches</div>
                  <div className="text-sm text-muted-foreground">
                    {safeData.exactMatches.length} ({exactMatchPercentage}%)
                  </div>
                </div>
                <Progress value={exactMatchPercentage} className="h-2 bg-gray-100" />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm">Partial Matches</div>
                  <div className="text-sm text-muted-foreground">
                    {safeData.partialMatches.length} ({partialMatchPercentage}%)
                  </div>
                </div>
                <Progress value={partialMatchPercentage} className="h-2 bg-gray-100" />
              </div>
              
              <div className="pt-2">
                <div className="text-sm font-medium mb-3">Platform Distribution</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border rounded-md p-2 text-center">
                    <div className="mb-1 flex justify-center">
                      <ShoppingCart className="h-4 w-4 text-teal-600" />
                    </div>
                    <div className="text-xs text-muted-foreground">Marketplaces</div>
                    <div className="text-lg font-medium">{marketplacePercentage}%</div>
                  </div>
                  
                  <div className="border rounded-md p-2 text-center">
                    <div className="mb-1 flex justify-center">
                      <MonitorSmartphone className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="text-xs text-muted-foreground">Social Media</div>
                    <div className="text-lg font-medium">{socialMediaPercentage}%</div>
                  </div>
                  
                  <div className="border rounded-md p-2 text-center">
                    <div className="mb-1 flex justify-center">
                      <Building className="h-4 w-4 text-purple-600" />
                    </div>
                    <div className="text-xs text-muted-foreground">E-commerce</div>
                    <div className="text-lg font-medium">{ecommercePercentage}%</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-md font-medium">Top Domains</CardTitle>
          </CardHeader>
          <CardContent className="px-2">
            <ul className="space-y-2">
              {safeData.topDomains && safeData.topDomains.length > 0 ? (
                safeData.topDomains.map((domain, index) => (
                  <li 
                    key={index}
                    className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                    onClick={() => onDomainSelect && onDomainSelect(domain.domain)}
                  >
                    <div className="flex items-center">
                      <span className="w-5 text-center text-muted-foreground mr-2">{index + 1}</span>
                      <span className="font-medium text-sm">{domain.domain}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {domain.count}
                      </Badge>
                    </div>
                    <Badge 
                      className={
                        domain.type === 'marketplace' ? 'bg-teal-100 text-teal-800 hover:bg-teal-200' :
                        domain.type === 'social' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                        domain.type === 'ecommerce' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                        'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }
                      variant="secondary"
                    >
                      {domain.type}
                    </Badge>
                  </li>
                ))
              ) : (
                <li className="text-center p-4 text-muted-foreground">No domain data available</li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResultsDashboard;
