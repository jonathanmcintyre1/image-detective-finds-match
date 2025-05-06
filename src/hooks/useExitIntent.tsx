
import { useState, useEffect, useCallback } from 'react';

interface ExitIntentOptions {
  threshold?: number;
  maxDisplays?: number;
  timeoutDelayTime?: number;
  disableOnMobile?: boolean;
}

export const useExitIntent = ({
  threshold = 20,
  maxDisplays = 1,
  timeoutDelayTime = 150000, // Increased to 150 seconds (2.5 minutes)
  disableOnMobile = false
}: ExitIntentOptions = {}) => {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [hasUserSeen, setHasUserSeen] = useState(false);
  const [displays, setDisplays] = useState(0);

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenBefore = localStorage.getItem('seen_beta_signup') === 'true';
    setHasUserSeen(hasSeenBefore);
    
    // If already seen or on mobile with disable option, don't show
    if (hasSeenBefore || (disableOnMobile && window.innerWidth <= 768)) {
      return;
    }

    // Don't exceed max displays
    if (displays >= maxDisplays) {
      return;
    }

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (
        e.clientY <= threshold && 
        !shouldShowModal && 
        displays < maxDisplays &&
        !localStorage.getItem('seen_beta_signup')
      ) {
        setShouldShowModal(true);
        setDisplays(prev => prev + 1);
        localStorage.setItem('seen_beta_signup', 'true');
      }
    };

    // Set up a timeout to show the modal after specified delay
    let timeoutId: number;
    if (!hasSeenBefore && !shouldShowModal && displays < maxDisplays) {
      timeoutId = window.setTimeout(() => {
        if (!localStorage.getItem('seen_beta_signup')) {
          setShouldShowModal(true);
          setDisplays(prev => prev + 1);
          localStorage.setItem('seen_beta_signup', 'true');
        }
      }, timeoutDelayTime);
    }

    // Add event listeners
    document.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeoutId);
    };
  }, [threshold, shouldShowModal, maxDisplays, displays, disableOnMobile, timeoutDelayTime]);

  const resetModal = useCallback(() => {
    setShouldShowModal(false);
  }, []);

  return { shouldShowModal, resetModal, hasUserSeen };
};
