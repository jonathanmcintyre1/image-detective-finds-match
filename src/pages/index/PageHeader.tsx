
import React from 'react';

const PageHeader: React.FC = () => {
  return (
    <div className="text-center max-w-2xl mx-auto space-y-2 md:space-y-4">
      <div className="flex items-center justify-center mb-2">
        <div className="relative h-12 w-12 md:h-16 md:w-16 mr-2 md:mr-3">
          <img 
            src="/lovable-uploads/02ba20bb-b85e-440c-9a4d-865ee5336758.png" 
            alt="CopyProtect Logo" 
            className="h-full w-full object-contain drop-shadow-lg"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-brand-dark">
          CopyProtect
        </h1>
      </div>
      <p className="text-base md:text-lg text-muted-foreground px-2">
        Discover unauthorized copies of your images across the web in seconds
      </p>
    </div>
  );
};

export default PageHeader;
