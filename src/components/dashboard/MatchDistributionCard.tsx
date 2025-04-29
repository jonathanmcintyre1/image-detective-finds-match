
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ShoppingCart, MonitorSmartphone, Building } from 'lucide-react';

interface MatchDistributionCardProps {
  exactMatchCount: number;
  exactMatchPercentage: number;
  partialMatchCount: number;
  partialMatchPercentage: number;
  marketplacePercentage: number;
  socialMediaPercentage: number;
  ecommercePercentage: number;
}

const MatchDistributionCard: React.FC<MatchDistributionCardProps> = ({
  exactMatchCount,
  exactMatchPercentage,
  partialMatchCount,
  partialMatchPercentage,
  marketplacePercentage,
  socialMediaPercentage,
  ecommercePercentage
}) => {
  return (
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
                {exactMatchCount} ({exactMatchPercentage}%)
              </div>
            </div>
            <Progress value={exactMatchPercentage} className="h-2 bg-gray-100" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-sm">Partial Matches</div>
              <div className="text-sm text-muted-foreground">
                {partialMatchCount} ({partialMatchPercentage}%)
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
  );
};

export default MatchDistributionCard;
