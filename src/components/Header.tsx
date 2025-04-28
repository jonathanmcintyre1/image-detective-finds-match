
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';

const Header = () => {
  const isMobile = useIsMobile();

  return (
    <header className="border-b py-3 bg-gradient-to-r from-brand-dark to-brand-blue/90 shadow-md">
      <div className={`container ${isMobile ? 'max-w-[95%]' : 'max-w-[75%]'} mx-auto flex items-center justify-between`}>
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/02ba20bb-b85e-440c-9a4d-865ee5336758.png" 
            alt="CopyProtect Logo" 
            className="h-10 w-10"
          />
          <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-white uppercase`}>
            CopyProtect
          </h1>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" className="text-white hover:bg-white/20" size="sm">
            <Shield className="h-4 w-4 mr-2" />
            <span className={isMobile ? "sr-only" : ""}>Documentation</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
