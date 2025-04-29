
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';
import BetaSignupForm from '@/components/BetaSignupForm';

interface BetaSignupCardProps {
  onSuccess: () => void;
}

const BetaSignupCard: React.FC<BetaSignupCardProps> = ({ onSuccess }) => {
  return (
    <Card className="border-0 shadow-md overflow-hidden w-full h-full">
      <CardHeader className="card-gradient-red text-white p-4">
        <div className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          <CardTitle className="text-xl md:text-2xl font-semibold leading-none tracking-tight">Get Early Access</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 flex justify-center">
        <div className="w-full max-w-md">
          <BetaSignupForm onSuccess={onSuccess} />
        </div>
      </CardContent>
    </Card>
  );
};

export default BetaSignupCard;
