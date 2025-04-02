
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import ApiKeyInput from '@/components/ApiKeyInput';
import { analyzeImage } from '@/services/googleVisionService';
import { toast } from 'sonner';
import { Loader2, Shield, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  pageType?: 'product' | 'category' | 'unknown';
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
  const [imageError, setImageError] = useState(false);

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

    setImageError(false);
    
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

  const handleImageError = () => {
    setImageError(true);
    toast.error("Failed to load image preview", { 
      description: "The image URL might be invalid or inaccessible"
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
      <Header />
      
      <main className="flex-1 container py-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-4 mb-8">
          <div className="flex items-center justify-center mb-2">
            <div className="relative h-12 w-12 mr-3">
              <img 
                src="/lovable-uploads/c387652c-0c08-4865-bde3-c40cbbf872f5.png" 
                alt="CopyProtect Logo" 
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-4xl font-bold text-brand-dark">
              CopyProtect
            </h1>
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
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white">
                <div className="flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5" />
                  <CardTitle>Upload Image</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ImageUploader onImageSelected={handleImageSelected} isProcessing={isProcessing} />
                
                {previewUrl && (
                  <div className="mt-6">
                    <p className="text-sm font-medium mb-2 text-brand-dark">Image Preview:</p>
                    <div className="border rounded-lg overflow-hidden shadow-sm bg-gray-50">
                      {imageError ? (
                        <div className="aspect-video flex items-center justify-center bg-gray-100 p-4">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error loading image</AlertTitle>
                            <AlertDescription>
                              Unable to load image preview
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : (
                        <AspectRatio ratio={4 / 3} className="bg-muted">
                          <img 
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                            onError={handleImageError}
                          />
                        </AspectRatio>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <CardTitle className="text-base">How It Works</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {isProcessing && (
              <Card className="border-0 shadow-md h-64">
                <CardContent className="p-6 h-full flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 text-brand-blue animate-spin mb-4" />
                  <p className="text-lg font-medium">Analyzing image...</p>
                  <div className="w-full max-w-xs mt-4">
                    <div className="space-y-2">
                      <Skeleton className="h-2 w-full bg-gray-200" />
                      <Skeleton className="h-2 w-4/5 bg-gray-200" />
                      <Skeleton className="h-2 w-3/5 bg-gray-200" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">Scanning web for matching images</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!isProcessing && results && (
              <div>
                <ResultsDisplay results={results} />
              </div>
            )}
            
            {!isProcessing && !results && !selectedImage && (
              <Card className="border-0 shadow-md h-64">
                <CardContent className="p-6 h-full flex flex-col items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-brand-dark">No image selected</p>
                  <p className="text-sm text-muted-foreground">Upload an image to analyze matches</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
      
      <footer className="border-t py-6 bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white">
        <div className="container text-center text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img 
              src="/lovable-uploads/c387652c-0c08-4865-bde3-c40cbbf872f5.png" 
              alt="CopyProtect Logo" 
              className="h-5 w-5"
            />
            <span className="font-medium">CopyProtect</span>
          </div>
          <p>Powered by Google Cloud Vision API</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
