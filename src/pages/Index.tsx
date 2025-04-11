
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import ApiKeyInput from '@/components/ApiKeyInput';
import BetaSignupForm from '@/components/BetaSignupForm';
import { analyzeImage } from '@/services/googleVisionService';
import { trackImageSearch } from '@/services/searchTrackingService';
import { toast } from 'sonner';
import { Loader2, Shield, Image as ImageIcon, AlertCircle, Upload, Sparkles, Search, UserPlus, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { BetaSignupProvider } from '@/hooks/useBetaSignupPrompt';

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
  pageType?: 'product' | 'category' | 'search' | 'unknown';
  matchingImages?: WebImage[];
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
  const [showBetaSignup, setShowBetaSignup] = useState(false);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const [showApiKeyReminder, setShowApiKeyReminder] = useState(false);

  useEffect(() => {
    const envApiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
    
    if (envApiKey) {
      setApiKey(envApiKey);
      console.log("Using API key from environment variables");
    } else {
      const savedApiKey = localStorage.getItem('gcv_api_key');
      if (savedApiKey) {
        setApiKey(savedApiKey);
        console.log("Using API key from local storage");
      } else {
        console.log("No API key found");
        const timer = setTimeout(() => setShowApiKeyReminder(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleBetaDialogClose = useCallback(() => {
    setShowBetaSignup(false);
    localStorage.setItem('seen_beta_signup', 'true');
  }, []);

  const handleBetaSignupSuccess = useCallback(() => {
    setShowBetaSignup(false);
    localStorage.setItem('seen_beta_signup', 'true');
    toast.success("Thanks for signing up for the beta!", {
      description: "You'll be notified when CopyProtect launches."
    });
  }, []);

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
      
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [selectedImage]);

  const handleImageSelected = useCallback(async (image: File | string) => {
    setSelectedImage(image);
    setResults(null);
    
    if (!apiKey) {
      toast.error('Please set your Google Cloud Vision API key first');
      setShowApiKeyReminder(true);
      return;
    }
    
    try {
      console.log("Starting image analysis with API key:", apiKey.substring(0, 5) + "...");
      setIsProcessing(true);
      const result = await analyzeImage(apiKey, image);
      setResults(result);
      setHasPerformedSearch(true);
      
      const totalResults = 
        (result.visuallySimilarImages?.length || 0) + 
        (result.pagesWithMatchingImages?.length || 0);
      
      await trackImageSearch(image, totalResults);
      
      const hasSeenBetaSignup = localStorage.getItem('seen_beta_signup');
      if (!hasSeenBetaSignup) {
        const timer = setTimeout(() => {
          setShowBetaSignup(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image. Please check your API key and try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [apiKey]);

  const handleApiKeySet = useCallback((key: string) => {
    setApiKey(key);
    setShowApiKeyReminder(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    toast.error("Failed to load image preview", { 
      description: "The image URL might be invalid or inaccessible"
    });
  }, []);

  return (
    <BetaSignupProvider initialValue={showBetaSignup} onChange={setShowBetaSignup}>
      <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
        <Header />
        
        <main className="flex-1 md:max-w-[80%] lg:max-w-[80%] mx-auto py-8 px-4 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-center mb-2">
              <div className="relative h-16 w-16 mr-3">
                <img 
                  src="/lovable-uploads/02ba20bb-b85e-440c-9a4d-865ee5336758.png" 
                  alt="CopyProtect Logo" 
                  className="h-full w-full object-contain drop-shadow-lg"
                />
              </div>
              <h1 className="text-4xl font-bold text-brand-dark">
                CopyProtect
              </h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Discover unauthorized copies of your images across the web in seconds
            </p>
            <div className="flex justify-center mt-4">
              <ApiKeyInput apiKey={apiKey} setApiKey={handleApiKeySet} />
            </div>
          </div>
          
          {showApiKeyReminder && !apiKey && (
            <div className="mb-6">
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  You need to set a Google Cloud Vision API key to use this app. Click "Set API Key" above.
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          <Card className="border-0 shadow-md overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-[#FF4141] to-[#FF7070] text-white border-b">
              <div className="flex items-center">
                <Info className="mr-2 h-5 w-5" />
                <CardTitle className="text-xl font-semibold">How It Works</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-b from-gray-200 to-gray-100 rounded-full flex items-center justify-center mb-3 shadow-md border border-gray-200">
                    <Upload className="h-6 w-6 text-[#333]" />
                  </div>
                  <h3 className="font-medium mb-1">Upload Your Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload an image or provide a URL that you want to protect
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-b from-gray-200 to-gray-100 rounded-full flex items-center justify-center mb-3 shadow-md border border-gray-200">
                    <Search className="h-6 w-6 text-[#333]" />
                  </div>
                  <h3 className="font-medium mb-1">AI-Powered Scan</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI scans the web for exact or similar matches to your image
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-gradient-to-b from-gray-200 to-gray-100 rounded-full flex items-center justify-center mb-3 shadow-md border border-gray-200">
                    <Sparkles className="h-6 w-6 text-[#333]" />
                  </div>
                  <h3 className="font-medium mb-1">Review Results</h3>
                  <p className="text-sm text-muted-foreground">
                    See where your images appear and take action against unauthorized use
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 gap-8">
            <Card className="border-0 shadow-md overflow-hidden w-full" data-upload-section>
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
                    <div className="border rounded-lg overflow-hidden shadow-sm bg-gray-100">
                      {imageError ? (
                        <div className="aspect-video flex items-center justify-center bg-gray-100 p-4">
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Unable to load image preview
                            </AlertDescription>
                          </Alert>
                        </div>
                      ) : (
                        <div className="p-4 flex justify-center items-center bg-gray-50 max-h-60">
                          <img 
                            src={previewUrl}
                            alt="Preview"
                            className="max-h-52 max-w-full object-contain"
                            onError={handleImageError}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md overflow-hidden w-full">
              <CardHeader className="bg-gradient-to-r from-[#FF4141] to-[#FF7070] text-white">
                <div className="flex items-center">
                  <UserPlus className="mr-2 h-5 w-5" />
                  <CardTitle>Get Early Access</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 flex justify-center">
                <div className="w-full max-w-md">
                  <BetaSignupForm onSuccess={handleBetaSignupSuccess} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="w-full">
            {isProcessing && (
              <Card className="border-0 shadow-md h-64 w-full">
                <CardContent className="p-6 h-full flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 text-[#333] animate-spin mb-4" />
                  <p className="text-lg font-medium">Analyzing image...</p>
                  <div className="w-full max-w-xs mt-4">
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-2 w-4/5 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-2 w-3/5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 text-center">Scanning web for matching images</p>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {!isProcessing && results && (
              <div className="w-full">
                <ResultsDisplay results={results} />
              </div>
            )}
            
            {!isProcessing && !results && !selectedImage && (
              <Card className="border-0 shadow-md h-64 w-full">
                <CardContent className="p-6 h-full flex flex-col items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg font-medium text-brand-dark">No image selected</p>
                  <p className="text-sm text-muted-foreground">Upload an image to analyze matches</p>
                </CardContent>
              </Card>
            )}
          </div>
        </main>
        
        <footer className="border-t py-6 bg-gradient-to-r from-brand-dark to-brand-blue/90 text-white">
          <div className="container max-w-[80%] mx-auto text-center text-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img 
                src="/lovable-uploads/02ba20bb-b85e-440c-9a4d-865ee5336758.png" 
                alt="CopyProtect Logo" 
                className="h-5 w-5"
              />
              <span className="font-medium">CopyProtect</span>
            </div>
            <p>Powered by Google Cloud Vision API</p>
          </div>
        </footer>
        
        <Dialog open={showBetaSignup} onOpenChange={handleBetaDialogClose}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Join Our Exclusive Beta</DialogTitle>
            <DialogDescription>
              Be among the first to access CopyProtect when we launch.
            </DialogDescription>
            <div className="py-4">
              <BetaSignupForm onSuccess={handleBetaSignupSuccess} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BetaSignupProvider>
  );
};

export default Index;
