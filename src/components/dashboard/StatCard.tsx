
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconClassName?: string;
  iconBgClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  iconClassName = "text-gray-600", 
  iconBgClassName = "bg-gray-100" 
}) => {
  const isMobile = useIsMobile();
  const cardClass = isMobile ? "p-3" : "p-4";

  return (
    <Card className="shadow-sm">
      <CardContent className={`${cardClass} flex items-center justify-between`}>
        <div>
          <div className="text-sm text-muted-foreground">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
        <div className={`h-10 w-10 ${iconBgClassName} rounded-full flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconClassName}`} />
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
