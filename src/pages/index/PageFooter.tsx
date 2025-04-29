
import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

const PageFooter: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <footer className="border-t py-4 md:py-6 bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white mt-6">
      <div className={`container ${isMobile ? 'max-w-full' : 'max-w-[80%]'} mx-auto text-center text-xs md:text-sm`}>
        <div className="flex items-center justify-center gap-2 mb-1 md:mb-2">
          <img 
            src="/lovable-uploads/02ba20bb-b85e-440c-9a4d-865ee5336758.png" 
            alt="CopyProtect Logo" 
            className="h-4 w-4 md:h-5 md:w-5"
          />
          <span className="font-medium">CopyProtect</span>
        </div>
        <p>Powered by Google Cloud Vision API</p>
      </div>
    </footer>
  );
};

export default PageFooter;
