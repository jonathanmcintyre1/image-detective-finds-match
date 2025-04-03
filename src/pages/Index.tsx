
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ImageUploader from '@/components/ImageUploader';
import ResultsDisplay from '@/components/ResultsDisplay';
import BetaSignupForm from '@/components/BetaSignupForm';
import { analyzeImage } from '@/services/googleVisionService';
import { trackImageSearch } from '@/services/searchTrackingService';
import { toast } from 'sonner';
import { Loader2, Shield, Image as ImageIcon, AlertCircle, Upload, Sparkles, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [selectedImage, setSelectedImage] = useState<File | string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<MatchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showBetaSignup, setShowBetaSignup] = useState(false);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);

  const handleBetaDialogClose = () => {
    setShowBetaSignup(false);
    localStorage.setItem('seen_beta_signup', 'true');
  };

  // Handle successful beta signup
  const handleBetaSignupSuccess = () => {
    setShowBetaSignup(false);
    localStorage.setItem('seen_beta_signup', 'true');
    toast.success("Thanks for signing up for the beta!", {
      description: "You'll be notified when CopyProtect launches."
    });
  };

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

  const handleImageSelected = async (image: File | string) => {
    setSelectedImage(image);
    setResults(null);
    
    try {
      setIsProcessing(true);
      // We no longer need to pass the API key since it's handled by our edge function
      const result = await analyzeImage('', image);
      setResults(result);
      setHasPerformedSearch(true);
      
      const totalResults = 
        (result.visuallySimilarImages?.length || 0) + 
        (result.pagesWithMatchingImages?.length || 0);
      
      await trackImageSearch(image, totalResults);
      
      // Show beta signup after first successful search if not seen before
      const hasSeenBetaSignup = localStorage.getItem('seen_beta_signup');
      if (!hasSeenBetaSignup) {
        setTimeout(() => {
          setShowBetaSignup(true);
        }, 2000);
      }
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image', {
        description: 'Please check your internet connection and try again.'
      });
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
    <BetaSignupProvider initialValue={showBetaSignup} onChange={setShowBetaSignup}>
      <div className="min-h-screen flex flex-col bg-gray-50 font-sans">
        <Header />
        
        <main className="flex-1 container py-8 space-y-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-8">
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
            <p className="text-xl text-muted-foreground mb-2">
              Discover unauthorized copies of your images across the web in seconds
            </p>
            
            {/* Benefits section - moved from bottom to top */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 text-left">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium mb-1 text-brand-dark">Detect Unauthorized Use</h3>
                <p className="text-sm text-muted-foreground">
                  Find where your images are being used across the internet without permission
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium mb-1 text-brand-dark">Monitor Marketplaces</h3>
                <p className="text-sm text-muted-foreground">
                  Track product images on marketplaces like Amazon, Etsy and more
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <h3 className="font-medium mb-1 text-brand-dark">Preserve Value</h3>
                <p className="text-sm text-muted-foreground">
                  Maintain exclusivity and value of your digital content and products
                </p>
              </div>
            </div>
          </div>
          
          {/* How It Works Section - Moved above results */}
          <Card className="border-0 shadow-md mb-8">
            <CardHeader className="bg-gray-50 border-b">
              <CardTitle className="text-xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
                    <Upload className="h-8 w-8 text-brand-blue" />
                  </div>
                  <h3 className="font-medium mb-2">1. Upload Your Image</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload an image or provide a URL that you want to protect
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-brand-blue" />
                  </div>
                  <h3 className="font-medium mb-2">2. AI-Powered Scan</h3>
                  <p className="text-sm text-muted-foreground">
                    Our AI scans the web for exact or similar matches to your image
                  </p>
                </div>
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-brand-blue" />
                  </div>
                  <h3 className="font-medium mb-2">3. Review Results</h3>
                  <p className="text-sm text-muted-foreground">
                    See where your images appear and take action against unauthorized use
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
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
            </div>
            
            <div className="lg:col-span-2">
              {isProcessing && (
                <Card className="border-0 shadow-md h-64">
                  <CardContent className="p-6 h-full flex flex-col items-center justify-center">
                    <Loader2 className="h-12 w-12 text-brand-blue animate-spin mb-4" />
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
        
        {/* Full width early access section */}
        <div className="w-full bg-gradient-to-r from-[#b1081e] to-[#ea384c] py-12">
          <div className="container mx-auto">
            <div className="max-w-xl mx-auto">
              <BetaSignupForm onSuccess={handleBetaSignupSuccess} />
            </div>
          </div>
        </div>
        
        <footer className="py-6 bg-[#2d2d2d] text-white">
          <div className="container text-center text-sm">
            <div className="flex items-center justify-center gap-2 mb-2">
              <img 
                src="/lovable-uploads/02ba20bb-b85e-440c-9a4d-865ee5336758.png" 
                alt="CopyProtect Logo" 
                className="h-5 w-5"
              />
              <span className="font-medium">CopyProtect</span>
            </div>
            <p>© CopyProtect LLC {new Date().getFullYear()}</p>
          </div>
        </footer>
        
        <Dialog open={showBetaSignup} onOpenChange={handleBetaDialogClose}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>Join Our Exclusive Beta</DialogTitle>
            <DialogDescription>
              Be among the first to access CopyProtect when we launch.
            </DialogDescription>
            <div className="py-4">
              <BetaSignupForm onSuccess={handleBetaSignupSuccess} embedded={true} />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </BetaSignupProvider>
  );
};

export default Index;
