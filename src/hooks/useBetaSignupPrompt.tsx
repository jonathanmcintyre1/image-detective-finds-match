import React, { createContext, useContext, useState, ReactNode, useCallback, useMemo, useRef, useEffect } from 'react';

interface BetaSignupContextType {
  showBetaSignup: boolean;
  setShowBetaSignup: (value: boolean) => void;
}

const BetaSignupContext = createContext<BetaSignupContextType | undefined>(undefined);

export const BetaSignupProvider: React.FC<{
  children: ReactNode;
  initialValue?: boolean;
  onChange?: (value: boolean) => void;
}> = ({ children, initialValue = false, onChange }) => {
  const [showBetaSignup, setInternalShowBetaSignup] = useState(initialValue);
  const isInitialMount = useRef(true);
  const onChangeRef = useRef(onChange);
  
  // Keep the onChange reference updated
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  
  // Handle initialValue changes properly with useRef to avoid infinite loops
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Only update if the initialValue changes after the first render
    if (initialValue !== showBetaSignup) {
      setInternalShowBetaSignup(initialValue);
    }
  }, [initialValue, showBetaSignup]);
  
  // Create the setShowBetaSignup function with useCallback to prevent recreation
  const setShowBetaSignup = useCallback((value: boolean) => {
    if (value !== showBetaSignup) {
      setInternalShowBetaSignup(value);
      
      // Use ref to access the latest onChange callback
      if (onChangeRef.current) {
        onChangeRef.current(value);
      }
    }
  }, [showBetaSignup]);
  
  // Memoize the context value to prevent unnecessary rerenders
  const contextValue = useMemo(() => ({
    showBetaSignup,
    setShowBetaSignup,
  }), [showBetaSignup, setShowBetaSignup]);
  
  return (
    <BetaSignupContext.Provider value={contextValue}>
      {children}
    </BetaSignupContext.Provider>
  );
};

export const useBetaSignupPrompt = () => {
  const context = useContext(BetaSignupContext);
  if (context === undefined) {
    throw new Error('useBetaSignupPrompt must be used within a BetaSignupProvider');
  }
  return context;
};
