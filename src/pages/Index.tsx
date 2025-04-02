
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import ApiKeyInput from '@/components/ApiKeyInput';
import { analyzeImage } from '@/services/googleVisionService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface WebEntity {
  entityId: string;
  score: number;
  description: string;
}

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
}

interface MatchResult {
  webEntities: WebEntity[];
  visuallySimilarImages: WebImage[];
  pagesWithMatchingImages: WebPage[];
}

const Index = () => {
  const [apiKey, setApiKey] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialize API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('gcv_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  // Update preview URL when selectedImage changes
  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null);
      return;
    }

    if (typeof selectedImage === 'string') {
      setPreviewUrl(selectedImage);
    } else {
      const objectUrl = URL.createObjectURL(selectedImage);
      setPreviewUrl(objectUrl);
      
      // Clean up preview URL when component unmounts or selectedImage changes
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedImage]);

  const handleImageSelected = async (image: File | string) => {
    setSelectedImage(image);
    setResults(null);
    
    if (!apiKey) {
      toast.error('Please set your Google Cloud Vision API key first');
      return;
    }
    
    try {
      setIsProcessing(true);
      const result = await analyzeImage(apiKey, image);
      setResults(result);
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image. Please check your API key and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 container py-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-8">
          <h1 className="text-4xl font-bold">Find Exact Image Matches</h1>
          <p className="text-lg text-muted-foreground">
            Upload an image or enter an image URL to find visually similar images across the web
          </p>
          <div className="flex justify-center">
            <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
          </div>
        </div>
        
        <ImageUploader onImageSelected={handleImageSelected} isProcessing={isProcessing} />
        
        {previewUrl && (
          <div className="max-w-sm mx-auto my-8">
            <div className="aspect-square relative rounded-lg overflow-hidden border shadow-sm">
              <img 
                src={previewUrl}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}
        
        {isProcessing && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium">Analyzing image...</p>
            <p className="text-sm text-muted-foreground">This may take a few seconds</p>
          </div>
        )}
        
        {!isProcessing && results && (
          <div className="mt-8">
            <ResultsDisplay results={results} />
          </div>
        )}
      </main>
      
      <footer className="border-t py-6">
        <div className="container text-center text-sm text-muted-foreground">
          <p>ImageDetective - Powered by Google Cloud Vision API</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
