
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import ApiKeyInput from '@/components/ApiKeyInput';
import { analyzeImage } from '@/services/googleVisionService';
import { toast } from 'sonner';
import { Loader2, Shield, Image as ImageIcon } from 'lucide-react';

interface WebEntity {
  entityId: string;
  score: number;
  description: string;
}

interface WebImage {
  url: string;
  score: number;
  imageUrl?: string;
  platform?: string;
}

interface WebPage {
  url: string;
  score: number;
  pageTitle: string;
  platform?: string;
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
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      
      <main className="flex-1 container py-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-8">
          <div className="flex items-center justify-center mb-2">
            <Shield className="h-8 w-8 text-brand-blue mr-2" />
            <h1 className="text-4xl font-bold uppercase text-brand-dark">CopyProtect</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Upload an image or enter an image URL to discover unauthorized copies across the web
          </p>
          <div className="flex justify-center">
            <ApiKeyInput apiKey={apiKey} setApiKey={setApiKey} />
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h2 className="text-xl font-bold uppercase mb-4 flex items-center text-brand-dark">
                <ImageIcon className="mr-2 h-5 w-5 text-brand-blue" />
                Upload Image
              </h2>
              <ImageUploader onImageSelected={handleImageSelected} isProcessing={isProcessing} />
              
              {previewUrl && (
                <div className="mt-6">
                  <p className="text-sm font-medium mb-2 text-brand-dark">Image Preview:</p>
                  <div className="aspect-square relative rounded-lg overflow-hidden border shadow-sm">
                    <img 
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-bold mb-3 text-brand-dark">How It Works</h3>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex">
                  <span className="h-6 w-6 rounded-full bg-brand-blue text-white flex items-center justify-center mr-2 flex-shrink-0 text-xs font-bold">1</span>
                  <span>Upload your image or provide a URL</span>
                </li>
                <li className="flex">
                  <span className="h-6 w-6 rounded-full bg-brand-blue text-white flex items-center justify-center mr-2 flex-shrink-0 text-xs font-bold">2</span>
                  <span>Our AI scans the web for exact or similar matches</span>
                </li>
                <li className="flex">
                  <span className="h-6 w-6 rounded-full bg-brand-blue text-white flex items-center justify-center mr-2 flex-shrink-0 text-xs font-bold">3</span>
                  <span>Review results and take action if unauthorized use is found</span>
                </li>
              </ol>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {isProcessing && (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border shadow-sm">
                <Loader2 className="h-12 w-12 text-brand-blue animate-spin mb-4" />
                <p className="text-lg font-medium">Analyzing image...</p>
                <p className="text-sm text-muted-foreground">Scanning web for matching images</p>
              </div>
            )}
            
            {!isProcessing && results && (
              <div>
                <ResultsDisplay results={results} />
              </div>
            )}
            
            {!isProcessing && !results && !selectedImage && (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg border shadow-sm h-full">
                <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium text-brand-dark">No image selected</p>
                <p className="text-sm text-muted-foreground">Upload an image to analyze matches</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6 bg-white">
        <div className="container text-center text-sm text-muted-foreground">
          <p>CopyProtect - Powered by Google Cloud Vision API</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
