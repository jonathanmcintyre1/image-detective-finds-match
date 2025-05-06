
import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import { toast } from 'sonner';
import { analyzeImage } from '@/services/googleVisionService';
import { trackImageSearch } from '@/services/searchTrackingService';
import { BetaSignupProvider } from '@/hooks/useBetaSignupPrompt';
import { useIsMobile } from '@/hooks/use-mobile';
import { useExitIntent } from '@/hooks/useExitIntent';

// Page components
import PageHeader from './index/PageHeader';
import PageFooter from './index/PageFooter';
import HowItWorksCard from './index/HowItWorksCard';
import UploadCard from './index/UploadCard';
import BetaSignupCard from './index/BetaSignupCard';
import ResultsArea from './index/ResultsArea';
import BetaSignupDialog from './index/BetaSignupDialog';

const Index = () => {
  const [selectedImage, setSelectedImage] = useState<File | string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const isMobile = useIsMobile();
  
  // Exit intent hook with increased delay time (120 seconds)
  const { shouldShowModal, resetModal, hasUserSeen } = useExitIntent({
    threshold: 20,
    maxDisplays: 1,
    timeoutDelayTime: 120000, // Increased to 120 seconds (30 seconds more)
    disableOnMobile: true
  });
  
  const [showBetaSignup, setShowBetaSignup] = useState(false);
  
  // Update beta signup state from exit intent
  useEffect(() => {
    if (shouldShowModal) {
      setShowBetaSignup(true);
    }
  }, [shouldShowModal]);

  const handleBetaDialogClose = useCallback(() => {
    setShowBetaSignup(false);
    localStorage.setItem('seen_beta_signup', 'true');
    resetModal();
  }, [resetModal]);

  const handleBetaSignupSuccess = useCallback(() => {
    setShowBetaSignup(false);
    localStorage.setItem('seen_beta_signup', 'true');
    resetModal();
    toast.success("Thanks for signing up for the beta!", {
      description: "You'll be notified when CopyProtect launches."
    });
  }, [resetModal]);

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
    
    try {
      console.log("Starting image analysis");
      setIsProcessing(true);
      const result = await analyzeImage(image);
      setResults(result);
      setHasPerformedSearch(true);
      
      const totalResults = 
        (result.visuallySimilarImages?.length || 0) + 
        (result.pagesWithMatchingImages?.length || 0);
      
      await trackImageSearch(image, totalResults);
      
      // Show beta signup only if user hasn't seen it yet and after 30 more seconds
      if (!hasUserSeen && !localStorage.getItem('seen_beta_signup')) {
        const timer = setTimeout(() => {
          setShowBetaSignup(true);
        }, 30000); // 30 seconds delay
        return () => clearTimeout(timer);
      }
      
    } catch (error) {
      console.error('Error analyzing image:', error);
      toast.error('Failed to analyze image. Please try again later.');
    } finally {
      setIsProcessing(false);
    }
  }, [hasUserSeen]);

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
        
        <main className="flex-1 w-11/12 max-w-90 mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8">
          <PageHeader />
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
