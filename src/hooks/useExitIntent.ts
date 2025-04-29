
import { useState, useEffect, useCallback } from 'react';

interface UseExitIntentOptions {
  threshold?: number;
  maxDisplays?: number;
  exitDelayTime?: number;
  timeoutDelayTime?: number;
  disableOnMobile?: boolean;
}

export function useExitIntent({
  threshold = 20,
  maxDisplays = 1,
  exitDelayTime = 0,
  timeoutDelayTime = 60000, // 1 minute by default
  disableOnMobile = true,
}: UseExitIntentOptions = {}) {
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [displays, setDisplays] = useState(0);
  const [hasUserSeen, setHasUserSeen] = useState(false);

  // Check if exit intent was already shown to a user
  useEffect(() => {
    const hasSeenModal = localStorage.getItem('seen_beta_signup');
    if (hasSeenModal) {
      setHasUserSeen(true);
    }
  }, []);

  // Mouse leave detection logic
  const mouseHandler = useCallback((e: MouseEvent) => {
    if (
      e.clientY <= threshold && 
      displays < maxDisplays && 
      !hasUserSeen
    ) {
      if (exitDelayTime > 0) {
        setTimeout(() => {
          setShouldShowModal(true);
          setDisplays(prev => prev + 1);
        }, exitDelayTime);
      } else {
        setShouldShowModal(true);
        setDisplays(prev => prev + 1);
      }
    }
  }, [displays, exitDelayTime, hasUserSeen, maxDisplays, threshold]);

  useEffect(() => {
    // Skip for mobile if that option is enabled
    if (disableOnMobile && window.innerWidth < 768) {
      return;
    }

    // Set up timeout trigger
    const timeoutTimer = setTimeout(() => {
      if (displays < maxDisplays && !hasUserSeen) {
        setShouldShowModal(true);
        setDisplays(prev => prev + 1);
      }
    }, timeoutDelayTime);

    // Set up exit intent listener
    document.addEventListener('mouseleave', mouseHandler);

    return () => {
      document.removeEventListener('mouseleave', mouseHandler);
      clearTimeout(timeoutTimer);
    };
  }, [disableOnMobile, displays, hasUserSeen, maxDisplays, mouseHandler, timeoutDelayTime]);

  const resetModal = useCallback(() => {
    setShouldShowModal(false);
  }, []);

  return { shouldShowModal, resetModal, hasUserSeen };
}
