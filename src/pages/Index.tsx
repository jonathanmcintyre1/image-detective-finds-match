
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { analyzeImage } from '@/services/googleVisionService';
import { trackImageSearch } from '@/services/searchTrackingService';
import { BetaSignupProvider } from '@/hooks/useBetaSignupPrompt';
import { useIsMobile } from '@/hooks/use-mobile';

// Page components
import PageHeader from './index/PageHeader';
import PageFooter from './index/PageFooter';
import ApiKeyReminder from './index/ApiKeyReminder';
import HowItWorksCard from './index/HowItWorksCard';
import UploadCard from './index/UploadCard';
import BetaSignupCard from './index/BetaSignupCard';
import ResultsArea from './index/ResultsArea';
import BetaSignupDialog from './index/BetaSignupDialog';

const Index = () => {
  const [apiKey, setApiKey] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showBetaSignup, setShowBetaSignup] = useState(false);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const [showApiKeyReminder, setShowApiKeyReminder] = useState(false);
  const isMobile = useIsMobile();

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
        
        <main className={`flex-1 ${isMobile ? 'px-3 py-4 max-w-full' : 'md:max-w-[80%] lg:max-w-[80%] mx-auto py-8 px-4'} space-y-4 md:space-y-8`}>
          <PageHeader apiKey={apiKey} setApiKey={handleApiKeySet} />
          <ApiKeyReminder showApiKeyReminder={showApiKeyReminder} apiKey={apiKey} />
          <HowItWorksCard />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <UploadCard 
              onImageSelected={handleImageSelected}
              isProcessing={isProcessing}
              previewUrl={previewUrl}
              imageError={imageError}
              handleImageError={handleImageError}
            />
            
            <BetaSignupCard onSuccess={handleBetaSignupSuccess} />
          </div>
          
          <div className="w-full">
            <ResultsArea 
              isProcessing={isProcessing} 
              results={results} 
              selectedImage={selectedImage} 
            />
          </div>
        </main>
        
        <PageFooter />
        
        <BetaSignupDialog 
          showBetaSignup={showBetaSignup}
          onOpenChange={setShowBetaSignup}
          onSuccess={handleBetaSignupSuccess}
        />
      </div>
    </BetaSignupProvider>
  );
};

export default Index;
