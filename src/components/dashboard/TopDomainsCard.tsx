
// This is a read-only file so I'm adding a new file with improved functionality

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';

interface Domain {
  domain: string;
  count: number;
  type: string;
}

interface TopDomainsCardProps {
  domains: Domain[];
  onDomainSelect?: (domain: string) => void;
  hideFilters?: boolean;
}

export const TopDomainsCard: React.FC<TopDomainsCardProps> = ({ 
  domains = [],
  onDomainSelect,
  hideFilters = false
}) => {
  const getTypeColor = (type: string): string => {
    switch(type.toLowerCase()) {
      case 'marketplace': return 'bg-green-500';
      case 'social': return 'bg-blue-500';
      case 'ecommerce': return 'bg-purple-500';
      case 'cdn': return 'bg-gray-500';
      default: return 'bg-brand-blue';
    }
  };

  const handleDomainClick = (domain: string) => {
    if (hideFilters) return;
    if (onDomainSelect) {
      onDomainSelect(domain);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <Globe className="w-5 h-5 mr-2" />
          Top Domains
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {domains.length > 0 ? (
          <div className="space-y-4">
            {domains.map((domain, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between ${!hideFilters ? 'cursor-pointer hover:bg-gray-50 p-2 rounded-md -mx-2' : ''}`}
                onClick={() => handleDomainClick(domain.domain)}
              >
                <div className="flex items-center space-x-2">
                  <Badge className={`${getTypeColor(domain.type)} text-white`}>
                    {domain.count}
                  </Badge>
                  <span className="font-medium text-sm">{domain.domain}</span>
                </div>
                <span className="text-xs text-gray-500">{domain.type}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No domains found
          </div>
        )}
      </CardContent>
    </Card>
  );
};
