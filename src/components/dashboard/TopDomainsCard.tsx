
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TopDomain {
  domain: string;
  count: number;
  type: string;
}

interface TopDomainsCardProps {
  topDomains: TopDomain[];
  onDomainSelect?: (domain: string) => void;
}

// Extended e-commerce domain patterns to include more custom online shops
const ECOMMERCE_PATTERNS = [
  'boutique', 'shop', 'store', 'market', 'apparel', 'clothing', 
  'fashion', 'wear', 'jewelry', 'accessory', 'accessories',
  'baby', 'kids', 'child', 'children', 'toys', 'cheeky'
];

// Helper function to better detect e-commerce sites
const detectDomainType = (domain: string, assignedType: string): string => {
  const domainLower = domain.toLowerCase();
  
  // Keep marketplace and social categorizations as they are
  if (assignedType === 'marketplace' || assignedType === 'social') {
    return assignedType;
  }
  
  // Check for e-commerce patterns in domain name
  if (ECOMMERCE_PATTERNS.some(pattern => domainLower.includes(pattern))) {
    return 'ecommerce';
  }
  
  // Return original type if no patterns match
  return assignedType;
};

const TopDomainsCard: React.FC<TopDomainsCardProps> = ({ topDomains, onDomainSelect }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">Top Domains</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {topDomains && topDomains.length > 0 ? (
            topDomains.map((domain, index) => {
              // Use the enhanced domain type detection
              const enhancedType = detectDomainType(domain.domain, domain.type);
              
              return (
                <li 
                  key={index}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onDomainSelect && onDomainSelect(domain.domain)}
                >
                  <div className="flex items-start">
                    <span className="text-sm text-muted-foreground w-5 text-center mr-2 mt-0.5">{index + 1}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{domain.domain}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {domain.count} {domain.count === 1 ? 'match' : 'matches'}
                        </Badge>
                        <Badge 
                          className={
                            enhancedType === 'marketplace' ? 'bg-teal-100 text-teal-800 hover:bg-teal-200' :
                            enhancedType === 'social' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
                            enhancedType === 'ecommerce' ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' :
                            'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }
                          variant="secondary"
                        >
                          {enhancedType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })
          ) : (
            <li className="text-center p-4 text-muted-foreground">No domain data available</li>
          )}
        </ul>
      </CardContent>
    </Card>
  );
};

export default TopDomainsCard;
