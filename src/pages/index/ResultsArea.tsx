
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ImageIcon } from 'lucide-react';
import ResultsDisplay from '@/components/ResultsDisplay';
import { MatchResult } from '@/types/results';

interface ResultsAreaProps {
  isProcessing: boolean;
  results: MatchResult | null;
  selectedImage: File | string | null;
}

const ResultsArea: React.FC<ResultsAreaProps> = ({ isProcessing, results, selectedImage }) => {
  // Processing state
  if (isProcessing) {
    return (
      <Card className="border-0 shadow-md h-48 md:h-64 w-full">
        <CardContent className="p-4 md:p-6 h-full flex flex-col items-center justify-center">
          <Loader2 className="h-10 w-10 md:h-12 md:w-12 text-[#333] animate-spin mb-3 md:mb-4" />
          <p className="text-base md:text-lg font-medium">Analyzing image...</p>
          <div className="w-full max-w-xs mt-3 md:mt-4">
            <div className="space-y-2">
              <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2 w-4/5 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-2 w-3/5 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground mt-2 text-center">Scanning web for matching images</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Results available
  if (!isProcessing && results) {
    return (
      <div className="w-full">
        <ResultsDisplay results={results} />
      </div>
    );
  }
  
  // No image selected yet
  if (!isProcessing && !results && !selectedImage) {
    return (
      <Card className="border-0 shadow-md h-48 md:h-64 w-full">
        <CardContent className="p-4 md:p-6 h-full flex flex-col items-center justify-center">
          <ImageIcon className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mb-3 md:mb-4" />
          <p className="text-base md:text-lg font-medium text-brand-dark">No image selected</p>
          <p className="text-xs md:text-sm text-muted-foreground">Upload an image to analyze matches</p>
        </CardContent>
      </Card>
    );
  }
  
  return null;
};

export default ResultsArea;
