
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const isMobile = useIsMobile();

  return (
    <header className="border-b py-3 bg-gradient-to-r from-brand-dark to-brand-blue/90 shadow-md w-full">
      <div className="w-full mx-auto flex items-center justify-between px-4">
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
      </div>
    </header>
  );
};

export default Header;
