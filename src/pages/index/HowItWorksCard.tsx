
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HelpCircle, Upload, Search, Sparkles } from 'lucide-react';

const HowItWorksCard: React.FC = () => {
  return (
    <Card className="border-0 shadow-md overflow-hidden mb-4 md:mb-8">
      <CardHeader className="card-gradient-red text-white border-b p-4">
        <div className="flex items-center">
          <HelpCircle className="mr-2 h-5 w-5" />
          <CardTitle className="text-xl md:text-2xl font-semibold leading-none tracking-tight">How It Works</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-b from-gray-200 to-gray-100 rounded-full flex items-center justify-center mb-2 md:mb-3 shadow-md border border-gray-200">
              <Upload className="h-5 w-5 md:h-6 md:w-6 text-[#333]" />
            </div>
            <h3 className="font-medium mb-1 text-sm md:text-base">Upload Your Image</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Upload an image or provide a URL that you want to protect
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-b from-gray-200 to-gray-100 rounded-full flex items-center justify-center mb-2 md:mb-3 shadow-md border border-gray-200">
              <Search className="h-5 w-5 md:h-6 md:w-6 text-[#333]" />
            </div>
            <h3 className="font-medium mb-1 text-sm md:text-base">AI-Powered Scan</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              Our AI scans the web for exact or similar matches to your image
            </p>
          </div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-b from-gray-200 to-gray-100 rounded-full flex items-center justify-center mb-2 md:mb-3 shadow-md border border-gray-200">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-[#333]" />
            </div>
            <h3 className="font-medium mb-1 text-sm md:text-base">Review Results</h3>
            <p className="text-xs md:text-sm text-muted-foreground">
              See where your images appear and take action against unauthorized use
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HowItWorksCard;
