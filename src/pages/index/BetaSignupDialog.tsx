
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BetaSignupForm from '@/components/BetaSignupForm';

interface BetaSignupDialogProps {
  showBetaSignup: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  delayInSeconds?: number;
}

const BetaSignupDialog: React.FC<BetaSignupDialogProps> = ({ 
  showBetaSignup,
  onOpenChange,
  onSuccess,
  delayInSeconds = 60 // Default to 60 seconds (1 minute)
}) => {
  useEffect(() => {
    if (showBetaSignup) {
      // Track when the dialog was shown for analytics
      console.log(`Beta signup dialog shown with ${delayInSeconds}s delay`);
    }
  }, [showBetaSignup, delayInSeconds]);
  
  // Only render the dialog when showBetaSignup is true
  if (!showBetaSignup) {
    return null;
  }
  
  return (
    <Dialog open={showBetaSignup} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)] p-4 md:p-6">
        <DialogTitle className="text-lg md:text-xl">Join Our Exclusive Beta</DialogTitle>
        <DialogDescription className="text-sm md:text-base">
          Be among the first to access CopyProtect when we launch.
        </DialogDescription>
        <div className="py-3 md:py-4">
          <BetaSignupForm onSuccess={onSuccess} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BetaSignupDialog;
