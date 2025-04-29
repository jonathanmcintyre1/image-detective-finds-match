
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

const TopDomainsCard: React.FC<TopDomainsCardProps> = ({ topDomains, onDomainSelect }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-md font-medium">Top Domains</CardTitle>
      </CardHeader>
      <CardContent className="px-2">
        <ul className="space-y-2">
          {topDomains && topDomains.length > 0 ? (
            topDomains.map((domain, index) => (
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
  );
};

export default TopDomainsCard;
